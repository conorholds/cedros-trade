use std::time::{Duration, Instant};

use async_trait::async_trait;
use reqwest::Client;
use serde::Deserialize;
use tracing::warn;

use super::SwapProvider;
use crate::config::UltraConfig;
use crate::error::TradeError;
use crate::types::{
    ProviderCapabilities, ProviderHealth, QuoteParams, SwapQuote, SwapTransaction,
};

pub struct JupiterUltraProvider {
    client: Client,
    config: UltraConfig,
}

impl JupiterUltraProvider {
    pub fn new(client: Client, config: UltraConfig, _default_slippage_bps: u32) -> Self {
        Self { client, config }
    }

    /// Call GET /ultra/v1/order. If `taker` is provided, returns a signable transaction.
    /// Without `taker`, returns quote data only (for price comparison).
    async fn fetch_order(
        &self,
        input_mint: &str,
        output_mint: &str,
        amount: &str,
        taker: Option<&str>,
    ) -> Result<UltraOrderResponse, TradeError> {
        let url = format!("{}/order", self.config.api_url);

        let mut query: Vec<(&str, String)> = vec![
            ("inputMint", input_mint.to_string()),
            ("outputMint", output_mint.to_string()),
            ("amount", amount.to_string()),
        ];

        if let Some(t) = taker {
            query.push(("taker", t.to_string()));
        }

        if self.config.fee_bps > 0 {
            query.push(("referralFee", self.config.fee_bps.to_string()));
        }

        let resp = self.client.get(&url).query(&query)
            .timeout(Duration::from_secs(10))
            .send().await
            .map_err(|e| if e.is_timeout() {
                TradeError::UpstreamTimeout("ultra order".into())
            } else {
                TradeError::ProviderError {
                    provider: "ultra".into(), message: e.to_string(), source: Some(Box::new(e)),
                }
            })?;

        let status = resp.status();
        if !status.is_success() {
            let body = resp.text().await.unwrap_or_default();
            warn!(status = %status, body = %body, "ultra order error");
            return Err(TradeError::ProviderError {
                provider: "ultra".into(), message: format!("HTTP {status}: {body}"), source: None,
            });
        }

        resp.json().await.map_err(|e| TradeError::ProviderError {
            provider: "ultra".into(), message: format!("order parse: {e}"), source: Some(Box::new(e)),
        })
    }
}

#[async_trait]
impl SwapProvider for JupiterUltraProvider {
    fn name(&self) -> &str { "ultra" }

    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            name: "ultra".into(), gasless: true, mev_protected: true, supports_exact_out: false,
        }
    }

    /// Get a quote from Ultra. Called WITHOUT taker so all providers can be compared
    /// without needing the user's wallet upfront.
    async fn quote(&self, params: &QuoteParams) -> Result<SwapQuote, TradeError> {
        super::validate_mint(&params.input_mint)?;
        super::validate_mint(&params.output_mint)?;
        super::validate_amount(&params.amount)?;

        let order = self.fetch_order(
            &params.input_mint, &params.output_mint, &params.amount, None,
        ).await?;

        if let Some(ref msg) = order.error_message {
            return Err(TradeError::ProviderError {
                provider: "ultra".into(), message: msg.clone(), source: None,
            });
        }

        Ok(SwapQuote {
            provider: "ultra".into(),
            input_mint: order.input_mint,
            output_mint: order.output_mint,
            in_amount: order.in_amount,
            out_amount: order.out_amount,
            other_amount_threshold: order.other_amount_threshold,
            price_impact_pct: order.price_impact.unwrap_or(0.0),
            slippage_bps: order.slippage_bps.unwrap_or(0),
            // Store quote params so build() can re-request with taker
            route_data: Some(serde_json::json!({
                "inputMint": params.input_mint,
                "outputMint": params.output_mint,
                "amount": params.amount,
            })),
            gasless: order.gasless.unwrap_or(false),
        })
    }

    /// Build the Ultra swap: re-calls /order WITH taker to get a signable transaction.
    /// Ultra transactions cannot be modified — they are used as-is.
    async fn build(&self, quote: &SwapQuote, user_public_key: &str) -> Result<SwapTransaction, TradeError> {
        if quote.provider != "ultra" {
            return Err(TradeError::BadRequest("quote is not from ultra".into()));
        }

        // Re-request /order with taker to get the actual transaction
        let order = self.fetch_order(
            &quote.input_mint, &quote.output_mint, &quote.in_amount,
            Some(user_public_key),
        ).await?;

        let transaction = order.transaction.ok_or_else(|| {
            let msg = order.error_message.unwrap_or_else(|| "no transaction returned".into());
            TradeError::ProviderError { provider: "ultra".into(), message: msg, source: None }
        })?;

        Ok(SwapTransaction {
            transaction,
            gasless: order.gasless.unwrap_or(false),
            last_valid_block_height: None, // Ultra handles expiry internally via execute
            request_id: Some(order.request_id),
        })
    }

    async fn health(&self) -> ProviderHealth {
        let start = Instant::now();
        let url = format!("{}/order", self.config.api_url);
        let result = self.client.get(&url)
            .query(&[
                ("inputMint", "So11111111111111111111111111111111111111112"),
                ("outputMint", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
                ("amount", "1000000"),
            ])
            .timeout(Duration::from_secs(5)).send().await;
        let latency = start.elapsed().as_millis() as u64;
        match result {
            Ok(r) if r.status().is_success() => ProviderHealth { name: "ultra".into(), healthy: true, latency_ms: Some(latency), error: None },
            Ok(r) => ProviderHealth { name: "ultra".into(), healthy: false, latency_ms: Some(latency), error: Some(format!("HTTP {}", r.status())) },
            Err(e) => ProviderHealth { name: "ultra".into(), healthy: false, latency_ms: Some(latency), error: Some(e.to_string()) },
        }
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UltraOrderResponse {
    input_mint: String,
    output_mint: String,
    in_amount: String,
    out_amount: String,
    #[serde(default)]
    other_amount_threshold: Option<String>,
    #[serde(default)]
    transaction: Option<String>,
    #[serde(default)]
    request_id: String,
    #[serde(default)]
    gasless: Option<bool>,
    #[serde(default)]
    slippage_bps: Option<u32>,
    #[serde(default)]
    price_impact: Option<f64>,
    #[serde(default)]
    error_message: Option<String>,
}
