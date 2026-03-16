//! Axum handlers for order endpoints.

use axum::extract::{Path, State};
use axum::Json;

use axum::extract::Query;
use serde::Deserialize;

use crate::error::TradeError;
use crate::orders::types::*;
use crate::positions::{PnlResponse, PositionsResponse, TradeHistoryResponse};
use crate::service::TradeService;

#[derive(Debug, Deserialize)]
pub struct HistoryQuery {
    pub mint: Option<String>,
    #[serde(default = "default_limit")]
    pub limit: usize,
}
fn default_limit() -> usize { 50 }

pub async fn create_limit_order(
    State(svc): State<TradeService>,
    Json(req): Json<LimitOrderRequest>,
) -> Result<Json<OrderBuildResponse>, TradeError> {
    Ok(Json(svc.limit_order_service().create_limit_order(&req).await?))
}

pub async fn create_stop_loss(
    State(svc): State<TradeService>,
    Json(req): Json<StopLossRequest>,
) -> Result<Json<OrderBuildResponse>, TradeError> {
    Ok(Json(
        svc.limit_order_service()
            .create_stop_loss(&req, svc.price_service())
            .await?,
    ))
}

pub async fn create_take_profit(
    State(svc): State<TradeService>,
    Json(req): Json<TakeProfitRequest>,
) -> Result<Json<OrderBuildResponse>, TradeError> {
    Ok(Json(
        svc.limit_order_service()
            .create_take_profit(&req, svc.price_service())
            .await?,
    ))
}

pub async fn create_dca_order(
    State(svc): State<TradeService>,
    Json(req): Json<DcaOrderRequest>,
) -> Result<Json<OrderBuildResponse>, TradeError> {
    Ok(Json(svc.dca_order_service().create_dca_order(&req).await?))
}

pub async fn cancel_order(
    State(svc): State<TradeService>,
    Path(order_id): Path<String>,
    Json(req): Json<CancelOrderRequest>,
) -> Result<Json<OrderBuildResponse>, TradeError> {
    Ok(Json(
        svc.limit_order_service()
            .cancel_order(&order_id, &req.maker)
            .await?,
    ))
}

pub async fn list_open_orders(
    State(svc): State<TradeService>,
    Path(wallet): Path<String>,
) -> Result<Json<OrdersResponse>, TradeError> {
    Ok(Json(svc.get_open_orders(&wallet).await?))
}

pub async fn get_positions(
    State(svc): State<TradeService>,
    Path(wallet): Path<String>,
) -> Result<Json<PositionsResponse>, TradeError> {
    Ok(Json(svc.get_positions(&wallet).await?))
}

pub async fn get_pnl(
    State(svc): State<TradeService>,
    Path(wallet): Path<String>,
) -> Result<Json<PnlResponse>, TradeError> {
    Ok(Json(svc.get_pnl(&wallet).await?))
}

pub async fn get_trade_history(
    State(svc): State<TradeService>,
    Path(wallet): Path<String>,
    Query(q): Query<HistoryQuery>,
) -> Result<Json<TradeHistoryResponse>, TradeError> {
    Ok(Json(svc.get_trade_history(&wallet, q.mint.as_deref(), q.limit).await?))
}
