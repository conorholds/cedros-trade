use axum::extract::State;
use axum::Json;
use serde::Serialize;

use crate::service::TradeService;
use crate::types::ProviderHealth;

#[derive(Debug, Serialize)]
pub struct HealthResponse {
    pub status: &'static str,
    pub version: &'static str,
    pub providers: Vec<ProviderHealth>,
}

pub async fn health_check(State(service): State<TradeService>) -> Json<HealthResponse> {
    let providers = service.provider_health().await;
    let all_healthy = providers.iter().all(|p| p.healthy);

    Json(HealthResponse {
        status: if all_healthy { "healthy" } else { "degraded" },
        version: env!("CARGO_PKG_VERSION"),
        providers,
    })
}
