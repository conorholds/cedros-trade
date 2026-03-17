//! Solana Name Service (SNS / Bonfida) domain resolution.
//!
//! Resolves `.sol` domains to wallet addresses by looking up name accounts on-chain.

use reqwest::Client;
use sha2::{Digest, Sha256};

use crate::error::TradeError;
use crate::solana_tx::{self, Pubkey};

const HASH_PREFIX: &str = "SPL Name Service";

/// SNS Program ID: namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX
const NAME_PROGRAM_ID: Pubkey = Pubkey::from_bytes([
    11, 169, 105, 192, 43, 220, 174, 150, 2, 45, 220, 126, 40, 204, 136, 184, 67, 125, 246, 136,
    206, 44, 134, 100, 148, 236, 124, 232, 213, 57, 174, 249,
]);

/// SOL TLD parent: 58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx
const SOL_TLD_PARENT: Pubkey = Pubkey::from_bytes([
    60, 6, 83, 17, 20, 143, 108, 80, 52, 225, 45, 73, 48, 149, 12, 195, 173, 181, 54, 13, 100,
    76, 168, 130, 194, 8, 164, 42, 243, 44, 234, 88,
]);

/// Resolve a `.sol` domain to a wallet address via RPC.
pub async fn resolve_sol_domain(
    client: &Client,
    rpc_url: &str,
    domain: &str,
) -> Result<String, TradeError> {
    let name = domain
        .strip_suffix(".sol")
        .ok_or_else(|| TradeError::BadRequest("not a .sol domain".into()))?;

    if name.is_empty() || name.contains('.') {
        return Err(TradeError::BadRequest(format!("invalid .sol domain: {domain}")));
    }

    let hashed_name = hash_name(name);
    let name_account = find_name_account(&hashed_name);
    let name_account_b58 = bs58::encode(name_account.as_bytes()).into_string();

    let body = serde_json::json!({
        "jsonrpc": "2.0", "id": 1,
        "method": "getAccountInfo",
        "params": [name_account_b58, { "encoding": "base64" }]
    });

    let resp: serde_json::Value = client.post(rpc_url).json(&body)
        .send().await.map_err(|e| TradeError::RpcError(format!("SNS lookup failed: {e}")))?
        .json().await.map_err(|e| TradeError::RpcError(format!("SNS parse failed: {e}")))?;

    if resp["result"]["value"].is_null() {
        return Err(TradeError::BadRequest(format!("domain not found: {domain}")));
    }

    let data_b64 = resp["result"]["value"]["data"][0].as_str()
        .ok_or_else(|| TradeError::RpcError("missing account data".into()))?;

    let data = base64::Engine::decode(
        &base64::engine::general_purpose::STANDARD, data_b64,
    ).map_err(|e| TradeError::RpcError(format!("base64 decode failed: {e}")))?;

    // Name account layout: [32 bytes parent] [32 bytes owner] [32 bytes class] [...]
    if data.len() < 96 {
        return Err(TradeError::RpcError("name account data too short".into()));
    }

    let owner_bytes: [u8; 32] = data[32..64].try_into()
        .map_err(|_| TradeError::RpcError("invalid owner bytes".into()))?;

    if owner_bytes == [0u8; 32] {
        return Err(TradeError::BadRequest(format!("domain has no owner: {domain}")));
    }

    Ok(bs58::encode(&owner_bytes).into_string())
}

fn hash_name(name: &str) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(HASH_PREFIX.as_bytes());
    hasher.update(name.as_bytes());
    hasher.finalize().into()
}

fn find_name_account(hashed_name: &[u8; 32]) -> Pubkey {
    let class = [0u8; 32];
    solana_tx::find_program_address(
        &[hashed_name.as_slice(), &class, SOL_TLD_PARENT.as_bytes()],
        &NAME_PROGRAM_ID,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_name_deterministic() {
        let h1 = hash_name("bonfida");
        let h2 = hash_name("bonfida");
        assert_eq!(h1, h2);
        assert_ne!(h1, [0u8; 32]);
    }

    #[test]
    fn test_find_name_account_deterministic() {
        let h = hash_name("test");
        let a1 = find_name_account(&h);
        let a2 = find_name_account(&h);
        assert_eq!(a1.as_bytes(), a2.as_bytes());
    }
}
