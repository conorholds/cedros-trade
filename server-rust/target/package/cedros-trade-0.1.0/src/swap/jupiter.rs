use std::sync::Arc;
use std::time::{Duration, Instant};

use async_trait::async_trait;
use dashmap::DashMap;
use reqwest::Client;
use serde::Deserialize;
use tracing::{debug, warn};

use super::SwapProvider;
use crate::config::JupiterConfig;
use crate::error::TradeError;
use crate::stats::SwapStats;
use crate::types::{
    ProviderCapabilities, ProviderHealth, QuoteParams, SwapQuote, SwapTransaction,
};

struct CachedQuote {
    quote: SwapQuote,
    expires_at: Instant,
}

pub struct JupiterProvider {
    client: Client,
    config: JupiterConfig,
    default_slippage_bps: u32,
    quote_cache: Arc<DashMap<String, CachedQuote>>,
    stats: Arc<SwapStats>,
}

impl JupiterProvider {
    pub fn new(client: Client, config: JupiterConfig, default_slippage_bps: u32, stats: Arc<SwapStats>) -> Self {
        Self { client, config, default_slippage_bps, quote_cache: Arc::new(DashMap::new()), stats }
    }

    fn cache_key(params: &QuoteParams, slippage: u32) -> String {
        format!("{}:{}:{}:{}", params.input_mint, params.output_mint, params.amount, slippage)
    }
}

#[async_trait]
impl SwapProvider for JupiterProvider {
    fn name(&self) -> &str { "jupiter" }

    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            name: "jupiter".into(), gasless: false, mev_protected: false, supports_exact_out: true,
        }
    }

    async fn quote(&self, params: &QuoteParams) -> Result<SwapQuote, TradeError> {
        super::validate_mint(&params.input_mint)?;
        super::validate_mint(&params.output_mint)?;
        super::validate_amount(&params.amount)?;

        let slippage = params.slippage_bps.unwrap_or(self.default_slippage_bps);
        let key = Self::cache_key(params, slippage);

        if let Some(entry) = self.quote_cache.get(&key) {
            if entry.expires_at > Instant::now() {
                debug!("jupiter quote cache hit");
                self.stats.record_cache_hit();
                return Ok(entry.quote.clone());
            }
        }
        self.stats.record_cache_miss();

        let url = format!("{}/quote", self.config.api_url);
        let resp = self.client.get(&url)
            .query(&[
                ("inputMint", params.input_mint.as_str()),
                ("outputMint", params.output_mint.as_str()),
                ("amount", params.amount.as_str()),
                ("slippageBps", &slippage.to_string()),
                // Prevent routing through illiquid intermediate tokens (Jupiter best practice)
                ("restrictIntermediateTokens", "true"),
            ])
            .timeout(Duration::from_secs(10))
            .send().await
            .map_err(|e| if e.is_timeout() {
                TradeError::UpstreamTimeout("jupiter quote".into())
            } else {
                TradeError::ProviderError { provider: "jupiter".into(), message: e.to_string(), source: Some(Box::new(e)) }
            })?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            warn!(status = %status, body = %body, "jupiter quote error");
            return Err(TradeError::ProviderError {
                provider: "jupiter".into(), message: format!("HTTP {status}: {body}"), source: None,
            });
        }

        let raw: serde_json::Value = resp.json().await.map_err(|e| TradeError::ProviderError {
            provider: "jupiter".into(), message: format!("failed to parse quote: {e}"), source: Some(Box::new(e)),
        })?;

        let jq: JupiterQuoteResponse = serde_json::from_value(raw.clone()).map_err(|e| {
            TradeError::ProviderError { provider: "jupiter".into(), message: format!("quote schema: {e}"), source: None }
        })?;

        let quote = SwapQuote {
            provider: "jupiter".into(),
            input_mint: jq.input_mint,
            output_mint: jq.output_mint,
            in_amount: jq.in_amount,
            out_amount: jq.out_amount,
            other_amount_threshold: jq.other_amount_threshold,
            price_impact_pct: jq.price_impact_pct.parse::<f64>().unwrap_or(0.0),
            slippage_bps: slippage,
            route_data: Some(raw.clone()),
            gasless: false,
        };

        let ttl = Duration::from_secs(self.config.quote_cache_ttl_secs);
        self.quote_cache.insert(key, CachedQuote {
            quote: quote.clone(), expires_at: Instant::now() + ttl,
        });

        Ok(quote)
    }

    async fn build(&self, quote: &SwapQuote, user_public_key: &str) -> Result<SwapTransaction, TradeError> {
        if quote.provider != "jupiter" {
            return Err(TradeError::BadRequest("quote is not from jupiter".into()));
        }

        let raw_quote = quote.route_data.as_ref().ok_or_else(|| {
            TradeError::BadRequest("jupiter quote missing route_data (raw quoteResponse)".into())
        })?;

        let url = format!("{}/swap", self.config.api_url);
        let body = serde_json::json!({
            "quoteResponse": raw_quote,
            "userPublicKey": user_public_key,
            // Jupiter best practices for transaction landing:
            "dynamicComputeUnitLimit": true,
            "prioritizationFeeLamports": {
                "priorityLevelWithMaxLamports": {
                    "maxLamports": 1_000_000,  // cap at 0.001 SOL
                    "priorityLevel": "high"    // 50th percentile
                }
            },
        });

        let resp = self.client.post(&url).json(&body)
            .timeout(Duration::from_secs(10))
            .send().await
            .map_err(|e| if e.is_timeout() {
                TradeError::UpstreamTimeout("jupiter swap".into())
            } else {
                TradeError::ProviderError { provider: "jupiter".into(), message: e.to_string(), source: Some(Box::new(e)) }
            })?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(TradeError::ProviderError {
                provider: "jupiter".into(), message: format!("HTTP {status}: {body}"), source: None,
            });
        }

        let swap: JupiterSwapResponse = resp.json().await.map_err(|e| TradeError::ProviderError {
            provider: "jupiter".into(), message: format!("swap parse: {e}"), source: Some(Box::new(e)),
        })?;

        Ok(SwapTransaction {
            transaction: swap.swap_transaction,
            gasless: false,
            last_valid_block_height: swap.last_valid_block_height,
            request_id: None,
        })
    }

    async fn health(&self) -> ProviderHealth {
        let start = Instant::now();
        let url = format!("{}/quote", self.config.api_url);
        let result = self.client.get(&url)
            .query(&[
                ("inputMint", "So11111111111111111111111111111111111111112"),
                ("outputMint", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
                ("amount", "1000000"), ("slippageBps", "50"),
            ])
            .timeout(Duration::from_secs(5)).send().await;
        let latency = start.elapsed().as_millis() as u64;
        match result {
            Ok(r) if r.status().is_success() => ProviderHealth { name: "jupiter".into(), healthy: true, latency_ms: Some(latency), error: None },
            Ok(r) => ProviderHealth { name: "jupiter".into(), healthy: false, latency_ms: Some(latency), error: Some(format!("HTTP {}", r.status())) },
            Err(e) => ProviderHealth { name: "jupiter".into(), healthy: false, latency_ms: Some(latency), error: Some(e.to_string()) },
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct JupiterQuoteResponse {
    input_mint: String,
    output_mint: String,
    in_amount: String,
    out_amount: String,
    #[serde(default)]
    other_amount_threshold: Option<String>,
    #[serde(default)]
    price_impact_pct: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct JupiterSwapResponse {
    swap_transaction: String,
    #[serde(default)]
    last_valid_block_height: Option<u64>,
}
