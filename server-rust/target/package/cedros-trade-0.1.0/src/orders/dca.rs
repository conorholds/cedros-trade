//! Jupiter Recurring API client for DCA (Dollar Cost Averaging) orders.

use std::time::Duration;

use reqwest::Client;
use serde::Deserialize;
use tracing::warn;

use crate::error::TradeError;
use crate::orders::types::*;

const RECURRING_API_BASE: &str = "https://api.jup.ag/recurring/v1";

/// Service for building DCA order transactions via Jupiter's Recurring API.
pub struct DcaOrderService {
    client: Client,
}

impl DcaOrderService {
    pub fn new(client: Client) -> Self {
        Self { client }
    }

    /// Build a DCA order creation transaction.
    pub async fn create_dca_order(
        &self,
        req: &DcaOrderRequest,
    ) -> Result<OrderBuildResponse, TradeError> {
        let per_cycle: u64 = req.per_cycle_amount.parse().map_err(|_| {
            TradeError::InvalidAmount(format!("invalid perCycleAmount: {}", req.per_cycle_amount))
        })?;
        let total: u64 = req.total_in_amount.parse().map_err(|_| {
            TradeError::InvalidAmount(format!("invalid totalInAmount: {}", req.total_in_amount))
        })?;

        if per_cycle == 0 || total == 0 {
            return Err(TradeError::InvalidAmount("amounts must be positive".into()));
        }
        if per_cycle > total {
            return Err(TradeError::BadRequest(
                "perCycleAmount cannot exceed totalInAmount".into(),
            ));
        }

        let num_orders = total / per_cycle;
        let start_at = req.start_at.as_deref()
            .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
            .map(|dt| dt.timestamp());

        let url = format!("{RECURRING_API_BASE}/createOrder");
        let body = serde_json::json!({
            "user": req.maker,
            "inputMint": req.input_mint,
            "outputMint": req.output_mint,
            "params": {
                "time": {
                    "inAmount": total,
                    "numberOfOrders": num_orders,
                    "interval": req.cycle_interval,
                    "minPrice": null,
                    "maxPrice": null,
                    "startAt": start_at,
                }
            }
        });

        let resp = self.client.post(&url).json(&body)
            .timeout(Duration::from_secs(10))
            .send().await
            .map_err(|e| TradeError::ProviderError {
                provider: "recurring".into(), message: e.to_string(), source: Some(Box::new(e)),
            })?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(TradeError::ProviderError {
                provider: "recurring".into(),
                message: format!("createOrder failed: {body}"),
                source: None,
            });
        }

        let result: RecurringCreateResponse = resp.json().await.map_err(|e| {
            TradeError::ProviderError {
                provider: "recurring".into(), message: e.to_string(), source: Some(Box::new(e)),
            }
        })?;

        Ok(OrderBuildResponse {
            transaction: result.transaction,
            order_id: result.request_id.clone(),
            request_id: Some(result.request_id),
            trigger_condition: None,
            estimated_price: None,
            total_cycles: Some(num_orders),
        })
    }

    /// Fetch open DCA orders for a wallet.
    pub async fn get_dca_orders(&self, wallet: &str) -> Result<Vec<DcaOrder>, TradeError> {
        let url = format!("{RECURRING_API_BASE}/getRecurringOrders");
        let resp = self.client.get(&url)
            .query(&[("user", wallet)])
            .timeout(Duration::from_secs(10))
            .send().await
            .map_err(|e| TradeError::ProviderError {
                provider: "recurring".into(), message: e.to_string(), source: Some(Box::new(e)),
            })?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            warn!(body = %body, "getRecurringOrders failed");
            return Ok(Vec::new());
        }

        let raw: serde_json::Value = resp.json().await.unwrap_or_default();
        let orders = raw["orders"].as_array().cloned().unwrap_or_default();

        let mut result = Vec::new();
        for order in orders {
            let total: u64 = order["inAmount"].as_u64().unwrap_or(0);
            let per_cycle: u64 = order["inAmountPerCycle"].as_u64().unwrap_or(1);
            let completed = order["completedCycles"].as_u64().unwrap_or(0);
            let total_cycles = if per_cycle > 0 { total / per_cycle } else { 0 };

            result.push(DcaOrder {
                dca_account_id: order["id"].as_str().unwrap_or("").to_string(),
                input_mint: order["inputMint"].as_str().unwrap_or("").to_string(),
                output_mint: order["outputMint"].as_str().unwrap_or("").to_string(),
                total_in_amount: total.to_string(),
                per_cycle_amount: per_cycle.to_string(),
                cycle_interval: order["interval"].as_u64().unwrap_or(0),
                completed_cycles: completed,
                total_cycles,
                total_out_received: order["outReceived"].as_str().unwrap_or("0").to_string(),
                status: if completed >= total_cycles { "completed" } else { "active" }.into(),
                next_cycle_at: order["nextCycleAt"].as_u64()
                    .and_then(|ts| chrono::DateTime::from_timestamp(ts as i64, 0))
                    .map(|dt| dt.to_rfc3339()),
            });
        }

        Ok(result)
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RecurringCreateResponse {
    request_id: String,
    transaction: String,
}
