use axum::http::{HeaderName, HeaderValue};
use axum_test::TestServer;
use wiremock::matchers::{method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

use cedros_trade::{AdminAuthMode, TradeConfig, TradeRouter, TradeService};

async fn setup_with_admin(mock_jupiter: &MockServer) -> TestServer {
    let config = TradeConfig::builder()
        .solana_rpc_url("https://api.mainnet-beta.solana.com")
        .enable_jupiter(mock_jupiter.uri())
        .build();

    let service = TradeService::new(config).await.unwrap();
    let router = TradeRouter::new(service)
        .with_admin(AdminAuthMode::BearerToken("test-token".into()));

    TestServer::new(router.into_router()).unwrap()
}

fn auth_header() -> (&'static str, &'static str) {
    ("authorization", "Bearer test-token")
}

#[tokio::test]
async fn test_admin_config_requires_auth() {
    let mock = MockServer::start().await;
    let server = setup_with_admin(&mock).await;

    // Without auth — should get 401
    let resp = server.get("/admin/config").await;
    resp.assert_status(axum::http::StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_admin_config_with_auth() {
    let mock = MockServer::start().await;
    let server = setup_with_admin(&mock).await;

    let resp = server
        .get("/admin/config")
        .add_header(HeaderName::from_static(auth_header().0), HeaderValue::from_static(auth_header().1))
        .await;
    resp.assert_status_ok();

    let body: serde_json::Value = resp.json();
    assert!(body["defaultSlippageBps"].is_number());
    assert!(body["enabledProviders"].is_array());
    assert_eq!(body["network"], "mainnet-beta");
}

#[tokio::test]
async fn test_admin_config_redacts_secrets() {
    let mock = MockServer::start().await;
    let server = setup_with_admin(&mock).await;

    let resp = server
        .get("/admin/config")
        .add_header(HeaderName::from_static(auth_header().0), HeaderValue::from_static(auth_header().1))
        .await;
    resp.assert_status_ok();

    let body: serde_json::Value = resp.json();
    // Empty API key should be empty string, not leaked
    let key = body["coingeckoApiKey"].as_str().unwrap();
    assert!(key.is_empty() || key.contains("***"));
}

#[tokio::test]
async fn test_admin_providers_list() {
    let mock = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/quote"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "inAmount": "1000000", "outAmount": "150000",
            "priceImpactPct": "0.01", "routePlan": []
        })))
        .mount(&mock)
        .await;

    let server = setup_with_admin(&mock).await;

    let resp = server
        .get("/admin/providers")
        .add_header(HeaderName::from_static(auth_header().0), HeaderValue::from_static(auth_header().1))
        .await;
    resp.assert_status_ok();

    let body: serde_json::Value = resp.json();
    let providers = body.as_array().unwrap();
    assert_eq!(providers.len(), 1);
    assert_eq!(providers[0]["name"], "jupiter");
}

#[tokio::test]
async fn test_admin_tokens_list() {
    let mock = MockServer::start().await;
    let server = setup_with_admin(&mock).await;

    let resp = server
        .get("/admin/tokens")
        .add_header(HeaderName::from_static(auth_header().0), HeaderValue::from_static(auth_header().1))
        .await;
    resp.assert_status_ok();

    let body: serde_json::Value = resp.json();
    assert_eq!(body["count"], 8);
}

#[tokio::test]
async fn test_admin_stats() {
    let mock = MockServer::start().await;
    let server = setup_with_admin(&mock).await;

    let resp = server
        .get("/admin/stats")
        .add_header(HeaderName::from_static(auth_header().0), HeaderValue::from_static(auth_header().1))
        .await;
    resp.assert_status_ok();

    let body: serde_json::Value = resp.json();
    assert!(body["totalQuotes"].is_number());
    assert!(body["totalSwaps"].is_number());
}

#[tokio::test]
async fn test_admin_api_keys_list_empty() {
    let mock = MockServer::start().await;
    let server = setup_with_admin(&mock).await;

    let resp = server
        .get("/admin/api-keys")
        .add_header(HeaderName::from_static(auth_header().0), HeaderValue::from_static(auth_header().1))
        .await;
    resp.assert_status_ok();

    let body: serde_json::Value = resp.json();
    assert!(body.as_array().unwrap().is_empty());
}

#[tokio::test]
async fn test_admin_wrong_token() {
    let mock = MockServer::start().await;
    let server = setup_with_admin(&mock).await;

    let resp = server
        .get("/admin/config")
        .add_header(HeaderName::from_static("authorization"), HeaderValue::from_static("Bearer wrong-token"))
        .await;
    resp.assert_status(axum::http::StatusCode::UNAUTHORIZED);
}

// --- Config patch ---

#[tokio::test]
async fn test_admin_config_patch_slippage() {
    let mock = MockServer::start().await;
    let server = setup_with_admin(&mock).await;
    let auth = (
        HeaderName::from_static("authorization"),
        HeaderValue::from_static("Bearer test-token"),
    );

    // Default slippage is 30
    let resp = server
        .get("/admin/config")
        .add_header(auth.0.clone(), auth.1.clone())
        .await;
    assert_eq!(resp.json::<serde_json::Value>()["defaultSlippageBps"], 30);

    // Patch slippage to 50
    let resp = server
        .patch("/admin/config")
        .add_header(auth.0.clone(), auth.1.clone())
        .json(&serde_json::json!({ "defaultSlippageBps": 50 }))
        .await;
    resp.assert_status_ok();
    assert_eq!(resp.json::<serde_json::Value>()["effectiveSlippageBps"], 50);

    // Verify config reflects the override
    let resp = server
        .get("/admin/config")
        .add_header(auth.0.clone(), auth.1.clone())
        .await;
    assert_eq!(resp.json::<serde_json::Value>()["defaultSlippageBps"], 50);
}

// --- Provider enable/disable ---

#[tokio::test]
async fn test_admin_disable_enable_provider() {
    let mock = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/quote"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "inAmount": "1000000", "outAmount": "150000",
            "priceImpactPct": "0.01", "routePlan": []
        })))
        .mount(&mock)
        .await;

    let server = setup_with_admin(&mock).await;
    let auth = (
        HeaderName::from_static("authorization"),
        HeaderValue::from_static("Bearer test-token"),
    );

    // Disable jupiter
    let resp = server
        .post("/admin/providers/jupiter/disable")
        .add_header(auth.0.clone(), auth.1.clone())
        .await;
    resp.assert_status_ok();
    let body: serde_json::Value = resp.json();
    assert_eq!(body["status"], "disabled");

    // Check providers list shows disabled
    let resp = server
        .get("/admin/providers")
        .add_header(auth.0.clone(), auth.1.clone())
        .await;
    let body: serde_json::Value = resp.json();
    let providers = body.as_array().unwrap();
    assert_eq!(providers[0]["enabled"], false);

    // Re-enable
    let resp = server
        .post("/admin/providers/jupiter/enable")
        .add_header(auth.0.clone(), auth.1.clone())
        .await;
    resp.assert_status_ok();
    assert_eq!(resp.json::<serde_json::Value>()["status"], "enabled");
}

// --- Token CRUD ---

#[tokio::test]
async fn test_admin_token_crud() {
    let mock = MockServer::start().await;
    let server = setup_with_admin(&mock).await;
    let auth = (
        HeaderName::from_static("authorization"),
        HeaderValue::from_static("Bearer test-token"),
    );

    // Add a new token
    let resp = server
        .post("/admin/tokens")
        .add_header(auth.0.clone(), auth.1.clone())
        .json(&serde_json::json!({
            "mint": "NewTokenMint11111111111111111111111111111",
            "symbol": "TEST",
            "name": "Test Token",
            "decimals": 9,
            "categories": ["meme"]
        }))
        .await;
    resp.assert_status(axum::http::StatusCode::CREATED);
    let body: serde_json::Value = resp.json();
    assert_eq!(body["symbol"], "TEST");

    // Verify it's in the list
    let resp = server
        .get("/admin/tokens")
        .add_header(auth.0.clone(), auth.1.clone())
        .await;
    assert_eq!(resp.json::<serde_json::Value>()["count"], 9);

    // Patch the token
    let resp = server
        .patch("/admin/tokens/NewTokenMint11111111111111111111111111111")
        .add_header(auth.0.clone(), auth.1.clone())
        .json(&serde_json::json!({ "name": "Updated Test Token" }))
        .await;
    resp.assert_status_ok();
    assert_eq!(resp.json::<serde_json::Value>()["name"], "Updated Test Token");

    // Delete the token
    let resp = server
        .delete("/admin/tokens/NewTokenMint11111111111111111111111111111")
        .add_header(auth.0.clone(), auth.1.clone())
        .await;
    resp.assert_status_ok();

    // Verify count is back to 8
    let resp = server
        .get("/admin/tokens")
        .add_header(auth.0.clone(), auth.1.clone())
        .await;
    assert_eq!(resp.json::<serde_json::Value>()["count"], 8);
}

// --- API Key CRUD ---

#[tokio::test]
async fn test_admin_api_key_crud() {
    let mock = MockServer::start().await;
    let server = setup_with_admin(&mock).await;
    let auth = (
        HeaderName::from_static("authorization"),
        HeaderValue::from_static("Bearer test-token"),
    );

    // Create an API key
    let resp = server
        .post("/admin/api-keys")
        .add_header(auth.0.clone(), auth.1.clone())
        .json(&serde_json::json!({
            "name": "Test Key",
            "rateLimit": 100,
            "allowedOrigins": ["https://example.com"]
        }))
        .await;
    resp.assert_status(axum::http::StatusCode::CREATED);
    let key: serde_json::Value = resp.json();
    assert_eq!(key["name"], "Test Key");
    let key_id = key["id"].as_str().unwrap().to_string();

    // List should have 1 key
    let resp = server
        .get("/admin/api-keys")
        .add_header(auth.0.clone(), auth.1.clone())
        .await;
    let keys: Vec<serde_json::Value> = resp.json();
    assert_eq!(keys.len(), 1);

    // Revoke the key
    let resp = server
        .delete(&format!("/admin/api-keys/{key_id}"))
        .add_header(auth.0.clone(), auth.1.clone())
        .await;
    resp.assert_status_ok();

    // List should be empty again
    let resp = server
        .get("/admin/api-keys")
        .add_header(auth.0.clone(), auth.1.clone())
        .await;
    let keys: Vec<serde_json::Value> = resp.json();
    assert_eq!(keys.len(), 0);
}

// --- Stats ---

#[tokio::test]
async fn test_admin_stats_after_quotes() {
    let mock = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/quote"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "inAmount": "1000000000", "outAmount": "15000000",
            "priceImpactPct": "0.05", "routePlan": []
        })))
        .mount(&mock)
        .await;

    let server = setup_with_admin(&mock).await;
    let auth = (
        HeaderName::from_static("authorization"),
        HeaderValue::from_static("Bearer test-token"),
    );

    // Make a swap quote request
    server
        .post("/swap/quote")
        .json(&serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "amount": "1000000000"
        }))
        .await;

    // Check stats reflect the quote
    let resp = server
        .get("/admin/stats")
        .add_header(auth.0.clone(), auth.1.clone())
        .await;
    resp.assert_status_ok();
    let stats: serde_json::Value = resp.json();
    assert_eq!(stats["totalQuotes"], 1);
    assert_eq!(stats["quotesByProvider"]["jupiter"], 1);
}
