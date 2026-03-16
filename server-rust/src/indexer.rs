//! Transaction indexer client — fetches swap history from Helius, Triton, or Shyft.
//!
//! Used for Tier 2 position tracking: entry prices, P&L, trade history.

use std::sync::Arc;
use std::time::{Duration, Instant};

use dashmap::DashMap;
use reqwest::Client;
use serde::Deserialize;

use crate::config::IndexerConfig;
use crate::error::TradeError;
use crate::positions::TradeHistoryEntry;

/// Cached trade history for a wallet+mint pair.
struct CachedHistory {
    entries: Vec<TradeHistoryEntry>,
    expires_at: Instant,
}

pub struct IndexerService {
    client: Client,
    config: IndexerConfig,
    cache: Arc<DashMap<String, CachedHistory>>,
}

impl IndexerService {
    pub fn new(client: Client, config: IndexerConfig) -> Self {
        Self { client, config, cache: Arc::new(DashMap::new()) }
    }

    pub fn is_configured(&self) -> bool {
        self.config.enabled && !self.config.api_key.is_empty()
    }

    fn require_configured(&self) -> Result<(), TradeError> {
        if !self.is_configured() {
            return Err(TradeError::IndexerNotConfigured);
        }
        Ok(())
    }

    /// Fetch parsed swap transaction history for a wallet.
    pub async fn get_swap_history(
        &self,
        wallet: &str,
        mint_filter: Option<&str>,
        limit: usize,
    ) -> Result<Vec<TradeHistoryEntry>, TradeError> {
        self.require_configured()?;

        let cache_key = format!("{}:{}", wallet, mint_filter.unwrap_or("all"));
        if let Some(entry) = self.cache.get(&cache_key) {
            if entry.expires_at > Instant::now() {
                let mut entries = entry.entries.clone();
                entries.truncate(limit);
                return Ok(entries);
            }
        }

        let entries = match self.config.provider.as_str() {
            "helius" => self.fetch_helius(wallet, mint_filter).await?,
            "shyft" => self.fetch_shyft(wallet, mint_filter).await?,
            other => return Err(TradeError::ConfigError(
                format!("unsupported indexer provider: {other}"),
            )),
        };

        let ttl = Duration::from_secs(self.config.cache_ttl_secs);
        self.cache.insert(cache_key, CachedHistory {
            entries: entries.clone(),
            expires_at: Instant::now() + ttl,
        });

        let mut result = entries;
        result.truncate(limit);
        Ok(result)
    }

    async fn fetch_helius(
        &self,
        wallet: &str,
        mint_filter: Option<&str>,
    ) -> Result<Vec<TradeHistoryEntry>, TradeError> {
        // Helius Enhanced Transactions API
        let url = format!(
            "{}/v0/addresses/{}/transactions",
            self.config.api_url, wallet
        );
        let resp = self.client.get(&url)
            .query(&[("api-key", self.config.api_key.as_str()), ("type", "SWAP")])
            .timeout(Duration::from_secs(15))
            .send().await
            .map_err(|e| TradeError::ProviderError {
                provider: "helius".into(), message: e.to_string(), source: Some(Box::new(e)),
            })?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(TradeError::ProviderError {
                provider: "helius".into(), message: format!("HTTP error: {body}"), source: None,
            });
        }

        let txs: Vec<HeliusTx> = resp.json().await.map_err(|e| TradeError::ProviderError {
            provider: "helius".into(), message: e.to_string(), source: Some(Box::new(e)),
        })?;

        let mut entries = Vec::new();
        for tx in txs {
            for swap in tx.token_transfers.unwrap_or_default() {
                // Apply mint filter if specified
                if let Some(filter) = mint_filter {
                    if swap.mint != filter { continue; }
                }
                entries.push(TradeHistoryEntry {
                    signature: tx.signature.clone(),
                    timestamp: tx.timestamp.map(|t| {
                        chrono::DateTime::from_timestamp(t, 0)
                            .map(|dt| dt.to_rfc3339())
                            .unwrap_or_default()
                    }).unwrap_or_default(),
                    trade_type: tx.tx_type.clone().unwrap_or_else(|| "swap".into()),
                    input_mint: swap.from_token_account.unwrap_or_default(),
                    output_mint: swap.mint.clone(),
                    input_amount: swap.token_amount.to_string(),
                    output_amount: swap.token_amount.to_string(),
                    price: String::new(), // Calculated by caller
                    source: tx.source.clone().unwrap_or_else(|| "unknown".into()),
                });
            }
        }

        Ok(entries)
    }

    async fn fetch_shyft(
        &self,
        wallet: &str,
        _mint_filter: Option<&str>,
    ) -> Result<Vec<TradeHistoryEntry>, TradeError> {
        let url = format!("{}/sol/v1/transaction/history", self.config.api_url);
        let resp = self.client.get(&url)
            .header("x-api-key", &self.config.api_key)
            .query(&[("network", "mainnet-beta"), ("account", wallet), ("type", "SWAP")])
            .timeout(Duration::from_secs(15))
            .send().await
            .map_err(|e| TradeError::ProviderError {
                provider: "shyft".into(), message: e.to_string(), source: Some(Box::new(e)),
            })?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(TradeError::ProviderError {
                provider: "shyft".into(), message: format!("HTTP error: {body}"), source: None,
            });
        }

        let raw: serde_json::Value = resp.json().await.map_err(|e| TradeError::ProviderError {
            provider: "shyft".into(), message: e.to_string(), source: Some(Box::new(e)),
        })?;

        let txs = raw["result"].as_array().cloned().unwrap_or_default();
        let entries = txs.iter().map(|tx| TradeHistoryEntry {
            signature: tx["signatures"][0].as_str().unwrap_or("").to_string(),
            timestamp: tx["timestamp"].as_str().unwrap_or("").to_string(),
            trade_type: "swap".into(),
            input_mint: tx["actions"][0]["info"]["tokens_swapped"]["in"]["token_address"]
                .as_str().unwrap_or("").to_string(),
            output_mint: tx["actions"][0]["info"]["tokens_swapped"]["out"]["token_address"]
                .as_str().unwrap_or("").to_string(),
            input_amount: tx["actions"][0]["info"]["tokens_swapped"]["in"]["amount"]
                .as_f64().map(|a| a.to_string()).unwrap_or_default(),
            output_amount: tx["actions"][0]["info"]["tokens_swapped"]["out"]["amount"]
                .as_f64().map(|a| a.to_string()).unwrap_or_default(),
            price: String::new(),
            source: tx["source"].as_str().unwrap_or("shyft").to_string(),
        }).collect();

        Ok(entries)
    }
}

// --- Helius response types ---

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct HeliusTx {
    signature: String,
    timestamp: Option<i64>,
    #[serde(rename = "type")]
    tx_type: Option<String>,
    source: Option<String>,
    token_transfers: Option<Vec<HeliusTokenTransfer>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct HeliusTokenTransfer {
    mint: String,
    token_amount: f64,
    from_token_account: Option<String>,
}
