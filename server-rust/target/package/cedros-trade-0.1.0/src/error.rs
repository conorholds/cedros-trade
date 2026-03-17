use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum TradeError {
    #[error("upstream timeout: {0}")]
    UpstreamTimeout(String),

    #[error("rate limited")]
    RateLimited,

    #[error("invalid mint address: {0}")]
    InvalidMint(String),

    #[error("invalid amount: {0}")]
    InvalidAmount(String),

    #[error("RPC error: {0}")]
    RpcError(String),

    #[error("provider error ({provider}): {message}")]
    ProviderError {
        provider: String,
        message: String,
        #[source]
        source: Option<Box<dyn std::error::Error + Send + Sync>>,
    },

    #[error("CoinGecko error: {0}")]
    CoinGeckoError(String),

    #[error("token not found: {0}")]
    TokenNotFound(String),

    #[error("config error: {0}")]
    ConfigError(String),

    #[error("no swap providers available")]
    NoProvidersAvailable,

    #[error("bad request: {0}")]
    BadRequest(String),

    #[error("indexer not configured")]
    IndexerNotConfigured,
}

impl TradeError {
    fn error_code(&self) -> &'static str {
        match self {
            Self::UpstreamTimeout(_) => "UPSTREAM_TIMEOUT",
            Self::RateLimited => "RATE_LIMITED",
            Self::InvalidMint(_) => "INVALID_MINT",
            Self::InvalidAmount(_) => "INVALID_AMOUNT",
            Self::RpcError(_) => "RPC_ERROR",
            Self::ProviderError { .. } => "PROVIDER_ERROR",
            Self::CoinGeckoError(_) => "COINGECKO_ERROR",
            Self::TokenNotFound(_) => "TOKEN_NOT_FOUND",
            Self::ConfigError(_) => "CONFIG_ERROR",
            Self::NoProvidersAvailable => "NO_PROVIDERS_AVAILABLE",
            Self::BadRequest(_) => "BAD_REQUEST",
            Self::IndexerNotConfigured => "INDEXER_NOT_CONFIGURED",
        }
    }

    fn status_code(&self) -> StatusCode {
        match self {
            Self::UpstreamTimeout(_) => StatusCode::BAD_GATEWAY,
            Self::RateLimited => StatusCode::TOO_MANY_REQUESTS,
            Self::InvalidMint(_) | Self::InvalidAmount(_) | Self::BadRequest(_) => {
                StatusCode::BAD_REQUEST
            }
            Self::RpcError(_) | Self::ProviderError { .. } | Self::CoinGeckoError(_) => {
                StatusCode::BAD_GATEWAY
            }
            Self::TokenNotFound(_) => StatusCode::NOT_FOUND,
            Self::ConfigError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Self::NoProvidersAvailable => StatusCode::SERVICE_UNAVAILABLE,
            Self::IndexerNotConfigured => StatusCode::SERVICE_UNAVAILABLE,
        }
    }
}

#[derive(Serialize)]
struct ErrorBody {
    error: ErrorDetail,
}

#[derive(Serialize)]
struct ErrorDetail {
    code: &'static str,
    message: String,
}

impl IntoResponse for TradeError {
    fn into_response(self) -> Response {
        let status = self.status_code();
        let body = ErrorBody {
            error: ErrorDetail {
                code: self.error_code(),
                message: self.to_string(),
            },
        };
        (status, axum::Json(body)).into_response()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_error_status_codes() {
        assert_eq!(
            TradeError::UpstreamTimeout("x".into()).status_code(),
            StatusCode::BAD_GATEWAY
        );
        assert_eq!(TradeError::RateLimited.status_code(), StatusCode::TOO_MANY_REQUESTS);
        assert_eq!(
            TradeError::InvalidMint("bad".into()).status_code(),
            StatusCode::BAD_REQUEST
        );
        assert_eq!(
            TradeError::InvalidAmount("0".into()).status_code(),
            StatusCode::BAD_REQUEST
        );
        assert_eq!(
            TradeError::RpcError("rpc down".into()).status_code(),
            StatusCode::BAD_GATEWAY
        );
        assert_eq!(
            TradeError::ProviderError {
                provider: "jupiter".into(),
                message: "oops".into(),
                source: None,
            }
            .status_code(),
            StatusCode::BAD_GATEWAY
        );
        assert_eq!(
            TradeError::CoinGeckoError("err".into()).status_code(),
            StatusCode::BAD_GATEWAY
        );
        assert_eq!(
            TradeError::TokenNotFound("mint".into()).status_code(),
            StatusCode::NOT_FOUND
        );
        assert_eq!(
            TradeError::ConfigError("bad toml".into()).status_code(),
            StatusCode::INTERNAL_SERVER_ERROR
        );
        assert_eq!(
            TradeError::NoProvidersAvailable.status_code(),
            StatusCode::SERVICE_UNAVAILABLE
        );
        assert_eq!(
            TradeError::BadRequest("nope".into()).status_code(),
            StatusCode::BAD_REQUEST
        );
    }

    #[tokio::test]
    async fn test_error_json_shape() {
        let err = TradeError::TokenNotFound("mint_abc".into());
        let response = err.into_response();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);

        let bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .expect("body readable");
        let json: serde_json::Value =
            serde_json::from_slice(&bytes).expect("body is valid JSON");

        assert_eq!(json["error"]["code"], "TOKEN_NOT_FOUND");
        assert!(
            json["error"]["message"]
                .as_str()
                .unwrap_or("")
                .contains("mint_abc"),
            "message should include the mint identifier"
        );
        // Verify no extra top-level keys beyond `error`
        assert!(json.as_object().map(|o| o.len() == 1).unwrap_or(false));
    }

    #[tokio::test]
    async fn test_provider_error_is_502() {
        let err = TradeError::ProviderError {
            provider: "jupiter".into(),
            message: "HTTP 500: internal".into(),
            source: None,
        };
        let response = err.into_response();
        assert_eq!(response.status(), StatusCode::BAD_GATEWAY);

        let bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let json: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(json["error"]["code"], "PROVIDER_ERROR");
        assert!(json["error"]["message"].as_str().unwrap().contains("jupiter"));
    }

    #[tokio::test]
    async fn test_no_providers_is_503() {
        let err = TradeError::NoProvidersAvailable;
        let response = err.into_response();
        assert_eq!(response.status(), StatusCode::SERVICE_UNAVAILABLE);

        let bytes = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
        let json: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(json["error"]["code"], "NO_PROVIDERS_AVAILABLE");
    }
}
