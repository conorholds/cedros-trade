use axum_test::TestServer;
use wiremock::matchers::{method, path, query_param};
use wiremock::{Mock, MockServer, ResponseTemplate};

use cedros_trade::{TradeConfig, TradeRouter, TradeService};

async fn setup(mock_jupiter: &MockServer) -> TestServer {
    let config = TradeConfig::builder()
        .solana_rpc_url("https://api.mainnet-beta.solana.com")
        .enable_jupiter(mock_jupiter.uri())
        .build();

    let service = TradeService::new(config).await.unwrap();
    let router = TradeRouter::new(service);

    TestServer::new(router.into_router()).unwrap()
}

#[tokio::test]
async fn test_health_endpoint() {
    let mock = MockServer::start().await;

    // Mock a successful Jupiter health probe
    Mock::given(method("GET"))
        .and(path("/quote"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "inAmount": "1000000",
            "outAmount": "150000",
            "priceImpactPct": "0.01",
            "routePlan": []
        })))
        .mount(&mock)
        .await;

    let server = setup(&mock).await;
    let resp = server.get("/health").await;

    resp.assert_status_ok();
    let body: serde_json::Value = resp.json();
    assert_eq!(body["status"], "healthy");
    assert!(body["version"].is_string());
    assert!(body["providers"].is_array());
}

#[tokio::test]
async fn test_list_tokens() {
    let mock = MockServer::start().await;
    let server = setup(&mock).await;

    let resp = server.get("/tokens").await;
    resp.assert_status_ok();

    let body: serde_json::Value = resp.json();
    assert_eq!(body["count"], 8);
    assert!(body["tokens"].is_array());
}

#[tokio::test]
async fn test_list_tokens_by_category() {
    let mock = MockServer::start().await;
    let server = setup(&mock).await;

    let resp = server.get("/tokens?category=stablecoin").await;
    resp.assert_status_ok();

    let body: serde_json::Value = resp.json();
    assert_eq!(body["count"], 2);
}

#[tokio::test]
async fn test_list_tokens_invalid_category() {
    let mock = MockServer::start().await;
    let server = setup(&mock).await;

    let resp = server.get("/tokens?category=invalid").await;
    resp.assert_status(axum::http::StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_get_token_by_mint() {
    let mock = MockServer::start().await;
    let server = setup(&mock).await;

    let resp = server
        .get("/tokens/So11111111111111111111111111111111111111112")
        .await;
    resp.assert_status_ok();

    let body: serde_json::Value = resp.json();
    assert_eq!(body["symbol"], "SOL");
    assert_eq!(body["decimals"], 9);
}

#[tokio::test]
async fn test_get_token_not_found() {
    let mock = MockServer::start().await;
    let server = setup(&mock).await;

    let resp = server.get("/tokens/nonexistent_mint").await;
    resp.assert_status(axum::http::StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_swap_quote() {
    let mock = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/quote"))
        .and(query_param("inputMint", "So11111111111111111111111111111111111111112"))
        .and(query_param("outputMint", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"))
        .and(query_param("amount", "1000000000"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "inAmount": "1000000000",
            "outAmount": "15000000",
            "priceImpactPct": "0.05",
            "routePlan": [{"ammKey": "test", "label": "Raydium"}]
        })))
        .mount(&mock)
        .await;

    let server = setup(&mock).await;

    let resp = server
        .post("/swap/quote")
        .json(&serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "amount": "1000000000"
        }))
        .await;

    resp.assert_status_ok();
    let body: serde_json::Value = resp.json();
    assert_eq!(body["provider"], "jupiter");
    assert_eq!(body["outAmount"], "15000000");
    assert_eq!(body["gasless"], false);
}

#[tokio::test]
async fn test_swap_quote_invalid_mint() {
    let mock = MockServer::start().await;
    let server = setup(&mock).await;

    let resp = server
        .post("/swap/quote")
        .json(&serde_json::json!({
            "inputMint": "invalid",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "amount": "1000000"
        }))
        .await;

    resp.assert_status(axum::http::StatusCode::BAD_REQUEST);
    let body: serde_json::Value = resp.json();
    assert_eq!(body["error"]["code"], "INVALID_MINT");
}

#[tokio::test]
async fn test_swap_quote_invalid_amount() {
    let mock = MockServer::start().await;
    let server = setup(&mock).await;

    let resp = server
        .post("/swap/quote")
        .json(&serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "amount": "0"
        }))
        .await;

    resp.assert_status(axum::http::StatusCode::BAD_REQUEST);
    let body: serde_json::Value = resp.json();
    assert_eq!(body["error"]["code"], "INVALID_AMOUNT");
}

#[tokio::test]
async fn test_swap_providers_list() {
    let mock = MockServer::start().await;

    // Mock the health probe
    Mock::given(method("GET"))
        .and(path("/quote"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "inAmount": "1000000",
            "outAmount": "150000",
            "priceImpactPct": "0.01",
            "routePlan": []
        })))
        .mount(&mock)
        .await;

    let server = setup(&mock).await;

    let resp = server.get("/swap/providers").await;
    resp.assert_status_ok();

    let body: serde_json::Value = resp.json();
    let providers = body.as_array().unwrap();
    assert_eq!(providers.len(), 1);
    assert_eq!(providers[0]["name"], "jupiter");
    assert_eq!(providers[0]["enabled"], true);
}

#[tokio::test]
async fn test_swap_quote_upstream_error() {
    let mock = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/quote"))
        .respond_with(ResponseTemplate::new(500).set_body_string("internal server error"))
        .mount(&mock)
        .await;

    let server = setup(&mock).await;

    let resp = server
        .post("/swap/quote")
        .json(&serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "amount": "1000000000"
        }))
        .await;

    // With only one provider failing, we get the upstream error (502)
    resp.assert_status(axum::http::StatusCode::BAD_GATEWAY);
}

#[tokio::test]
async fn test_swap_routes() {
    let mock = MockServer::start().await;
    // Mock health probe
    Mock::given(method("GET"))
        .and(path("/quote"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "inAmount": "1000000",
            "outAmount": "150000",
            "priceImpactPct": "0.01",
            "routePlan": []
        })))
        .mount(&mock)
        .await;

    let server = setup(&mock).await;
    let resp = server.get("/swap/routes").await;
    resp.assert_status_ok();

    let body: serde_json::Value = resp.json();
    let routes = body.as_array().unwrap();
    assert_eq!(routes.len(), 1);
    assert_eq!(routes[0]["provider"], "jupiter");
    assert_eq!(routes[0]["enabled"], true);
}

#[tokio::test]
async fn test_transfer_resolve_valid_address() {
    let mock = MockServer::start().await;
    let server = setup(&mock).await;

    let resp = server
        .get("/transfers/resolve/So11111111111111111111111111111111111111112")
        .await;
    resp.assert_status_ok();

    let body: serde_json::Value = resp.json();
    assert_eq!(body["type"], "address");
    assert_eq!(
        body["resolved"],
        "So11111111111111111111111111111111111111112"
    );
}

#[tokio::test]
async fn test_transfer_resolve_invalid_address() {
    let mock = MockServer::start().await;
    let server = setup(&mock).await;

    let resp = server.get("/transfers/resolve/invalid").await;
    resp.assert_status(axum::http::StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_prices_batch_empty() {
    let mock = MockServer::start().await;
    let server = setup(&mock).await;

    let resp = server
        .post("/prices/batch")
        .json(&serde_json::json!({ "mints": [] }))
        .await;
    resp.assert_status(axum::http::StatusCode::BAD_REQUEST);
}

// --- New swap tests ---

/// Valid Jupiter quote response body reused across swap tests.
fn jupiter_quote_body() -> serde_json::Value {
    serde_json::json!({
        "inputMint": "So11111111111111111111111111111111111111112",
        "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        "inAmount": "1000000000",
        "outAmount": "15000000",
        "priceImpactPct": "0.05",
        "otherAmountThreshold": "14925000",
        "routePlan": [{"ammKey": "test", "label": "Raydium"}]
    })
}

#[tokio::test]
async fn test_swap_build() {
    let mock = MockServer::start().await;

    // Jupiter quote endpoint — needed both for health probe and the quote embedded in build.
    Mock::given(method("GET"))
        .and(path("/quote"))
        .respond_with(ResponseTemplate::new(200).set_body_json(jupiter_quote_body()))
        .mount(&mock)
        .await;

    // Jupiter swap endpoint — returns a base64 transaction.
    Mock::given(method("POST"))
        .and(path("/swap"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "swapTransaction": "base64data",
            "lastValidBlockHeight": 12345
        })))
        .mount(&mock)
        .await;

    let server = setup(&mock).await;

    // First obtain a quote so route_data is populated.
    let quote_resp = server
        .post("/swap/quote")
        .json(&serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "amount": "1000000000"
        }))
        .await;
    quote_resp.assert_status_ok();
    let quote: serde_json::Value = quote_resp.json();

    // Now call /swap/build with that quote.
    let build_resp = server
        .post("/swap/build")
        .json(&serde_json::json!({
            "quote": quote,
            "userPublicKey": "So11111111111111111111111111111111111111112"
        }))
        .await;

    build_resp.assert_status_ok();
    let body: serde_json::Value = build_resp.json();
    assert_eq!(body["transaction"], "base64data");
    assert_eq!(body["lastValidBlockHeight"], 12345);
    assert_eq!(body["gasless"], false);
}

#[tokio::test]
async fn test_swap_compare() {
    let mock = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/quote"))
        .and(query_param("inputMint", "So11111111111111111111111111111111111111112"))
        .and(query_param("outputMint", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"))
        .and(query_param("amount", "500000000"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "inAmount": "500000000",
            "outAmount": "7500000",
            "priceImpactPct": "0.03",
            "routePlan": []
        })))
        .mount(&mock)
        .await;

    let server = setup(&mock).await;

    let resp = server
        .get("/swap/compare?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=500000000")
        .await;

    resp.assert_status_ok();
    let body: serde_json::Value = resp.json();
    let quotes = body.as_array().expect("expected an array of quotes");
    assert!(!quotes.is_empty(), "compare should return at least one quote");
    assert_eq!(quotes[0]["provider"], "jupiter");
    assert_eq!(quotes[0]["outAmount"], "7500000");
}

#[tokio::test]
async fn test_swap_quote_with_provider() {
    let mock = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/quote"))
        .and(query_param("inputMint", "So11111111111111111111111111111111111111112"))
        .and(query_param("outputMint", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"))
        .and(query_param("amount", "2000000000"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "inAmount": "2000000000",
            "outAmount": "30000000",
            "priceImpactPct": "0.07",
            "routePlan": [{"ammKey": "abc", "label": "Orca"}]
        })))
        .mount(&mock)
        .await;

    let server = setup(&mock).await;

    let resp = server
        .post("/swap/quote")
        .json(&serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "amount": "2000000000",
            "provider": "jupiter"
        }))
        .await;

    resp.assert_status_ok();
    let body: serde_json::Value = resp.json();
    assert_eq!(body["provider"], "jupiter");
    assert_eq!(body["outAmount"], "30000000");
    assert_eq!(body["gasless"], false);
}

#[tokio::test]
async fn test_swap_build_missing_route_data() {
    let mock = MockServer::start().await;
    let server = setup(&mock).await;

    // Send a quote with no route_data — should fail with 400
    let resp = server
        .post("/swap/build")
        .json(&serde_json::json!({
            "quote": {
                "provider": "jupiter",
                "inputMint": "So11111111111111111111111111111111111111112",
                "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                "inAmount": "1000000000",
                "outAmount": "15000000",
                "priceImpactPct": 0.05,
                "slippageBps": 30,
                "gasless": false
            },
            "userPublicKey": "So11111111111111111111111111111111111111112"
        }))
        .await;

    resp.assert_status(axum::http::StatusCode::BAD_REQUEST);
    let body: serde_json::Value = resp.json();
    assert_eq!(body["error"]["code"], "BAD_REQUEST");
}

#[tokio::test]
async fn test_swap_quote_unknown_provider() {
    let mock = MockServer::start().await;
    let server = setup(&mock).await;

    // Request a quote from "dflow" when only jupiter is enabled
    let resp = server
        .post("/swap/quote")
        .json(&serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "amount": "1000000000",
            "provider": "dflow"
        }))
        .await;

    resp.assert_status(axum::http::StatusCode::BAD_REQUEST);
    let body: serde_json::Value = resp.json();
    assert!(body["error"]["message"].as_str().unwrap().contains("not found"));
}

#[tokio::test]
async fn test_swap_build_wrong_provider() {
    let mock = MockServer::start().await;
    let server = setup(&mock).await;

    // Send a quote claiming to be from "ultra" but only jupiter is enabled
    let resp = server
        .post("/swap/build")
        .json(&serde_json::json!({
            "quote": {
                "provider": "ultra",
                "inputMint": "So11111111111111111111111111111111111111112",
                "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
                "inAmount": "1000000000",
                "outAmount": "15000000",
                "priceImpactPct": 0.05,
                "slippageBps": 30,
                "gasless": false,
                "routeData": {}
            },
            "userPublicKey": "So11111111111111111111111111111111111111112"
        }))
        .await;

    resp.assert_status(axum::http::StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_swap_quote_returns_other_amount_threshold() {
    let mock = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/quote"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "inAmount": "1000000000",
            "outAmount": "15000000",
            "otherAmountThreshold": "14925000",
            "priceImpactPct": "0.05",
            "routePlan": []
        })))
        .mount(&mock)
        .await;

    let server = setup(&mock).await;

    let resp = server
        .post("/swap/quote")
        .json(&serde_json::json!({
            "inputMint": "So11111111111111111111111111111111111111112",
            "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
            "amount": "1000000000"
        }))
        .await;

    resp.assert_status_ok();
    let body: serde_json::Value = resp.json();
    // otherAmountThreshold is the min output after slippage — critical for UI
    assert_eq!(body["otherAmountThreshold"], "14925000");
    assert_eq!(body["outAmount"], "15000000");
}

#[tokio::test]
async fn test_health_reports_degraded_on_provider_failure() {
    let mock = MockServer::start().await;

    // Mock Jupiter returning 500 — provider is unhealthy
    Mock::given(method("GET"))
        .and(path("/quote"))
        .respond_with(ResponseTemplate::new(500))
        .mount(&mock)
        .await;

    let server = setup(&mock).await;
    let resp = server.get("/health").await;
    resp.assert_status_ok();

    let body: serde_json::Value = resp.json();
    assert_eq!(body["status"], "degraded");
    assert_eq!(body["providers"][0]["healthy"], false);
}
