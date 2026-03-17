//! AI discovery system — machine-readable API surface for LLM agents.
//!
//! Follows the cedros AI discovery pattern (v3.1.0):
//! - /ai.txt, /llms.txt, /llms-full.txt, /llms-admin.txt
//! - /agent.md, /skill.md, /skill.json
//! - /heartbeat.md, /heartbeat.json
//! - /skills/*.md (per-domain skill files)
//! - /.well-known/* (ai-discovery.json, ai-plugin.json, agent.json, mcp, skills.zip)
//!
//! Content generators in `content.rs` are pure functions (no HTTP) for reuse.

pub mod content;
pub mod skill_files;
pub mod types;

use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;

use content::*;
use skill_files::*;
use types::ContentConfig;

fn config() -> ContentConfig { ContentConfig::new("") }
fn text(content: String) -> Response { (StatusCode::OK, [(header::CONTENT_TYPE, "text/plain; charset=utf-8")], content).into_response() }
fn markdown(content: String) -> Response { (StatusCode::OK, [(header::CONTENT_TYPE, "text/markdown; charset=utf-8")], content).into_response() }

// --- Text endpoints ---
pub async fn ai_txt() -> Response { text(generate_ai_txt(&config())) }
pub async fn llms_txt() -> Response { text(generate_llms_txt(&config())) }
pub async fn llms_full_txt() -> Response { text(generate_llms_full_txt(&config())) }
pub async fn llms_admin_txt() -> Response { text(generate_llms_admin_txt(&config())) }

// --- Markdown endpoints ---
pub async fn agent_md() -> Response { markdown(generate_agent_md(&config())) }

pub async fn skill_md() -> Response {
    let c = config();
    let meta = get_skill_metadata(&c);
    let yaml = serde_json::to_string_pretty(&meta).unwrap_or_default();
    let skills = get_skill_references(&c);
    let list: String = skills.iter().map(|s| format!("- [{}]({}): {}", s.name, s.path, s.description)).collect::<Vec<_>>().join("\n");
    markdown(format!("---\n{yaml}\n---\n\n# Cedros Trade Skills\n\n{list}\n"))
}

// --- JSON endpoints ---
pub async fn skill_json() -> Json<types::SkillMetadata> { Json(get_skill_metadata(&config())) }
pub async fn heartbeat_json() -> Json<types::HeartbeatResponse> { Json(get_heartbeat(&config())) }
pub async fn heartbeat_md() -> Response {
    let hb = get_heartbeat(&config());
    markdown(format!("# Heartbeat\n\nStatus: {}\nVersion: {}\nCapabilities: {}\n", hb.status, hb.version, hb.capabilities.join(", ")))
}

// --- Skill files ---
pub async fn skill_swap_md() -> Response { markdown(generate_skill_swap_md(&config())) }
pub async fn skill_transfers_md() -> Response { markdown(generate_skill_transfers_md(&config())) }
pub async fn skill_orders_md() -> Response { markdown(generate_skill_orders_md(&config())) }
pub async fn skill_positions_md() -> Response { markdown(generate_skill_positions_md(&config())) }
pub async fn skill_orderbook_md() -> Response { markdown(generate_skill_orderbook_md(&config())) }
pub async fn skill_admin_md() -> Response { markdown(generate_skill_admin_md(&config())) }

// --- Well-known manifests ---
pub async fn ai_discovery_index() -> Json<types::AiDiscoveryIndex> { Json(get_discovery_index(&config())) }
pub async fn ai_plugin_json() -> Json<types::AiPluginManifest> { Json(get_ai_plugin_manifest(&config())) }
pub async fn agent_json() -> Json<types::AgentCard> { Json(get_agent_card(&config())) }
pub async fn mcp_discovery() -> Json<types::McpDiscovery> { Json(get_mcp_discovery(&config())) }

pub async fn openapi_json() -> Json<serde_json::Value> {
    Json(generate_openapi(&config()))
}

fn generate_openapi(c: &ContentConfig) -> serde_json::Value {
    serde_json::json!({
        "openapi": "3.1.0",
        "info": { "title": "Cedros Trade API", "version": c.version, "description": c.description },
        "servers": [{ "url": if c.base_path.is_empty() { "/" } else { &c.base_path } }],
        "paths": {
            "/health": { "get": { "operationId": "getHealth", "tags": ["health"], "summary": "Service health" } },
            "/tokens": { "get": { "operationId": "listTokens", "tags": ["tokens"], "summary": "List tokens" } },
            "/tokens/{mint}": { "get": { "operationId": "getToken", "tags": ["tokens"], "summary": "Get token by mint" } },
            "/swap/quote": { "get": { "operationId": "getQuote", "tags": ["swap"], "summary": "Get swap quote" }, "post": { "operationId": "postQuote", "tags": ["swap"], "summary": "Get swap quote (POST)" } },
            "/swap/build": { "post": { "operationId": "buildSwap", "tags": ["swap"], "summary": "Build unsigned swap transaction" } },
            "/swap/execute": { "post": { "operationId": "executeSwap", "tags": ["swap"], "summary": "Submit signed swap" } },
            "/swap/simulate": { "post": { "operationId": "simulateSwap", "tags": ["swap"], "summary": "Simulate transaction" } },
            "/swap/compare": { "get": { "operationId": "compareQuotes", "tags": ["swap"], "summary": "Compare all providers" } },
            "/swap/providers": { "get": { "operationId": "getProviders", "tags": ["swap"], "summary": "List providers" } },
            "/prices/{mint}": { "get": { "operationId": "getPrice", "tags": ["prices"], "summary": "Get price" } },
            "/prices/by-symbol/{symbol}": { "get": { "operationId": "getPriceBySymbol", "tags": ["prices"], "summary": "Price by symbol" } },
            "/prices/batch": { "post": { "operationId": "batchPrices", "tags": ["prices"], "summary": "Batch prices" } },
            "/transfers/build": { "post": { "operationId": "buildTransfer", "tags": ["transfers"], "summary": "Build transfer" } },
            "/transfers/execute": { "post": { "operationId": "executeTransfer", "tags": ["transfers"], "summary": "Execute transfer" } },
            "/transfers/resolve/{address}": { "get": { "operationId": "resolveAddress", "tags": ["transfers"], "summary": "Resolve address" } },
            "/orders/limit": { "post": { "operationId": "createLimitOrder", "tags": ["orders"], "summary": "Create limit order" } },
            "/orders/stop-loss": { "post": { "operationId": "createStopLoss", "tags": ["orders"], "summary": "Create stop-loss" } },
            "/orders/take-profit": { "post": { "operationId": "createTakeProfit", "tags": ["orders"], "summary": "Create take-profit" } },
            "/orders/dca": { "post": { "operationId": "createDca", "tags": ["orders"], "summary": "Create DCA" } },
            "/orders/trailing-stop": { "post": { "operationId": "createTrailingStop", "tags": ["orders"], "summary": "Create trailing stop" } },
            "/orders/oco": { "post": { "operationId": "createOco", "tags": ["orders"], "summary": "Create OCO" } },
            "/orders/bracket": { "post": { "operationId": "createBracket", "tags": ["orders"], "summary": "Create bracket" } },
            "/orders/{orderId}": { "delete": { "operationId": "cancelOrder", "tags": ["orders"], "summary": "Cancel order" } },
            "/orders/wallet/{address}": { "get": { "operationId": "getOpenOrders", "tags": ["orders"], "summary": "List orders" } },
            "/positions/{address}": { "get": { "operationId": "getPositions", "tags": ["positions"], "summary": "Get holdings" } },
            "/positions/{address}/pnl": { "get": { "operationId": "getPnl", "tags": ["positions"], "summary": "Get P&L" } },
            "/positions/{address}/history": { "get": { "operationId": "getHistory", "tags": ["positions"], "summary": "Trade history" } },
            "/orderbook/{market}": { "get": { "operationId": "getOrderbook", "tags": ["orderbook"], "summary": "Get orderbook" } },
            "/orderbook/markets": { "get": { "operationId": "findMarkets", "tags": ["orderbook"], "summary": "Find market" } },
            "/orders/manifest": { "post": { "operationId": "placeManifestOrder", "tags": ["orderbook"], "summary": "Place order" } },
        },
        "tags": [
            { "name": "health" }, { "name": "tokens" }, { "name": "swap" }, { "name": "prices" },
            { "name": "transfers" }, { "name": "orders" }, { "name": "positions" }, { "name": "orderbook" },
        ]
    })
}
