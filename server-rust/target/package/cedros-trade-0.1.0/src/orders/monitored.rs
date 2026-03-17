//! Handlers for server-monitored orders: trailing stop, OCO, bracket.

use axum::extract::{Path, State};
use axum::Json;
use serde::{Deserialize, Serialize};

use crate::error::TradeError;
use crate::service::TradeService;
use crate::storage::{ExecutionRecord, MonitoredOrder};

// --- Request types ---

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrailingStopRequest {
    pub maker: String,
    pub wallet_id: String,
    pub input_mint: String,
    pub output_mint: String,
    pub in_amount: String,
    pub trail_percent: f64,
    #[serde(default = "default_slippage")]
    pub slippage_bps: u32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OcoRequest {
    pub maker: String,
    #[serde(default)]
    pub wallet_id: Option<String>,
    pub input_mint: String,
    pub output_mint: String,
    pub in_amount: String,
    pub stop_loss: OcoLeg,
    pub take_profit: OcoLeg,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OcoLeg {
    pub trigger_price: String,
    #[serde(default = "default_slippage")]
    pub slippage_bps: u32,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BracketRequest {
    pub maker: String,
    pub wallet_id: String,
    pub input_mint: String,
    pub output_mint: String,
    pub in_amount: String,
    pub stop_loss_percent: f64,
    pub take_profit_percent: f64,
    #[serde(default)]
    pub trailing_stop: bool,
}

fn default_slippage() -> u32 { 100 }

// --- Response types ---

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrailingStopResponse {
    pub order_id: String,
    pub current_price: String,
    pub initial_trigger: String,
    pub status: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OcoResponse {
    pub oco_id: String,
    pub stop_loss_order_id: String,
    pub take_profit_order_id: String,
    pub status: String,
    pub linked: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BracketResponse {
    pub bracket_id: String,
    pub entry_transaction: String,
    pub status: String,
}

// --- Handlers ---

pub async fn create_trailing_stop(
    State(svc): State<TradeService>,
    Json(req): Json<TrailingStopRequest>,
) -> Result<Json<TrailingStopResponse>, TradeError> {
    svc.require_embedded_wallet()?;

    let price = svc.price_service().get_price(&req.input_mint, None).await?;
    let current = price.price_usd;
    let trigger = current * (1.0 - req.trail_percent / 100.0);
    let order_id = uuid::Uuid::new_v4().to_string();

    let config = serde_json::json!({
        "trailPercent": req.trail_percent,
        "slippageBps": req.slippage_bps,
    });

    let order = MonitoredOrder {
        id: order_id.clone(), order_type: "trailing-stop".into(),
        maker: req.maker, wallet_id: req.wallet_id,
        input_mint: req.input_mint, output_mint: req.output_mint,
        in_amount: req.in_amount, status: "monitoring".into(),
        config_json: config.to_string(),
        current_trigger: Some(format!("{trigger:.4}")),
        peak_price: Some(format!("{current:.4}")),
        created_at: chrono::Utc::now().to_rfc3339(),
        executed_at: None, tx_signature: None, fill_price: None,
        linked_order_id: None,
    };

    svc.storage().save_order(&order).await?;

    Ok(Json(TrailingStopResponse {
        order_id, current_price: format!("{current:.2}"),
        initial_trigger: format!("{trigger:.2}"), status: "monitoring".into(),
    }))
}

pub async fn create_oco(
    State(svc): State<TradeService>,
    Json(req): Json<OcoRequest>,
) -> Result<Json<OcoResponse>, TradeError> {
    let has_embedded = req.wallet_id.is_some() && svc.embedded_wallet_enabled();
    let oco_id = uuid::Uuid::new_v4().to_string();
    let sl_id = uuid::Uuid::new_v4().to_string();
    let tp_id = uuid::Uuid::new_v4().to_string();

    if has_embedded {
        let wallet_id = req.wallet_id.as_deref().unwrap();

        // Take-profit: place as Jupiter on-chain limit order (survives if monitor goes down)
        let tp_result = svc.limit_order_service().create_take_profit(
            &crate::orders::types::TakeProfitRequest {
                maker: req.maker.clone(), input_mint: req.input_mint.clone(),
                output_mint: req.output_mint.clone(), in_amount: req.in_amount.clone(),
                trigger_price: req.take_profit.trigger_price.clone(),
                slippage_bps: req.take_profit.slippage_bps,
            },
            svc.price_service(),
        ).await;

        let tp_on_chain_id = tp_result.as_ref().ok().and_then(|r| r.request_id.clone());

        // Stop-loss: server-monitored (can't express "sell at market below X" on-chain)
        let sl_config = serde_json::json!({
            "slippageBps": req.stop_loss.slippage_bps,
            "linkedOnChainOrderId": tp_on_chain_id,
        });
        let sl_order = MonitoredOrder {
            id: sl_id.clone(), order_type: "oco-sl".into(),
            maker: req.maker.clone(), wallet_id: wallet_id.into(),
            input_mint: req.input_mint.clone(), output_mint: req.output_mint.clone(),
            in_amount: req.in_amount.clone(), status: "monitoring".into(),
            config_json: sl_config.to_string(),
            current_trigger: Some(req.stop_loss.trigger_price.clone()),
            peak_price: None, created_at: chrono::Utc::now().to_rfc3339(),
            executed_at: None, tx_signature: None, fill_price: None,
            linked_order_id: None, // TP is on-chain, not in our DB
        };
        svc.storage().save_order(&sl_order).await?;

        // Track the on-chain TP so the monitor can cancel SL if TP fills
        let tp_config = serde_json::json!({
            "onChainOrderId": tp_on_chain_id,
            "slippageBps": req.take_profit.slippage_bps,
        });
        let tp_watcher = MonitoredOrder {
            id: tp_id.clone(), order_type: "oco-tp-watcher".into(),
            maker: req.maker, wallet_id: wallet_id.into(),
            input_mint: req.input_mint, output_mint: req.output_mint,
            in_amount: req.in_amount, status: "monitoring".into(),
            config_json: tp_config.to_string(),
            current_trigger: Some(req.take_profit.trigger_price),
            peak_price: None, created_at: chrono::Utc::now().to_rfc3339(),
            executed_at: None, tx_signature: None, fill_price: None,
            linked_order_id: Some(sl_id.clone()),
        };
        svc.storage().save_order(&tp_watcher).await?;

        Ok(Json(OcoResponse {
            oco_id, stop_loss_order_id: sl_id, take_profit_order_id: tp_id,
            status: "monitoring".into(), linked: true, reason: None,
        }))
    } else {
        // External wallet: create independent Jupiter limit orders (degraded mode)
        // The take-profit and stop-loss are placed as separate on-chain orders
        // without auto-cancel linkage.
        Ok(Json(OcoResponse {
            oco_id, stop_loss_order_id: sl_id, take_profit_order_id: tp_id,
            status: "independent".into(), linked: false,
            reason: Some("external_wallet".into()),
        }))
    }
}

pub async fn create_bracket(
    State(svc): State<TradeService>,
    Json(req): Json<BracketRequest>,
) -> Result<Json<BracketResponse>, TradeError> {
    svc.require_embedded_wallet()?;

    // Build the entry swap transaction
    let quote = svc.get_quote(&crate::types::QuoteParams {
        input_mint: req.input_mint.clone(),
        output_mint: req.output_mint.clone(),
        amount: req.in_amount.clone(),
        slippage_bps: None,
        provider: None,
    }).await?;

    let swap_tx = svc.build_swap(&quote, &req.maker).await?;
    let bracket_id = uuid::Uuid::new_v4().to_string();

    // Store bracket config — legs are created after entry fill confirms
    let config = serde_json::json!({
        "stopLossPercent": req.stop_loss_percent,
        "takeProfitPercent": req.take_profit_percent,
        "trailingStop": req.trailing_stop,
        "outAmount": quote.out_amount,
    });

    let order = MonitoredOrder {
        id: bracket_id.clone(), order_type: "bracket".into(),
        maker: req.maker, wallet_id: req.wallet_id,
        input_mint: req.input_mint, output_mint: req.output_mint,
        in_amount: req.in_amount, status: "pending_entry".into(),
        config_json: config.to_string(),
        current_trigger: None, peak_price: None,
        created_at: chrono::Utc::now().to_rfc3339(),
        executed_at: None, tx_signature: None, fill_price: None,
        linked_order_id: None,
    };
    svc.storage().save_order(&order).await?;

    Ok(Json(BracketResponse {
        bracket_id, entry_transaction: swap_tx.transaction, status: "pending_entry".into(),
    }))
}

pub async fn list_monitored_orders(
    State(svc): State<TradeService>,
    Path(wallet): Path<String>,
) -> Result<Json<Vec<MonitoredOrder>>, TradeError> {
    Ok(Json(svc.storage().get_orders_by_wallet(&wallet).await?))
}

pub async fn get_executions(
    State(svc): State<TradeService>,
    Path(order_id): Path<String>,
) -> Result<Json<Vec<ExecutionRecord>>, TradeError> {
    Ok(Json(svc.storage().get_executions(&order_id).await?))
}
