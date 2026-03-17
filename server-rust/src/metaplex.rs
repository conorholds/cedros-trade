//! Metaplex Token Metadata fallback — fetches name, symbol, and logo URI
//! for tokens not in the curated registry.

use std::sync::Arc;
use std::time::{Duration, Instant};

use dashmap::DashMap;
use reqwest::Client;
use serde::Serialize;

use crate::error::TradeError;
use crate::solana_tx::{self, Pubkey};

/// Metaplex Token Metadata program ID.
const METADATA_PROGRAM: Pubkey = Pubkey::from_bytes([
    11, 112, 101, 177, 227, 209, 124, 69, 56, 157, 82, 127, 107, 4, 195, 205,
    88, 184, 108, 115, 26, 160, 253, 181, 73, 182, 209, 188, 3, 248, 41, 70,
]); // metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s

/// Cached Metaplex metadata.
#[derive(Debug, Clone, Serialize)]
pub struct TokenMetadata {
    pub mint: String,
    pub name: String,
    pub symbol: String,
    pub uri: String,
}

struct CachedMeta {
    meta: Option<TokenMetadata>,
    expires_at: Instant,
}

pub struct MetaplexService {
    client: Client,
    rpc_url: String,
    cache: Arc<DashMap<String, CachedMeta>>,
}

impl MetaplexService {
    pub fn new(client: Client, rpc_url: String) -> Self {
        Self { client, rpc_url, cache: Arc::new(DashMap::new()) }
    }

    /// Fetch token metadata from Metaplex. Returns None if not found.
    pub async fn get_metadata(&self, mint: &str) -> Result<Option<TokenMetadata>, TradeError> {
        // Check cache
        if let Some(entry) = self.cache.get(mint) {
            if entry.expires_at > Instant::now() {
                return Ok(entry.meta.clone());
            }
        }

        let result = self.fetch_onchain(mint).await;
        let meta = result.ok().flatten();

        // Cache for 1 hour (even misses, to avoid repeated lookups)
        self.cache.insert(mint.to_string(), CachedMeta {
            meta: meta.clone(),
            expires_at: Instant::now() + Duration::from_secs(3600),
        });

        Ok(meta)
    }

    async fn fetch_onchain(&self, mint: &str) -> Result<Option<TokenMetadata>, TradeError> {
        let mint_pk = Pubkey::from_base58(mint)?;

        // Derive metadata PDA: ["metadata", METADATA_PROGRAM, mint]
        let metadata_pda = solana_tx::find_program_address(
            &[b"metadata", METADATA_PROGRAM.as_bytes(), mint_pk.as_bytes()],
            &METADATA_PROGRAM,
        );
        let pda_b58 = bs58::encode(metadata_pda.as_bytes()).into_string();

        // Fetch the account
        let body = serde_json::json!({
            "jsonrpc": "2.0", "id": 1,
            "method": "getAccountInfo",
            "params": [pda_b58, { "encoding": "base64" }]
        });

        let resp: serde_json::Value = self.client.post(&self.rpc_url).json(&body)
            .timeout(Duration::from_secs(5))
            .send().await
            .map_err(|e| TradeError::RpcError(format!("metaplex fetch: {e}")))?
            .json().await
            .map_err(|e| TradeError::RpcError(format!("metaplex parse: {e}")))?;

        if resp["result"]["value"].is_null() {
            return Ok(None);
        }

        let data_b64 = resp["result"]["value"]["data"][0].as_str()
            .ok_or_else(|| TradeError::RpcError("missing metaplex data".into()))?;
        let data = base64::Engine::decode(
            &base64::engine::general_purpose::STANDARD, data_b64,
        ).map_err(|e| TradeError::RpcError(format!("base64: {e}")))?;

        self.parse_metadata(mint, &data)
    }

    /// Parse Metaplex Token Metadata account data.
    /// Layout: [1 key] [32 update_authority] [32 mint] [4+name] [4+symbol] [4+uri] ...
    fn parse_metadata(&self, mint: &str, data: &[u8]) -> Result<Option<TokenMetadata>, TradeError> {
        if data.len() < 69 { return Ok(None); } // Too small

        let mut offset = 1 + 32 + 32; // Skip key + update_authority + mint

        let name = self.read_borsh_string(data, &mut offset)?;
        let symbol = self.read_borsh_string(data, &mut offset)?;
        let uri = self.read_borsh_string(data, &mut offset)?;

        // Trim null bytes (Metaplex pads with \0)
        let name = name.trim_end_matches('\0').trim().to_string();
        let symbol = symbol.trim_end_matches('\0').trim().to_string();
        let uri = uri.trim_end_matches('\0').trim().to_string();

        if name.is_empty() && symbol.is_empty() { return Ok(None); }

        Ok(Some(TokenMetadata { mint: mint.to_string(), name, symbol, uri }))
    }

    fn read_borsh_string(&self, data: &[u8], offset: &mut usize) -> Result<String, TradeError> {
        if *offset + 4 > data.len() { return Ok(String::new()); }
        let len = u32::from_le_bytes(data[*offset..*offset + 4].try_into().unwrap_or([0; 4])) as usize;
        *offset += 4;
        if *offset + len > data.len() { return Ok(String::new()); }
        let s = String::from_utf8_lossy(&data[*offset..*offset + len]).to_string();
        *offset += len;
        Ok(s)
    }
}
