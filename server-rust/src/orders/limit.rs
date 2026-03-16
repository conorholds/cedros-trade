//! Jupiter Trigger V2 API client for limit, stop-loss, and take-profit orders.

use std::time::Duration;

use reqwest::Client;
use serde::Deserialize;
use tracing::warn;

use crate::error::TradeError;
use crate::orders::types::*;
use crate::prices::PriceService;

const TRIGGER_API_BASE: &str = "https://api.jup.ag/trigger/v2";

/// Service for building limit/trigger order transactions via Jupiter's Trigger V2 API.
pub struct LimitOrderService {
    client: Client,
}

impl LimitOrderService {
    pub fn new(client: Client) -> Self {
        Self { client }
    }

    /// Build a limit order creation transaction.
    /// Flow: POST /deposit/craft → return unsigned tx + requestId for the frontend.
    /// After signing, the frontend calls our execute endpoint which calls /orders/price.
    pub async fn create_limit_order(
        &self,
        req: &LimitOrderRequest,
    ) -> Result<OrderBuildResponse, TradeError> {
        let deposit = self.craft_deposit(
            &req.maker, &req.input_mint, &req.output_mint, &req.in_amount,
        ).await?;

        Ok(OrderBuildResponse {
            transaction: deposit.transaction,
            order_id: deposit.request_id.clone(),
            request_id: Some(deposit.request_id),
            trigger_condition: None,
            estimated_price: None,
            total_cycles: None,
        })
    }

    /// Build a stop-loss order. Validates trigger price < current market price.
    pub async fn create_stop_loss(
        &self,
        req: &StopLossRequest,
        price_service: &PriceService,
    ) -> Result<OrderBuildResponse, TradeError> {
        let trigger: f64 = req.trigger_price.parse().map_err(|_| {
            TradeError::BadRequest(format!("invalid trigger price: {}", req.trigger_price))
        })?;

        // Validate trigger is below current price (stop-loss sells on drop)
        if let Ok(snapshot) = price_service.get_price(&req.input_mint, None).await {
            if trigger >= snapshot.price_usd {
                return Err(TradeError::BadRequest(format!(
                    "stop-loss trigger ({trigger}) must be below current price ({})",
                    snapshot.price_usd
                )));
            }
        }

        let deposit = self.craft_deposit(
            &req.maker, &req.input_mint, &req.output_mint, &req.in_amount,
        ).await?;

        Ok(OrderBuildResponse {
            transaction: deposit.transaction,
            order_id: deposit.request_id.clone(),
            request_id: Some(deposit.request_id),
            trigger_condition: Some(format!("price <= {trigger}")),
            estimated_price: Some(req.trigger_price.clone()),
            total_cycles: None,
        })
    }

    /// Build a take-profit order. Validates trigger price > current market price.
    pub async fn create_take_profit(
        &self,
        req: &TakeProfitRequest,
        price_service: &PriceService,
    ) -> Result<OrderBuildResponse, TradeError> {
        let trigger: f64 = req.trigger_price.parse().map_err(|_| {
            TradeError::BadRequest(format!("invalid trigger price: {}", req.trigger_price))
        })?;

        if let Ok(snapshot) = price_service.get_price(&req.input_mint, None).await {
            if trigger <= snapshot.price_usd {
                return Err(TradeError::BadRequest(format!(
                    "take-profit trigger ({trigger}) must be above current price ({})",
                    snapshot.price_usd
                )));
            }
        }

        let deposit = self.craft_deposit(
            &req.maker, &req.input_mint, &req.output_mint, &req.in_amount,
        ).await?;

        Ok(OrderBuildResponse {
            transaction: deposit.transaction,
            order_id: deposit.request_id.clone(),
            request_id: Some(deposit.request_id),
            trigger_condition: Some(format!("price >= {trigger}")),
            estimated_price: Some(req.trigger_price.clone()),
            total_cycles: None,
        })
    }

    /// Build a cancel order transaction.
    pub async fn cancel_order(
        &self,
        order_id: &str,
        maker: &str,
    ) -> Result<OrderBuildResponse, TradeError> {
        let url = format!("{TRIGGER_API_BASE}/cancelOrder");
        let resp = self.client.post(&url)
            .json(&serde_json::json!({
                "maker": maker,
                "orderId": order_id,
            }))
            .timeout(Duration::from_secs(10))
            .send().await
            .map_err(|e| TradeError::ProviderError {
                provider: "trigger".into(), message: e.to_string(), source: Some(Box::new(e)),
            })?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(TradeError::ProviderError {
                provider: "trigger".into(),
                message: format!("cancel failed: {body}"),
                source: None,
            });
        }

        let result: CancelResponse = resp.json().await.map_err(|e| {
            TradeError::ProviderError {
                provider: "trigger".into(), message: e.to_string(), source: Some(Box::new(e)),
            }
        })?;

        Ok(OrderBuildResponse {
            transaction: result.transaction,
            order_id: order_id.to_string(),
            request_id: None,
            trigger_condition: None,
            estimated_price: None,
            total_cycles: None,
        })
    }

    /// Fetch open trigger orders for a wallet.
    pub async fn get_open_orders(&self, wallet: &str) -> Result<Vec<OpenOrder>, TradeError> {
        let url = format!("{TRIGGER_API_BASE}/getTriggerOrders");
        let resp = self.client.get(&url)
            .query(&[("user", wallet), ("status", "active")])
            .timeout(Duration::from_secs(10))
            .send().await
            .map_err(|e| TradeError::ProviderError {
                provider: "trigger".into(), message: e.to_string(), source: Some(Box::new(e)),
            })?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            warn!(body = %body, "getTriggerOrders failed");
            return Ok(Vec::new());
        }

        let raw: serde_json::Value = resp.json().await.unwrap_or_default();
        let orders = raw["orders"].as_array().cloned().unwrap_or_default();

        let mut result = Vec::new();
        for order in orders {
            let trigger_cond = order["triggerCondition"].as_str().unwrap_or("");
            let order_type = match trigger_cond {
                "below" => OrderType::StopLoss,
                "above" => OrderType::TakeProfit,
                _ => OrderType::Limit,
            };

            result.push(OpenOrder {
                order_id: order["id"].as_str().unwrap_or("").to_string(),
                input_mint: order["inputMint"].as_str().unwrap_or("").to_string(),
                output_mint: order["outputMint"].as_str().unwrap_or("").to_string(),
                in_amount: order["inputAmount"].as_str().unwrap_or("0").to_string(),
                out_amount: order["outputAmount"].as_str().unwrap_or("0").to_string(),
                filled: order["filledAmount"].as_str().unwrap_or("0").to_string(),
                status: "open".into(),
                order_type,
                trigger_price: order["triggerPriceUsd"].as_f64()
                    .map(|p| format!("{p:.2}")),
                created_at: order["createdAt"].as_str().map(|s| s.to_string()),
                expiry: order["expiresAt"].as_u64()
                    .map(|ms| chrono::DateTime::from_timestamp_millis(ms as i64)
                        .map(|dt| dt.to_rfc3339())
                        .unwrap_or_default()),
            });
        }

        Ok(result)
    }

    // --- Internal helpers ---

    async fn craft_deposit(
        &self,
        user_address: &str,
        input_mint: &str,
        output_mint: &str,
        amount: &str,
    ) -> Result<DepositCraftResponse, TradeError> {
        let url = format!("{TRIGGER_API_BASE}/deposit/craft");
        let body = serde_json::json!({
            "inputMint": input_mint,
            "outputMint": output_mint,
            "userAddress": user_address,
            "amount": amount,
        });

        let resp = self.client.post(&url).json(&body)
            .timeout(Duration::from_secs(10))
            .send().await
            .map_err(|e| TradeError::ProviderError {
                provider: "trigger".into(), message: e.to_string(), source: Some(Box::new(e)),
            })?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(TradeError::ProviderError {
                provider: "trigger".into(),
                message: format!("deposit craft failed: {body}"),
                source: None,
            });
        }

        resp.json().await.map_err(|e| TradeError::ProviderError {
            provider: "trigger".into(), message: e.to_string(), source: Some(Box::new(e)),
        })
    }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DepositCraftResponse {
    transaction: String,
    request_id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CancelResponse {
    transaction: String,
}
