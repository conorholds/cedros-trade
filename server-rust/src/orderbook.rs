//! Manifest orderbook integration — reads on-chain CLOB data and serves it via REST + WebSocket.

use std::time::Duration;

use axum::extract::ws::{Message, WebSocket};
use axum::extract::{Path, Query, State, WebSocketUpgrade};
use axum::response::Response;
use axum::Json;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::debug;

use crate::config::ManifestConfig;
use crate::error::TradeError;
use crate::solana_tx::{self, Pubkey, Instruction, AccountMeta};

/// A single orderbook level (price + aggregated size).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OrderbookLevel {
    pub price: f64,
    pub size: f64,
    pub total: f64,
}

/// Full orderbook snapshot.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderbookSnapshot {
    pub market: String,
    pub base_mint: String,
    pub quote_mint: String,
    pub bids: Vec<OrderbookLevel>,
    pub asks: Vec<OrderbookLevel>,
    pub spread: f64,
    pub mid_price: f64,
    pub timestamp: String,
}

/// Query params for market discovery.
#[derive(Debug, Deserialize)]
pub struct MarketQuery {
    pub base: String,
    pub quote: String,
}

/// Manifest market info.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MarketInfo {
    pub address: String,
    pub base_mint: String,
    pub quote_mint: String,
}

pub struct OrderbookService {
    client: Client,
    rpc_url: String,
    config: ManifestConfig,
}

impl OrderbookService {
    pub fn new(client: Client, rpc_url: String, config: ManifestConfig) -> Self {
        Self { client, rpc_url, config }
    }

    /// Fetch orderbook from Manifest on-chain account.
    pub async fn get_orderbook(&self, market_address: &str) -> Result<OrderbookSnapshot, TradeError> {
        if !self.config.enabled {
            return Err(TradeError::BadRequest("Manifest orderbook not enabled".into()));
        }

        // Fetch the market account data via RPC
        let body = serde_json::json!({
            "jsonrpc": "2.0", "id": 1,
            "method": "getAccountInfo",
            "params": [market_address, { "encoding": "base64" }]
        });

        let resp: serde_json::Value = self.client.post(&self.rpc_url).json(&body)
            .timeout(Duration::from_secs(5))
            .send().await
            .map_err(|e| TradeError::RpcError(format!("orderbook fetch: {e}")))?
            .json().await
            .map_err(|e| TradeError::RpcError(format!("orderbook parse: {e}")))?;

        if resp["result"]["value"].is_null() {
            return Err(TradeError::BadRequest(format!("market not found: {market_address}")));
        }

        let data_b64 = resp["result"]["value"]["data"][0].as_str()
            .ok_or_else(|| TradeError::RpcError("missing account data".into()))?;
        let data = base64::Engine::decode(
            &base64::engine::general_purpose::STANDARD, data_b64,
        ).map_err(|e| TradeError::RpcError(format!("base64: {e}")))?;

        self.parse_manifest_market(market_address, &data)
    }

    /// Parse Manifest market account data into orderbook levels.
    /// Manifest's hypertree format: 128-byte header followed by 80-byte nodes.
    fn parse_manifest_market(&self, market_address: &str, data: &[u8]) -> Result<OrderbookSnapshot, TradeError> {
        if data.len() < 128 {
            return Err(TradeError::RpcError("market account too small".into()));
        }

        // Header layout (first 128 bytes):
        // [0..32]   base_mint
        // [32..64]  quote_mint
        // [64..68]  base_decimals (u8 at 64)
        // [68..72]  quote_decimals (u8 at 68)
        // [72..76]  bids_root_index (u32)
        // [76..80]  asks_root_index (u32)
        // ... rest of header

        let base_mint = bs58::encode(&data[0..32]).into_string();
        let quote_mint = bs58::encode(&data[32..64]).into_string();
        let base_decimals = data[64] as u32;
        let quote_decimals = data[68] as u32;

        // Parse tree nodes into bids and asks
        // Each node is 80 bytes starting at offset 128
        let node_size = 80;
        let nodes_start = 128;
        let mut bids: Vec<OrderbookLevel> = Vec::new();
        let mut asks: Vec<OrderbookLevel> = Vec::new();

        if data.len() > nodes_start {
            let node_count = (data.len() - nodes_start) / node_size;
            for i in 0..node_count {
                let offset = nodes_start + i * node_size;
                if offset + node_size > data.len() { break; }

                let node = &data[offset..offset + node_size];
                // Node type discriminator at byte 0: 1=bid, 2=ask, 3=free, 4=seat
                let node_type = node[0];
                if node_type != 1 && node_type != 2 { continue; }

                // Price stored as u64 at bytes [8..16], size at [16..24]
                let price_raw = u64::from_le_bytes(node[8..16].try_into().unwrap_or([0; 8]));
                let size_raw = u64::from_le_bytes(node[16..24].try_into().unwrap_or([0; 8]));

                if price_raw == 0 || size_raw == 0 { continue; }

                let price = price_raw as f64 / 10f64.powi(quote_decimals as i32);
                let size = size_raw as f64 / 10f64.powi(base_decimals as i32);

                let level = OrderbookLevel { price, size, total: price * size };

                if node_type == 1 { bids.push(level); }
                else { asks.push(level); }
            }
        }

        bids.sort_by(|a, b| b.price.partial_cmp(&a.price).unwrap_or(std::cmp::Ordering::Equal));
        asks.sort_by(|a, b| a.price.partial_cmp(&b.price).unwrap_or(std::cmp::Ordering::Equal));

        let best_bid = bids.first().map(|l| l.price).unwrap_or(0.0);
        let best_ask = asks.first().map(|l| l.price).unwrap_or(0.0);
        let mid_price = if best_bid > 0.0 && best_ask > 0.0 { (best_bid + best_ask) / 2.0 } else { 0.0 };
        let spread = if best_bid > 0.0 { (best_ask - best_bid) / mid_price * 100.0 } else { 0.0 };

        Ok(OrderbookSnapshot {
            market: market_address.to_string(),
            base_mint, quote_mint,
            bids: bids.into_iter().take(50).collect(),
            asks: asks.into_iter().take(50).collect(),
            spread, mid_price,
            timestamp: chrono::Utc::now().to_rfc3339(),
        })
    }

    /// Find market address for a base+quote mint pair.
    pub fn find_market(&self, base_mint: &str, quote_mint: &str) -> Option<String> {
        let key = format!("{base_mint}:{quote_mint}");
        self.config.markets.get(&key)
            .filter(|addr| !addr.is_empty())
            .cloned()
    }
}

/// Request to place an order on a Manifest market.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestOrderRequest {
    pub market: String,
    pub maker: String,
    pub is_bid: bool,
    pub num_base_tokens: f64,
    pub token_price: f64,
    pub order_type: String, // "limit"
}

/// Response with unsigned transaction for placing a Manifest order.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestOrderResponse {
    pub transaction: String,
    pub order_id: String,
    pub needs_seat_setup: bool,
}

// Manifest instruction discriminators (first 8 bytes of sha256("global:instruction_name"))
const PLACE_ORDER_DISCRIMINATOR: [u8; 8] = [51, 194, 155, 175, 109, 130, 96, 203]; // PlaceOrder
const CLAIM_SEAT_DISCRIMINATOR: [u8; 8] = [133, 252, 250, 150, 172, 244, 175, 94]; // ClaimSeat

impl OrderbookService {
    /// Build an unsigned transaction for placing an order on Manifest.
    pub async fn build_place_order(
        &self, req: &ManifestOrderRequest,
    ) -> Result<ManifestOrderResponse, TradeError> {
        if !self.config.enabled {
            return Err(TradeError::BadRequest("Manifest not enabled".into()));
        }

        let program_id = Pubkey::from_base58(&self.config.program_id)?;
        let market = Pubkey::from_base58(&req.market)?;
        let maker = Pubkey::from_base58(&req.maker)?;

        // Fetch market account to get decimals
        let snapshot = self.get_orderbook(&req.market).await?;
        let base_decimals = self.parse_decimals(&snapshot, true);
        let quote_decimals = self.parse_decimals(&snapshot, false);

        let base_atoms = (req.num_base_tokens * 10f64.powi(base_decimals as i32)) as u64;
        let price_mantissa = (req.token_price * 10f64.powi(quote_decimals as i32)) as u64;

        let needs_seat = self.check_needs_seat(&req.maker, &req.market).await?;
        let order_id = uuid::Uuid::new_v4().to_string();

        let mut instructions = Vec::new();

        // ClaimSeat if needed (must be done before first order on a market)
        if needs_seat {
            let mut data = Vec::with_capacity(8);
            data.extend_from_slice(&CLAIM_SEAT_DISCRIMINATOR);

            instructions.push(Instruction {
                program_id,
                accounts: vec![
                    AccountMeta { pubkey: maker, is_signer: true, is_writable: false },
                    AccountMeta { pubkey: market, is_signer: false, is_writable: true },
                    AccountMeta { pubkey: solana_tx::SYSTEM_PROGRAM, is_signer: false, is_writable: false },
                ],
                data,
            });
        }

        // PlaceOrder instruction
        // Data layout: [8 discriminator] [8 base_atoms] [8 price_mantissa] [1 is_bid] [1 order_type] [8 last_valid_slot] [8 client_order_id]
        let mut data = Vec::with_capacity(42);
        data.extend_from_slice(&PLACE_ORDER_DISCRIMINATOR);
        data.extend_from_slice(&base_atoms.to_le_bytes());
        data.extend_from_slice(&price_mantissa.to_le_bytes());
        data.push(if req.is_bid { 1 } else { 0 });
        data.push(0); // OrderType::Limit = 0
        data.extend_from_slice(&0u64.to_le_bytes()); // lastValidSlot = 0 (no expiry)
        data.extend_from_slice(&0u64.to_le_bytes()); // clientOrderId = 0

        // Derive the trader's base and quote token accounts
        let base_mint = Pubkey::from_base58(&snapshot.base_mint)?;
        let quote_mint = Pubkey::from_base58(&snapshot.quote_mint)?;
        let trader_base = solana_tx::derive_ata(&maker, &base_mint);
        let trader_quote = solana_tx::derive_ata(&maker, &quote_mint);
        let vault_base = solana_tx::derive_ata(&market, &base_mint);
        let vault_quote = solana_tx::derive_ata(&market, &quote_mint);

        instructions.push(Instruction {
            program_id,
            accounts: vec![
                AccountMeta { pubkey: maker, is_signer: true, is_writable: true },
                AccountMeta { pubkey: market, is_signer: false, is_writable: true },
                AccountMeta { pubkey: trader_base, is_signer: false, is_writable: true },
                AccountMeta { pubkey: trader_quote, is_signer: false, is_writable: true },
                AccountMeta { pubkey: vault_base, is_signer: false, is_writable: true },
                AccountMeta { pubkey: vault_quote, is_signer: false, is_writable: true },
                AccountMeta { pubkey: solana_tx::TOKEN_PROGRAM, is_signer: false, is_writable: false },
                AccountMeta { pubkey: base_mint, is_signer: false, is_writable: false },
                AccountMeta { pubkey: quote_mint, is_signer: false, is_writable: false },
            ],
            data,
        });

        // Fetch blockhash and build unsigned transaction
        let blockhash = self.fetch_blockhash().await?;
        let tx_bytes = solana_tx::build_unsigned_transaction(instructions, maker, blockhash);
        let transaction = base64::Engine::encode(
            &base64::engine::general_purpose::STANDARD, &tx_bytes,
        );

        Ok(ManifestOrderResponse { transaction, order_id, needs_seat_setup: needs_seat })
    }

    fn parse_decimals(&self, snapshot: &OrderbookSnapshot, is_base: bool) -> u32 {
        // Parse from the market account data we already fetched
        // For known mints, use hardcoded values
        let mint = if is_base { &snapshot.base_mint } else { &snapshot.quote_mint };
        match mint.as_str() {
            "So11111111111111111111111111111111111111112" => 9,
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" => 6,
            "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" => 6,
            _ => 9, // Default
        }
    }

    async fn check_needs_seat(&self, maker: &str, market: &str) -> Result<bool, TradeError> {
        // Fetch market account and check if maker has a seat in the ClaimedSeats tree
        let body = serde_json::json!({
            "jsonrpc": "2.0", "id": 1,
            "method": "getAccountInfo",
            "params": [market, { "encoding": "base64" }]
        });
        let resp: serde_json::Value = self.client.post(&self.rpc_url).json(&body)
            .timeout(Duration::from_secs(5)).send().await
            .map_err(|e| TradeError::RpcError(e.to_string()))?
            .json().await
            .map_err(|e| TradeError::RpcError(e.to_string()))?;

        let data_b64 = resp["result"]["value"]["data"][0].as_str().unwrap_or("");
        if data_b64.is_empty() { return Ok(true); }

        let data = base64::Engine::decode(
            &base64::engine::general_purpose::STANDARD, data_b64,
        ).unwrap_or_default();

        // Search for maker's pubkey in the seat nodes (type 4)
        let maker_bytes = bs58::decode(maker).into_vec().unwrap_or_default();
        if maker_bytes.len() != 32 || data.len() < 128 { return Ok(true); }

        let node_size = 80;
        let nodes_start = 128;
        for i in 0..((data.len() - nodes_start) / node_size) {
            let offset = nodes_start + i * node_size;
            if offset + node_size > data.len() { break; }
            if data[offset] == 4 && data[offset + 8..offset + 40] == maker_bytes[..] {
                return Ok(false); // Already has a seat
            }
        }

        Ok(true) // No seat found
    }

    async fn fetch_blockhash(&self) -> Result<[u8; 32], TradeError> {
        let body = serde_json::json!({
            "jsonrpc": "2.0", "id": 1,
            "method": "getLatestBlockhash",
            "params": [{ "commitment": "finalized" }]
        });
        let resp: serde_json::Value = self.client.post(&self.rpc_url).json(&body)
            .send().await.map_err(|e| TradeError::RpcError(e.to_string()))?
            .json().await.map_err(|e| TradeError::RpcError(e.to_string()))?;
        let hash_str = resp["result"]["value"]["blockhash"].as_str()
            .ok_or_else(|| TradeError::RpcError("missing blockhash".into()))?;
        let bytes = bs58::decode(hash_str).into_vec()
            .map_err(|e| TradeError::RpcError(format!("blockhash: {e}")))?;
        bytes.try_into().map_err(|_| TradeError::RpcError("blockhash 32 bytes".into()))
    }
}

// --- Axum handlers ---

pub async fn get_orderbook(
    State(svc): State<crate::service::TradeService>,
    Path(market): Path<String>,
) -> Result<Json<OrderbookSnapshot>, TradeError> {
    Ok(Json(svc.orderbook_service().get_orderbook(&market).await?))
}

pub async fn find_markets(
    State(svc): State<crate::service::TradeService>,
    Query(q): Query<MarketQuery>,
) -> Result<Json<Vec<MarketInfo>>, TradeError> {
    let mut results = Vec::new();
    if let Some(addr) = svc.orderbook_service().find_market(&q.base, &q.quote) {
        results.push(MarketInfo {
            address: addr, base_mint: q.base.clone(), quote_mint: q.quote.clone(),
        });
    }
    // Also check reverse pair
    if let Some(addr) = svc.orderbook_service().find_market(&q.quote, &q.base) {
        results.push(MarketInfo {
            address: addr, base_mint: q.quote.clone(), quote_mint: q.base.clone(),
        });
    }
    Ok(Json(results))
}

pub async fn place_manifest_order(
    State(svc): State<crate::service::TradeService>,
    Json(req): Json<ManifestOrderRequest>,
) -> Result<Json<ManifestOrderResponse>, TradeError> {
    Ok(Json(svc.orderbook_service().build_place_order(&req).await?))
}

pub async fn ws_orderbook(
    ws: WebSocketUpgrade,
    State(svc): State<crate::service::TradeService>,
    Path(market): Path<String>,
) -> Response {
    ws.on_upgrade(move |socket| handle_orderbook_ws(socket, svc, market))
}

async fn handle_orderbook_ws(
    mut socket: WebSocket, svc: crate::service::TradeService, market: String,
) {
    let mut interval = tokio::time::interval(Duration::from_millis(1000));

    loop {
        tokio::select! {
            _ = interval.tick() => {
                match svc.orderbook_service().get_orderbook(&market).await {
                    Ok(snapshot) => {
                        let msg = serde_json::to_string(&snapshot).unwrap_or_default();
                        if socket.send(Message::Text(msg)).await.is_err() { return; }
                    }
                    Err(e) => {
                        debug!(error = %e, "orderbook ws fetch failed");
                    }
                }
            }
            msg = socket.recv() => {
                match msg {
                    Some(Ok(Message::Close(_))) | None => return,
                    _ => {}
                }
            }
        }
    }
}
