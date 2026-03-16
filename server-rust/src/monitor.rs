//! Background price monitor — watches conditions and executes server-signed orders.
//!
//! Polling frequency scales based on proximity to trigger:
//! - No active orders: 30s (idle)
//! - Active orders, none near trigger: 5s (normal)
//! - Any order within 5% of trigger: 2s (hot)

use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Duration;

use tokio::time;
use tracing::{debug, info, warn};

use crate::embedded_wallet::EmbeddedWalletClient;
use crate::prices::PriceService;
use crate::storage::{ExecutionRecord, MonitoredOrder, Storage};

const IDLE_INTERVAL: Duration = Duration::from_secs(30);
const NORMAL_INTERVAL: Duration = Duration::from_secs(5);
const HOT_INTERVAL: Duration = Duration::from_secs(2);
const PROXIMITY_THRESHOLD: f64 = 0.05; // 5%

/// Monitor status exposed via admin API.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MonitorStatus {
    pub active_orders: usize,
    pub paused: bool,
    pub poll_interval_ms: u64,
    pub total_executions: u64,
}

pub struct PriceMonitor {
    storage: Arc<Storage>,
    price_service: Arc<PriceService>,
    wallet_client: Arc<EmbeddedWalletClient>,
    rpc_url: String,
    paused: Arc<AtomicBool>,
    execution_count: Arc<AtomicU64>,
    current_interval_ms: Arc<AtomicU64>,
}

impl PriceMonitor {
    pub fn new(
        storage: Arc<Storage>,
        price_service: Arc<PriceService>,
        wallet_client: Arc<EmbeddedWalletClient>,
        rpc_url: String,
    ) -> Self {
        Self {
            storage, price_service, wallet_client, rpc_url,
            paused: Arc::new(AtomicBool::new(false)),
            execution_count: Arc::new(AtomicU64::new(0)),
            current_interval_ms: Arc::new(AtomicU64::new(IDLE_INTERVAL.as_millis() as u64)),
        }
    }

    pub fn paused(&self) -> &Arc<AtomicBool> { &self.paused }

    pub async fn status(&self) -> MonitorStatus {
        MonitorStatus {
            active_orders: self.storage.active_count().await,
            paused: self.paused.load(Ordering::Relaxed),
            poll_interval_ms: self.current_interval_ms.load(Ordering::Relaxed),
            total_executions: self.execution_count.load(Ordering::Relaxed),
        }
    }

    pub fn spawn(self: Arc<Self>) -> tokio::task::JoinHandle<()> {
        tokio::spawn(async move { self.run_loop().await })
    }

    async fn run_loop(&self) {
        info!("price monitor started");

        loop {
            let interval_ms = self.current_interval_ms.load(Ordering::Relaxed);
            time::sleep(Duration::from_millis(interval_ms)).await;

            if self.paused.load(Ordering::Relaxed) {
                debug!("monitor paused, skipping tick");
                continue;
            }

            let orders = match self.storage.get_active_orders().await {
                Ok(o) => o,
                Err(e) => { warn!(error = %e, "failed to load active orders"); continue; }
            };

            if orders.is_empty() {
                self.set_interval(IDLE_INTERVAL);
                continue;
            }

            let mut any_hot = false;
            for order in &orders {
                match self.check_order(order).await {
                    Ok(proximity) => {
                        if proximity < PROXIMITY_THRESHOLD { any_hot = true; }
                    }
                    Err(e) => warn!(order_id = %order.id, error = %e, "order check failed"),
                }
            }

            self.set_interval(if any_hot { HOT_INTERVAL } else { NORMAL_INTERVAL });
        }
    }

    fn set_interval(&self, d: Duration) {
        self.current_interval_ms.store(d.as_millis() as u64, Ordering::Relaxed);
    }

    /// Check an order against current price. Returns proximity ratio (0.0 = at trigger, 1.0 = far).
    async fn check_order(&self, order: &MonitoredOrder) -> Result<f64, crate::error::TradeError> {
        // Bracket orders in pending_entry state: check if entry tx confirmed
        if order.status == "pending_entry" {
            return self.check_bracket_entry(order).await;
        }

        let snapshot = self.price_service.get_price(&order.input_mint, None).await?;
        let price = snapshot.price_usd;

        match order.order_type.as_str() {
            "trailing-stop" => self.check_trailing_stop(order, price).await,
            "oco-sl" => self.check_stop_loss(order, price).await,
            "oco-tp" => self.check_take_profit(order, price).await,
            "oco-tp-watcher" => self.check_onchain_tp(order).await,
            _ => Ok(1.0),
        }
    }

    /// Check if a bracket order's entry transaction has confirmed on-chain.
    /// Once confirmed, create the SL and TP legs.
    async fn check_bracket_entry(&self, order: &MonitoredOrder) -> Result<f64, crate::error::TradeError> {
        let sig = match &order.tx_signature {
            Some(s) if !s.is_empty() => s.clone(),
            _ => return Ok(1.0), // No signature yet — entry not submitted
        };

        // Check tx confirmation via RPC
        let body = serde_json::json!({
            "jsonrpc": "2.0", "id": 1,
            "method": "getSignatureStatuses",
            "params": [[sig]]
        });
        let resp: serde_json::Value = self.wallet_client.client_ref()
            .post(&self.rpc_url).json(&body).send().await
            .map_err(|e| crate::error::TradeError::RpcError(e.to_string()))?
            .json().await
            .map_err(|e| crate::error::TradeError::RpcError(e.to_string()))?;

        let status = &resp["result"]["value"][0];
        if status.is_null() || status["confirmationStatus"].as_str().unwrap_or("") == "processed" {
            return Ok(1.0); // Not yet finalized
        }

        if status["err"].is_object() {
            let mut updated = order.clone();
            updated.status = "failed".into();
            self.storage.save_order(&updated).await?;
            warn!(order_id = %order.id, "bracket entry tx failed on-chain");
            return Ok(1.0);
        }

        // Entry confirmed — get fill price and create legs
        info!(order_id = %order.id, "bracket entry confirmed, creating SL/TP legs");
        let config: BracketConfig = serde_json::from_str(&order.config_json).unwrap_or_default();

        let fill_price = self.price_service
            .get_price(&order.output_mint, None).await
            .map(|s| s.price_usd).unwrap_or(0.0);

        if fill_price <= 0.0 {
            warn!(order_id = %order.id, "could not determine fill price for bracket legs");
            return Ok(1.0);
        }

        let sl_trigger = fill_price * (1.0 - config.stop_loss_percent / 100.0);
        let tp_trigger = fill_price * (1.0 + config.take_profit_percent / 100.0);
        let sl_id = uuid::Uuid::new_v4().to_string();
        let tp_id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().to_rfc3339();

        // Create stop-loss leg
        let sl = MonitoredOrder {
            id: sl_id.clone(), order_type: "oco-sl".into(),
            maker: order.maker.clone(), wallet_id: order.wallet_id.clone(),
            input_mint: order.output_mint.clone(), output_mint: order.input_mint.clone(),
            in_amount: config.out_amount.clone().unwrap_or_default(),
            status: "monitoring".into(),
            config_json: serde_json::json!({"slippageBps": 100}).to_string(),
            current_trigger: Some(format!("{sl_trigger:.4}")),
            peak_price: None, created_at: now.clone(),
            executed_at: None, tx_signature: None, fill_price: None,
            linked_order_id: Some(tp_id.clone()),
        };
        self.storage.save_order(&sl).await?;

        // Create take-profit leg
        let tp = MonitoredOrder {
            id: tp_id.clone(), order_type: "oco-tp".into(),
            maker: order.maker.clone(), wallet_id: order.wallet_id.clone(),
            input_mint: order.output_mint.clone(), output_mint: order.input_mint.clone(),
            in_amount: config.out_amount.unwrap_or_default(),
            status: "monitoring".into(),
            config_json: serde_json::json!({"slippageBps": 50}).to_string(),
            current_trigger: Some(format!("{tp_trigger:.4}")),
            peak_price: None, created_at: now,
            executed_at: None, tx_signature: None, fill_price: None,
            linked_order_id: Some(sl_id),
        };
        self.storage.save_order(&tp).await?;

        // Update bracket status
        let mut updated = order.clone();
        updated.status = "monitoring".into();
        updated.fill_price = Some(format!("{fill_price:.4}"));
        self.storage.save_order(&updated).await?;

        info!(order_id = %order.id, fill_price, sl_trigger, tp_trigger, "bracket legs created");
        Ok(1.0)
    }

    async fn check_trailing_stop(
        &self, order: &MonitoredOrder, price: f64,
    ) -> Result<f64, crate::error::TradeError> {
        let config: TrailingStopConfig = serde_json::from_str(&order.config_json)
            .unwrap_or_default();
        let peak = order.peak_price.as_deref()
            .and_then(|s| s.parse::<f64>().ok()).unwrap_or(price);

        if price > peak {
            let mut updated = order.clone();
            updated.peak_price = Some(format!("{price:.4}"));
            let new_trigger = price * (1.0 - config.trail_percent / 100.0);
            updated.current_trigger = Some(format!("{new_trigger:.4}"));
            self.storage.save_order(&updated).await?;
            debug!(order_id = %order.id, new_peak = price, trigger = new_trigger, "trailing stop updated");
            return Ok(config.trail_percent / 100.0); // proximity = trail %
        }

        let trigger = order.current_trigger.as_deref()
            .and_then(|s| s.parse::<f64>().ok()).unwrap_or(0.0);

        if trigger > 0.0 && price <= trigger {
            info!(order_id = %order.id, price, trigger, "trailing stop triggered");
            self.execute_sell(order, price, config.slippage_bps).await?;
            return Ok(0.0);
        }

        // Proximity: how close are we to the trigger as a ratio of current price
        Ok(if trigger > 0.0 { (price - trigger) / price } else { 1.0 })
    }

    async fn check_stop_loss(
        &self, order: &MonitoredOrder, price: f64,
    ) -> Result<f64, crate::error::TradeError> {
        let trigger = order.current_trigger.as_deref()
            .and_then(|s| s.parse::<f64>().ok()).unwrap_or(0.0);

        if trigger > 0.0 && price <= trigger {
            info!(order_id = %order.id, price, trigger, "stop-loss triggered");
            let config: SlippageConfig = serde_json::from_str(&order.config_json)
                .unwrap_or_default();
            self.execute_sell(order, price, config.slippage_bps).await?;
            self.cancel_linked(order).await;
            return Ok(0.0);
        }

        Ok(if trigger > 0.0 { (price - trigger) / price } else { 1.0 })
    }

    async fn check_take_profit(
        &self, order: &MonitoredOrder, price: f64,
    ) -> Result<f64, crate::error::TradeError> {
        let trigger = order.current_trigger.as_deref()
            .and_then(|s| s.parse::<f64>().ok()).unwrap_or(f64::MAX);

        if price >= trigger {
            info!(order_id = %order.id, price, trigger, "take-profit triggered");
            let config: SlippageConfig = serde_json::from_str(&order.config_json)
                .unwrap_or_default();
            self.execute_sell(order, price, config.slippage_bps).await?;
            self.cancel_linked(order).await;
            return Ok(0.0);
        }

        Ok(if trigger < f64::MAX { (trigger - price) / price } else { 1.0 })
    }

    /// Check if an on-chain Jupiter take-profit order has filled.
    /// If it has, cancel the linked server-monitored stop-loss leg.
    async fn check_onchain_tp(&self, order: &MonitoredOrder) -> Result<f64, crate::error::TradeError> {
        let config: serde_json::Value = serde_json::from_str(&order.config_json)
            .unwrap_or_default();
        let on_chain_id = config["onChainOrderId"].as_str().unwrap_or("");
        if on_chain_id.is_empty() { return Ok(1.0); }

        // Query Jupiter Trigger API for order status
        let url = "https://api.jup.ag/trigger/v2/getTriggerOrders";
        let resp = self.wallet_client.client_ref()
            .get(url)
            .query(&[("user", order.maker.as_str()), ("status", "completed")])
            .timeout(std::time::Duration::from_secs(5))
            .send().await;

        let orders: serde_json::Value = match resp {
            Ok(r) if r.status().is_success() => r.json().await.unwrap_or_default(),
            _ => return Ok(1.0), // Can't check, assume not filled yet
        };

        let filled = orders["orders"].as_array()
            .map(|arr| arr.iter().any(|o| o["id"].as_str() == Some(on_chain_id)))
            .unwrap_or(false);

        if filled {
            info!(order_id = %order.id, on_chain_id, "on-chain TP filled, cancelling SL");

            // Mark watcher as executed
            let mut updated = order.clone();
            updated.status = "executed".into();
            updated.executed_at = Some(chrono::Utc::now().to_rfc3339());
            self.storage.save_order(&updated).await?;

            // Cancel the linked SL leg
            self.cancel_linked(order).await;
            return Ok(0.0);
        }

        Ok(1.0) // Not filled yet
    }

    async fn cancel_linked(&self, order: &MonitoredOrder) {
        if let Some(ref linked_id) = order.linked_order_id {
            let cancelled = MonitoredOrder {
                id: linked_id.clone(), status: "cancelled".into(), ..order.clone()
            };
            let _ = self.storage.save_order(&cancelled).await;
            info!(linked_id = %linked_id, "cancelled linked OCO leg");
        }
    }

    async fn execute_sell(
        &self, order: &MonitoredOrder, current_price: f64, slippage_bps: u32,
    ) -> Result<(), crate::error::TradeError> {
        // If embedded wallet is not enabled for this order, create a pending action instead
        if !self.wallet_client.is_enabled() || order.wallet_id.is_empty() {
            return self.create_user_action(order, current_price, slippage_bps).await;
        }

        let client = self.wallet_client.client_ref();
        let quote_resp = fetch_jupiter_quote(client, order, slippage_bps).await?;
        let swap_resp = fetch_jupiter_swap(client, &quote_resp, &order.maker).await?;

        let unsigned_tx = swap_resp["swapTransaction"].as_str().unwrap_or("");

        let signature = self.wallet_client.sign_and_submit(
            &order.wallet_id, unsigned_tx,
            &format!("{}-execution", order.order_type),
            Some(&order.id), &self.rpc_url,
        ).await?;

        let now = chrono::Utc::now().to_rfc3339();
        let mut updated = order.clone();
        updated.status = "executed".into();
        updated.executed_at = Some(now.clone());
        updated.tx_signature = Some(signature.clone());
        updated.fill_price = Some(format!("{current_price:.4}"));
        self.storage.save_order(&updated).await?;

        self.storage.save_execution(&ExecutionRecord {
            order_id: order.id.clone(), timestamp: now,
            tx_signature: signature, fill_price: format!("{current_price:.4}"),
            slippage_bps: Some(slippage_bps as i32), status: "executed".into(),
        }).await?;

        self.execution_count.fetch_add(1, Ordering::Relaxed);
        Ok(())
    }

    /// For external wallet orders: build the swap tx and create a pending action
    /// instead of auto-executing. The user sees a notification and signs manually.
    async fn create_user_action(
        &self, order: &MonitoredOrder, current_price: f64, slippage_bps: u32,
    ) -> Result<(), crate::error::TradeError> {
        let client = self.wallet_client.client_ref();

        let quote_resp = fetch_jupiter_quote(client, order, slippage_bps).await?;
        let swap_resp = fetch_jupiter_swap(client, &quote_resp, &order.maker).await?;

        let unsigned_tx = swap_resp["swapTransaction"].as_str().unwrap_or("");
        let reason = format!(
            "{} triggered at ${:.2} — sign to execute",
            order.order_type, current_price
        );

        crate::action_queue::create_action(
            &self.storage, &order.maker, &order.id,
            &format!("{}-triggered", order.order_type),
            unsigned_tx, &reason,
        ).await?;

        // Update order status to "action_pending" (not "executed")
        let mut updated = order.clone();
        updated.status = "action_pending".into();
        self.storage.save_order(&updated).await?;

        info!(order_id = %order.id, "created pending action for external wallet");
        Ok(())
    }
}

#[derive(Debug, Default, serde::Deserialize)]
struct TrailingStopConfig {
    #[serde(default = "default_trail")]
    trail_percent: f64,
    #[serde(default = "default_slippage")]
    slippage_bps: u32,
}
fn default_trail() -> f64 { 10.0 }
fn default_slippage() -> u32 { 100 }

#[derive(Debug, Default, serde::Deserialize)]
struct SlippageConfig {
    #[serde(default = "default_slippage")]
    slippage_bps: u32,
}

#[derive(Debug, Default, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct BracketConfig {
    #[serde(default = "default_trail")]
    stop_loss_percent: f64,
    #[serde(default = "default_tp")]
    take_profit_percent: f64,
    out_amount: Option<String>,
}
fn default_tp() -> f64 { 30.0 }

async fn fetch_jupiter_quote(
    client: &reqwest::Client, order: &MonitoredOrder, slippage_bps: u32,
) -> Result<serde_json::Value, crate::error::TradeError> {
    client.get("https://api.jup.ag/swap/v1/quote")
        .query(&[
            ("inputMint", order.input_mint.as_str()),
            ("outputMint", order.output_mint.as_str()),
            ("amount", order.in_amount.as_str()),
            ("slippageBps", &slippage_bps.to_string()),
            ("restrictIntermediateTokens", "true"),
        ])
        .send().await.map_err(jup_req_err)?
        .json::<serde_json::Value>().await.map_err(jup_req_err)
}

async fn fetch_jupiter_swap(
    client: &reqwest::Client, quote: &serde_json::Value, maker: &str,
) -> Result<serde_json::Value, crate::error::TradeError> {
    client.post("https://api.jup.ag/swap/v1/swap")
        .json(&serde_json::json!({
            "quoteResponse": quote, "userPublicKey": maker,
            "dynamicComputeUnitLimit": true,
            "prioritizationFeeLamports": {
                "priorityLevelWithMaxLamports": { "maxLamports": 1_000_000, "priorityLevel": "veryHigh" }
            },
        }))
        .send().await.map_err(jup_req_err)?
        .json::<serde_json::Value>().await.map_err(jup_req_err)
}

fn jup_req_err(e: reqwest::Error) -> crate::error::TradeError {
    crate::error::TradeError::ProviderError {
        provider: "jupiter".into(), message: e.to_string(), source: Some(Box::new(e)),
    }
}
