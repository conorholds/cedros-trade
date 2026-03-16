use std::time::{Duration, Instant};

use async_trait::async_trait;
use reqwest::Client;
use serde::Deserialize;
use tracing::warn;

use super::SwapProvider;
use crate::config::DflowConfig;
use crate::error::TradeError;
use crate::types::{
    ProviderCapabilities, ProviderHealth, QuoteParams, SwapQuote, SwapTransaction,
};

pub struct DflowProvider {
    client: Client,
    config: DflowConfig,
    default_slippage_bps: u32,
}

impl DflowProvider {
    pub fn new(client: Client, config: DflowConfig, default_slippage_bps: u32) -> Self {
        Self { client, config, default_slippage_bps }
    }

    fn api_request(&self, url: &str) -> reqwest::RequestBuilder {
        let mut req = self.client.get(url);
        if !self.config.api_key.is_empty() {
            req = req.header("x-api-key", &self.config.api_key);
        }
        req
    }

    fn api_post(&self, url: &str) -> reqwest::RequestBuilder {
        let mut req = self.client.post(url);
        if !self.config.api_key.is_empty() {
            req = req.header("x-api-key", &self.config.api_key);
        }
        req
    }
}

#[async_trait]
impl SwapProvider for DflowProvider {
    fn name(&self) -> &str { "dflow" }

    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            name: "dflow".into(), gasless: false, mev_protected: true, supports_exact_out: false,
        }
    }

    async fn quote(&self, params: &QuoteParams) -> Result<SwapQuote, TradeError> {
        super::validate_mint(&params.input_mint)?;
        super::validate_mint(&params.output_mint)?;
        super::validate_amount(&params.amount)?;

        if self.config.api_url.is_empty() {
            return Err(TradeError::ProviderError {
                provider: "dflow".into(), message: "DFlow API URL not configured".into(), source: None,
            });
        }

        let slippage = params.slippage_bps.unwrap_or(self.default_slippage_bps);

        // GET /quote with query params (same pattern as Jupiter)
        let url = format!("{}/quote", self.config.api_url);
        let resp = self.api_request(&url)
            .query(&[
                ("inputMint", params.input_mint.as_str()),
                ("outputMint", params.output_mint.as_str()),
                ("amount", params.amount.as_str()),
                ("slippageBps", &slippage.to_string()),
            ])
            .timeout(Duration::from_secs(10))
            .send().await
            .map_err(|e| if e.is_timeout() {
                TradeError::UpstreamTimeout("dflow quote".into())
            } else {
                TradeError::ProviderError {
                    provider: "dflow".into(), message: e.to_string(), source: Some(Box::new(e)),
                }
            })?;

        let status = resp.status();
        if !status.is_success() {
            let body = resp.text().await.unwrap_or_default();
            warn!(status = %status, body = %body, "dflow quote error");
            return Err(TradeError::ProviderError {
                provider: "dflow".into(), message: format!("HTTP {status}: {body}"), source: None,
            });
        }

        // Store the raw response (needed for POST /swap)
        let raw: serde_json::Value = resp.json().await.map_err(|e| TradeError::ProviderError {
            provider: "dflow".into(), message: format!("failed to parse quote: {e}"), source: Some(Box::new(e)),
        })?;

        let dq: DflowQuoteResponse = serde_json::from_value(raw.clone()).map_err(|e| {
            TradeError::ProviderError { provider: "dflow".into(), message: format!("quote schema: {e}"), source: None }
        })?;

        Ok(SwapQuote {
            provider: "dflow".into(),
            input_mint: dq.input_mint,
            output_mint: dq.output_mint,
            in_amount: dq.in_amount,
            out_amount: dq.out_amount,
            other_amount_threshold: dq.other_amount_threshold,
            price_impact_pct: dq.price_impact_pct
                .as_deref()
                .and_then(|s| s.parse::<f64>().ok())
                .unwrap_or(0.0),
            slippage_bps: dq.slippage_bps.unwrap_or(slippage),
            route_data: Some(raw),
            gasless: false,
        })
    }

    async fn build(&self, quote: &SwapQuote, user_public_key: &str) -> Result<SwapTransaction, TradeError> {
        if quote.provider != "dflow" {
            return Err(TradeError::BadRequest("quote is not from dflow".into()));
        }

        let raw_quote = quote.route_data.as_ref().ok_or_else(|| {
            TradeError::BadRequest("dflow quote missing route_data (raw quoteResponse)".into())
        })?;

        // POST /swap — same pattern as Jupiter: quoteResponse + userPublicKey
        let url = format!("{}/swap", self.config.api_url);
        let body = serde_json::json!({
            "quoteResponse": raw_quote,
            "userPublicKey": user_public_key,
            "dynamicComputeUnitLimit": true,
            // DFlow best practice: auto priority fees, capped at 0.005 SOL
            "prioritizationFeeLamports": "auto",
        });

        let resp = self.api_post(&url).json(&body)
            .timeout(Duration::from_secs(10))
            .send().await
            .map_err(|e| if e.is_timeout() {
                TradeError::UpstreamTimeout("dflow swap".into())
            } else {
                TradeError::ProviderError {
                    provider: "dflow".into(), message: e.to_string(), source: Some(Box::new(e)),
                }
            })?;

        let status = resp.status();
        if !status.is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(TradeError::ProviderError {
                provider: "dflow".into(), message: format!("swap HTTP {status}: {body}"), source: None,
            });
        }

        let swap: DflowSwapResponse = resp.json().await.map_err(|e| TradeError::ProviderError {
            provider: "dflow".into(), message: format!("swap parse: {e}"), source: Some(Box::new(e)),
        })?;

        Ok(SwapTransaction {
            transaction: swap.swap_transaction,
            gasless: false,
            last_valid_block_height: swap.last_valid_block_height,
            request_id: None,
        })
    }

    async fn health(&self) -> ProviderHealth {
        if self.config.api_url.is_empty() {
            return ProviderHealth {
                name: "dflow".into(), healthy: false, latency_ms: None,
                error: Some("API URL not configured".into()),
            };
        }

        let start = Instant::now();
        let url = format!("{}/quote", self.config.api_url);
        let result = self.api_request(&url)
            .query(&[
                ("inputMint", "So11111111111111111111111111111111111111112"),
                ("outputMint", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
                ("amount", "1000000"),
                ("slippageBps", "50"),
            ])
            .timeout(Duration::from_secs(5)).send().await;
        let latency = start.elapsed().as_millis() as u64;
        match result {
            Ok(r) if r.status().is_success() => ProviderHealth { name: "dflow".into(), healthy: true, latency_ms: Some(latency), error: None },
            Ok(r) => ProviderHealth { name: "dflow".into(), healthy: false, latency_ms: Some(latency), error: Some(format!("HTTP {}", r.status())) },
            Err(e) => ProviderHealth { name: "dflow".into(), healthy: false, latency_ms: Some(latency), error: Some(e.to_string()) },
        }
    }
}

// --- DFlow API response types ---

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DflowQuoteResponse {
    input_mint: String,
    output_mint: String,
    in_amount: String,
    out_amount: String,
    #[serde(default)]
    other_amount_threshold: Option<String>,
    #[serde(default)]
    price_impact_pct: Option<String>,
    #[serde(default)]
    slippage_bps: Option<u32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DflowSwapResponse {
    swap_transaction: String,
    #[serde(default)]
    last_valid_block_height: Option<u64>,
}
