use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};

use crate::error::TradeError;
use crate::service::TradeService;
use crate::stats::StatsSnapshot;
use crate::types::{ProviderInfo, TokenCategory, TokenRecord};

// --- Auth ---

/// How admin endpoints are authenticated.
#[derive(Debug, Clone)]
pub enum AdminAuthMode {
    BearerToken(String),
    None,
}

pub fn admin_router(service: TradeService, auth_mode: AdminAuthMode) -> Router {
    let routes = Router::new()
        .route("/config", get(get_config))
        .route("/config", patch(patch_config))
        .route("/providers", get(list_providers))
        .route("/providers/:id/enable", post(enable_provider))
        .route("/providers/:id/disable", post(disable_provider))
        .route("/tokens", get(list_tokens))
        .route("/tokens", post(add_token))
        .route("/tokens/:mint", patch(patch_token))
        .route("/tokens/:mint", delete(delete_token))
        .route("/api-keys", get(list_api_keys))
        .route("/api-keys", post(create_api_key))
        .route("/api-keys/:id", delete(revoke_api_key))
        .route("/stats", get(get_stats))
        .route("/orders/stats", get(get_order_stats))
        .route("/monitor/status", get(get_monitor_status))
        .route("/monitor/pause", post(pause_monitor))
        .route("/monitor/resume", post(resume_monitor))
        .with_state(service);

    match auth_mode {
        AdminAuthMode::BearerToken(token) => routes.layer(
            axum::middleware::from_fn(move |headers, request, next| {
                bearer_auth(headers, request, next, token.clone())
            }),
        ),
        AdminAuthMode::None => routes,
    }
}

async fn bearer_auth(
    headers: HeaderMap,
    request: axum::extract::Request,
    next: Next,
    expected: String,
) -> Response {
    let header = headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");

    if let Some(token) = header.strip_prefix("Bearer ") {
        if token == expected {
            return next.run(request).await;
        }
    }

    (StatusCode::UNAUTHORIZED, "unauthorized").into_response()
}

// --- Config ---

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdminConfigResponse {
    pub solana_rpc_url: String,
    pub network: String,
    pub default_slippage_bps: u32,
    pub enabled_providers: Vec<String>,
    pub jupiter_api_url: String,
    pub ultra_api_url: String,
    pub ultra_fee_bps: u32,
    pub dflow_api_url: String,
    pub dflow_fallback_to_jupiter: bool,
    pub coingecko_api_url: String,
    pub coingecko_api_key: String,
    pub quote_cache_ttl_secs: u64,
    pub price_cache_ttl_secs: u64,
    pub token_source: String,
}

fn redact(secret: &str) -> String {
    if secret.is_empty() {
        return String::new();
    }
    if secret.len() <= 8 {
        return "***".into();
    }
    format!("{}***{}", &secret[..3], &secret[secret.len() - 3..])
}

async fn get_config(State(svc): State<TradeService>) -> Json<AdminConfigResponse> {
    let c = svc.config();
    let ov = svc.config_overrides().await;
    Json(AdminConfigResponse {
        solana_rpc_url: c.solana.rpc_url.clone(),
        network: c.solana.network.clone(),
        default_slippage_bps: ov.default_slippage_bps.unwrap_or(c.swap.default_slippage_bps),
        enabled_providers: c.swap.enabled_providers.clone(),
        jupiter_api_url: c.swap.jupiter.api_url.clone(),
        ultra_api_url: c.swap.ultra.api_url.clone(),
        ultra_fee_bps: c.swap.ultra.fee_bps,
        dflow_api_url: c.swap.dflow.api_url.clone(),
        dflow_fallback_to_jupiter: c.swap.dflow.fallback_to_jupiter,
        coingecko_api_url: c.coingecko.api_url.clone(),
        coingecko_api_key: redact(&c.coingecko.api_key),
        quote_cache_ttl_secs: c.swap.jupiter.quote_cache_ttl_secs,
        price_cache_ttl_secs: c.coingecko.price_cache_ttl_secs,
        token_source: c.tokens.source.clone(),
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfigPatch {
    pub default_slippage_bps: Option<u32>,
}

async fn patch_config(
    State(svc): State<TradeService>,
    Json(patch): Json<ConfigPatch>,
) -> Result<Json<serde_json::Value>, TradeError> {
    let overrides = crate::service::ConfigOverrides {
        default_slippage_bps: patch.default_slippage_bps,
    };
    svc.apply_config_overrides(overrides).await;
    let eff_slippage = svc.effective_slippage_bps().await;
    Ok(Json(serde_json::json!({
        "applied": true,
        "effectiveSlippageBps": eff_slippage,
    })))
}

// --- Providers ---

async fn list_providers(State(svc): State<TradeService>) -> Json<Vec<ProviderInfo>> {
    Json(svc.list_providers().await)
}

async fn enable_provider(
    State(svc): State<TradeService>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, TradeError> {
    svc.enable_provider(&id).await?;
    Ok(Json(serde_json::json!({ "status": "enabled", "provider": id })))
}

async fn disable_provider(
    State(svc): State<TradeService>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, TradeError> {
    svc.disable_provider(&id).await?;
    Ok(Json(serde_json::json!({ "status": "disabled", "provider": id })))
}

// --- Tokens ---

async fn list_tokens(State(svc): State<TradeService>) -> Json<serde_json::Value> {
    let tokens = svc.token_registry_snapshot().await;
    let count = tokens.len();
    Json(serde_json::json!({ "tokens": tokens, "count": count }))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AddTokenRequest {
    pub mint: String,
    pub symbol: String,
    pub name: String,
    pub decimals: u8,
    #[serde(default)]
    pub logo_url: Option<String>,
    #[serde(default)]
    pub coingecko_id: Option<String>,
    #[serde(default)]
    pub categories: Vec<TokenCategory>,
}

async fn add_token(
    State(svc): State<TradeService>,
    Json(req): Json<AddTokenRequest>,
) -> Result<(StatusCode, Json<TokenRecord>), TradeError> {
    let token = TokenRecord {
        mint: req.mint,
        symbol: req.symbol,
        name: req.name,
        decimals: req.decimals,
        logo_url: req.logo_url,
        coingecko_id: req.coingecko_id,
        tradingview_symbol: None,
        categories: req.categories,
    };
    svc.add_token(token.clone()).await?;
    Ok((StatusCode::CREATED, Json(token)))
}

/// Fields that can be patched on a token.
#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenPatch {
    pub name: Option<String>,
    pub symbol: Option<String>,
    pub logo_url: Option<String>,
    pub coingecko_id: Option<String>,
    pub categories: Option<Vec<TokenCategory>>,
}

async fn patch_token(
    State(svc): State<TradeService>,
    Path(mint): Path<String>,
    Json(patch): Json<TokenPatch>,
) -> Result<Json<TokenRecord>, TradeError> {
    let updated = svc.update_token(&mint, patch).await?;
    Ok(Json(updated))
}

async fn delete_token(
    State(svc): State<TradeService>,
    Path(mint): Path<String>,
) -> Result<Json<serde_json::Value>, TradeError> {
    svc.remove_token(&mint).await?;
    Ok(Json(serde_json::json!({ "deleted": mint })))
}

// --- API Keys ---

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateApiKeyRequest {
    pub name: String,
    #[serde(default)]
    pub rate_limit: Option<u32>,
    #[serde(default)]
    pub allowed_origins: Vec<String>,
}

async fn list_api_keys(
    State(svc): State<TradeService>,
) -> Json<Vec<crate::service::ApiKey>> {
    Json(svc.list_api_keys().await)
}

async fn create_api_key(
    State(svc): State<TradeService>,
    Json(req): Json<CreateApiKeyRequest>,
) -> (StatusCode, Json<crate::service::ApiKey>) {
    let key = svc
        .create_api_key(req.name, req.rate_limit, req.allowed_origins)
        .await;
    (StatusCode::CREATED, Json(key))
}

async fn revoke_api_key(
    State(svc): State<TradeService>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, TradeError> {
    svc.revoke_api_key(&id).await?;
    Ok(Json(serde_json::json!({ "revoked": id })))
}

// --- Stats ---

async fn get_stats(State(svc): State<TradeService>) -> Json<StatsSnapshot> {
    Json(svc.stats().snapshot())
}

async fn get_order_stats(
    State(svc): State<TradeService>,
) -> Json<serde_json::Value> {
    // Aggregate order counts — best-effort, returns zeros on failure
    let snap = svc.stats().snapshot();
    Json(serde_json::json!({
        "totalSwapsExecuted": snap.total_swaps,
        "executionsSucceeded": snap.executions.succeeded,
        "executionsFailed": snap.executions.failed,
        "quotesRequested": snap.total_quotes,
        "cacheHitRatio": snap.cache_hit_ratio,
    }))
}

async fn get_monitor_status(State(svc): State<TradeService>) -> Json<serde_json::Value> {
    match svc.monitor() {
        Some(m) => Json(serde_json::to_value(m.status().await).unwrap_or_default()),
        None => Json(serde_json::json!({
            "activeOrders": 0, "paused": false, "enabled": false
        })),
    }
}

async fn pause_monitor(State(svc): State<TradeService>) -> Json<serde_json::Value> {
    if let Some(m) = svc.monitor() {
        m.paused().store(true, std::sync::atomic::Ordering::Relaxed);
    }
    Json(serde_json::json!({ "status": "paused" }))
}

async fn resume_monitor(State(svc): State<TradeService>) -> Json<serde_json::Value> {
    if let Some(m) = svc.monitor() {
        m.paused().store(false, std::sync::atomic::Ordering::Relaxed);
    }
    Json(serde_json::json!({ "status": "resumed" }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_redact_empty() {
        assert_eq!(redact(""), "");
    }

    #[test]
    fn test_redact_short() {
        assert_eq!(redact("abc"), "***");
    }

    #[test]
    fn test_redact_long() {
        assert_eq!(redact("my-secret-key-123"), "my-***123");
    }
}
