use axum::extract::{Path, Query, State};
use axum::routing::{get, post};
use axum::{Json, Router};

use crate::error::TradeError;
use crate::health::health_check;
use crate::portfolio::PortfolioResponse;
use crate::prices::{BatchPriceRequest, BatchPriceResponse, PriceSnapshot};
use crate::service::TradeService;
use crate::token_registry::TokenListQuery;
use crate::orders::handlers::{
    cancel_order, create_dca_order, create_limit_order, create_stop_loss, create_take_profit,
    get_pnl, get_positions, get_trade_history, list_open_orders,
};
use crate::orders::monitored::{
    create_bracket, create_oco, create_trailing_stop, get_executions, list_monitored_orders,
};
use crate::transfers::{ResolveResponse, TransferBuildRequest, TransferBuildResponse};
use crate::types::{
    ExecuteRequest, ExecuteResponse, ProviderCapabilities, QuoteParams, SwapBuildRequest,
    SwapQuote, SwapTransaction, TokenRecord,
};

/// Route info returned by GET /swap/routes.
#[derive(Debug, serde::Serialize)]
pub struct SwapRouteInfo {
    pub provider: String,
    pub capabilities: ProviderCapabilities,
    pub enabled: bool,
}

/// Axum router builder wrapping a `TradeService`.
pub struct TradeRouter {
    service: TradeService,
    admin_auth: Option<crate::admin::AdminAuthMode>,
    rate_limit_per_sec: Option<u32>,
}

impl TradeRouter {
    pub fn new(service: TradeService) -> Self {
        Self { service, admin_auth: None, rate_limit_per_sec: None }
    }

    pub fn with_admin(mut self, auth_mode: crate::admin::AdminAuthMode) -> Self {
        self.admin_auth = Some(auth_mode);
        self
    }

    /// Enable rate limiting with a default requests-per-second for unauthenticated clients.
    /// Per-key limits from the API key store override this default.
    pub fn with_rate_limit(mut self, default_per_sec: u32) -> Self {
        self.rate_limit_per_sec = Some(default_per_sec);
        self
    }

    pub fn into_router(self) -> Router {
        let mut router = Router::new()
            .route("/health", get(health_check))
            .route("/tokens", get(list_tokens))
            .route("/tokens/:mint", get(get_token))
            .route("/swap/quote", post(swap_quote).get(swap_quote_get))
            .route("/swap/build", post(swap_build))
            .route("/swap/compare", get(swap_compare))
            .route("/swap/routes", get(swap_routes))
            .route("/swap/providers", get(swap_providers))
            .route("/prices/:mint", get(get_price))
            .route("/prices/by-symbol/:symbol", get(get_price_by_symbol))
            .route("/prices/batch", post(batch_prices))
            .route("/swap/execute", post(swap_execute))
            .route("/swap/simulate", post(swap_simulate))
            .route("/transfers/build", post(transfer_build))
            .route("/transfers/execute", post(transfer_execute))
            .route("/transfers/resolve/:address", get(transfer_resolve))
            .route("/portfolio/:address/balances", get(portfolio_balances))
            // Orders
            .route("/orders/limit", post(create_limit_order))
            .route("/orders/stop-loss", post(create_stop_loss))
            .route("/orders/take-profit", post(create_take_profit))
            .route("/orders/dca", post(create_dca_order))
            .route("/orders/:order_id", axum::routing::delete(cancel_order))
            .route("/orders/wallet/:wallet_address", get(list_open_orders))
            // Server-monitored orders (embedded wallet)
            .route("/orders/trailing-stop", post(create_trailing_stop))
            .route("/orders/oco", post(create_oco))
            .route("/orders/bracket", post(create_bracket))
            .route("/orders/monitored/:wallet_address", get(list_monitored_orders))
            .route("/orders/:order_id/executions", get(get_executions))
            // Action queue (browser wallet notifications)
            .route("/orders/actions/:wallet_address", get(crate::action_queue::list_actions))
            .route("/orders/actions/:wallet_address/stream", get(crate::action_queue::action_stream))
            .route("/orders/actions/:action_id/complete", post(crate::action_queue::complete_action))
            .route("/orders/actions/:action_id/dismiss", post(crate::action_queue::dismiss_action))
            // Positions
            .route("/positions/:wallet_address", get(get_positions))
            .route("/positions/:wallet_address/pnl", get(get_pnl))
            .route("/positions/:wallet_address/history", get(get_trade_history))
            // Orderbook (Manifest)
            .route("/orderbook/:market", get(crate::orderbook::get_orderbook))
            .route("/orderbook/markets", get(crate::orderbook::find_markets))
            .route("/orders/manifest", post(crate::orderbook::place_manifest_order))
            .route("/ws/orderbook/:market", get(crate::orderbook::ws_orderbook))
            // WebSocket + Metrics
            .route("/ws/prices", get(crate::ws_prices::ws_prices_handler))
            .route("/metrics", get(crate::metrics::metrics_handler))
            .with_state(self.service.clone());

        if let Some(auth_mode) = self.admin_auth {
            router = router.nest(
                "/admin",
                crate::admin::admin_router(self.service.clone(), auth_mode),
            );
        }

        if let Some(rate) = self.rate_limit_per_sec {
            let limiter = std::sync::Arc::new(crate::rate_limit::RateLimiter::new(rate));
            let lookup: std::sync::Arc<dyn crate::rate_limit::KeyRateLookup> =
                std::sync::Arc::new(self.service);
            router = router.layer(axum::middleware::from_fn(move |req, next| {
                let limiter = limiter.clone();
                let lookup = lookup.clone();
                async move { crate::rate_limit::rate_limit_middleware(req, next, limiter, lookup).await }
            }));
        }

        router
    }
}

// --- Token handlers ---

async fn list_tokens(
    State(service): State<TradeService>,
    Query(query): Query<TokenListQuery>,
) -> Result<Json<serde_json::Value>, TradeError> {
    let (tokens, count) = service.list_tokens(query.category.as_deref()).await?;
    Ok(Json(serde_json::json!({ "tokens": tokens, "count": count })))
}

async fn get_token(
    State(service): State<TradeService>,
    Path(mint): Path<String>,
) -> Result<Json<TokenRecord>, TradeError> {
    let token = service
        .token_by_mint(&mint).await
        .ok_or_else(|| TradeError::TokenNotFound(mint))?;
    Ok(Json(token))
}

// --- Swap handlers ---

async fn swap_quote(
    State(service): State<TradeService>,
    Json(params): Json<QuoteParams>,
) -> Result<Json<SwapQuote>, TradeError> {
    Ok(Json(service.get_quote(&params).await?))
}

async fn swap_quote_get(
    State(service): State<TradeService>,
    Query(params): Query<QuoteParams>,
) -> Result<Json<SwapQuote>, TradeError> {
    Ok(Json(service.get_quote(&params).await?))
}

async fn swap_build(
    State(service): State<TradeService>,
    Json(req): Json<SwapBuildRequest>,
) -> Result<Json<SwapTransaction>, TradeError> {
    Ok(Json(service.build_swap(&req.quote, &req.user_public_key).await?))
}

async fn swap_compare(
    State(service): State<TradeService>,
    Query(params): Query<QuoteParams>,
) -> Result<Json<Vec<SwapQuote>>, TradeError> {
    Ok(Json(service.compare_quotes(&params).await?))
}

async fn swap_routes(State(service): State<TradeService>) -> Json<Vec<SwapRouteInfo>> {
    let routes = service.list_providers().await.into_iter()
        .map(|p| SwapRouteInfo { provider: p.name, capabilities: p.capabilities, enabled: p.enabled })
        .collect();
    Json(routes)
}

async fn swap_providers(
    State(service): State<TradeService>,
) -> Json<Vec<crate::types::ProviderInfo>> {
    Json(service.list_providers().await)
}

// --- Price handlers ---

async fn get_price(
    State(service): State<TradeService>,
    Path(mint): Path<String>,
) -> Result<Json<PriceSnapshot>, TradeError> {
    let cg_id = service.token_coingecko_id(&mint).await;
    Ok(Json(service.price_service().get_price(&mint, cg_id.as_deref()).await?))
}

async fn get_price_by_symbol(
    State(service): State<TradeService>,
    Path(symbol): Path<String>,
) -> Result<Json<PriceSnapshot>, TradeError> {
    // Look up mint from symbol via token registry
    let token = service.token_registry_snapshot().await
        .into_iter()
        .find(|t| t.symbol.eq_ignore_ascii_case(&symbol))
        .ok_or_else(|| TradeError::TokenNotFound(format!("symbol: {symbol}")))?;

    let cg_id = token.coingecko_id.as_deref();
    Ok(Json(service.price_service().get_price(&token.mint, cg_id).await?))
}

async fn batch_prices(
    State(service): State<TradeService>,
    Json(req): Json<BatchPriceRequest>,
) -> Result<Json<BatchPriceResponse>, TradeError> {
    if req.mints.is_empty() {
        return Err(TradeError::BadRequest("mints array is empty".into()));
    }
    if req.mints.len() > 100 {
        return Err(TradeError::BadRequest("batch limited to 100 mints".into()));
    }

    let mut prices = Vec::with_capacity(req.mints.len());
    for mint in &req.mints {
        let cg_id = service.token_coingecko_id(mint).await;
        match service.price_service().get_price(mint, cg_id.as_deref()).await {
            Ok(snapshot) => prices.push(snapshot),
            Err(e) => tracing::warn!(mint = %mint, error = %e, "batch price fetch failed"),
        }
    }
    Ok(Json(BatchPriceResponse { prices }))
}

// --- Execute handler (shared by swap and transfer) ---

async fn swap_execute(
    State(service): State<TradeService>,
    Json(req): Json<ExecuteRequest>,
) -> Result<Json<ExecuteResponse>, TradeError> {
    Ok(Json(service.execute_transaction(&req).await?))
}

async fn transfer_execute(
    State(service): State<TradeService>,
    Json(req): Json<ExecuteRequest>,
) -> Result<Json<ExecuteResponse>, TradeError> {
    // Transfers always go via RPC (never Ultra)
    let mut rpc_req = req;
    rpc_req.provider = "rpc".into();
    Ok(Json(service.execute_transaction(&rpc_req).await?))
}

async fn swap_simulate(
    State(service): State<TradeService>,
    Json(req): Json<serde_json::Value>,
) -> Result<Json<serde_json::Value>, TradeError> {
    let signed_tx = req["signedTransaction"].as_str()
        .ok_or_else(|| TradeError::BadRequest("signedTransaction required".into()))?;

    let body = serde_json::json!({
        "jsonrpc": "2.0", "id": 1,
        "method": "simulateTransaction",
        "params": [signed_tx, { "encoding": "base64", "commitment": "processed" }]
    });

    let resp: serde_json::Value = reqwest::Client::new()
        .post(&service.config().solana.rpc_url).json(&body)
        .send().await.map_err(|e| TradeError::RpcError(e.to_string()))?
        .json().await.map_err(|e| TradeError::RpcError(e.to_string()))?;

    if let Some(err) = resp["result"]["value"]["err"].as_object() {
        return Ok(Json(serde_json::json!({
            "success": false, "error": err,
            "logs": resp["result"]["value"]["logs"],
            "unitsConsumed": resp["result"]["value"]["unitsConsumed"],
        })));
    }

    Ok(Json(serde_json::json!({
        "success": true,
        "logs": resp["result"]["value"]["logs"],
        "unitsConsumed": resp["result"]["value"]["unitsConsumed"],
    })))
}

// --- Transfer handlers ---

async fn transfer_build(
    State(service): State<TradeService>,
    Json(req): Json<TransferBuildRequest>,
) -> Result<Json<TransferBuildResponse>, TradeError> {
    service.transfer_service().validate_transfer(&req)?;
    Ok(Json(service.transfer_service().build_transfer(&req).await?))
}

async fn transfer_resolve(
    State(service): State<TradeService>,
    Path(address): Path<String>,
) -> Result<Json<ResolveResponse>, TradeError> {
    Ok(Json(service.transfer_service().resolve_address(&address).await?))
}

// --- Portfolio handlers ---

async fn portfolio_balances(
    State(service): State<TradeService>,
    Path(address): Path<String>,
) -> Result<Json<PortfolioResponse>, TradeError> {
    Ok(Json(service.portfolio_service().get_balances(&address).await?))
}
