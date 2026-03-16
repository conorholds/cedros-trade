use reqwest::Client;
use serde::{Deserialize, Serialize};

use crate::error::TradeError;
use crate::sns;
use crate::solana_tx::{self, Pubkey, SOL_MINT};

/// Request body for building a transfer transaction.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferBuildRequest {
    pub sender: String,
    pub recipient: String,
    pub mint: String,
    pub amount: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub memo: Option<String>,
}

/// Response from building a transfer transaction.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TransferBuildResponse {
    pub transaction: String,
    pub recipient_resolved: String,
    pub recipient_type: RecipientType,
    /// Block height after which the transaction expires.
    pub last_valid_block_height: u64,
    /// Whether the sender pays rent to create the recipient's token account.
    pub creates_ata: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RecipientType {
    Address,
    Domain,
}

/// Response from resolving an address.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolveResponse {
    pub input: String,
    pub resolved: String,
    #[serde(rename = "type")]
    pub address_type: RecipientType,
}

/// Transfer service — builds unsigned transactions for SOL/SPL transfers.
pub struct TransferService {
    client: Client,
    rpc_url: String,
}

impl TransferService {
    pub fn new(rpc_url: String) -> Self {
        Self {
            client: Client::new(),
            rpc_url,
        }
    }

    pub fn validate_transfer(&self, req: &TransferBuildRequest) -> Result<(), TradeError> {
        validate_pubkey_or_domain(&req.sender, "sender")?;
        validate_pubkey_or_domain(&req.recipient, "recipient")?;
        validate_pubkey_or_domain(&req.mint, "mint")?;

        let amount: u64 = req.amount.parse().map_err(|_| {
            TradeError::InvalidAmount(format!("not a valid u64: {}", req.amount))
        })?;
        if amount == 0 {
            return Err(TradeError::InvalidAmount("amount must be positive".into()));
        }
        Ok(())
    }

    pub async fn build_transfer(
        &self,
        req: &TransferBuildRequest,
    ) -> Result<TransferBuildResponse, TradeError> {
        let sender = Pubkey::from_base58(&req.sender)?;
        let amount: u64 = req.amount.parse().map_err(|_| {
            TradeError::InvalidAmount(format!("not a valid u64: {}", req.amount))
        })?;

        // Resolve recipient — handles both pubkeys and .sol domains
        let resolved = self.resolve_address(&req.recipient).await?;
        let recipient = Pubkey::from_base58(&resolved.resolved)?;
        let recipient_type = resolved.address_type;

        let (blockhash, last_valid_block_height) = self.fetch_blockhash_with_height().await?;
        let is_sol = req.mint == SOL_MINT;
        let mut creates_ata = false;

        let instructions = if is_sol {
            vec![solana_tx::system_transfer(sender, recipient, amount)]
        } else {
            let mint = Pubkey::from_base58(&req.mint)?;
            let decimals = self.fetch_mint_decimals(&req.mint).await?;
            let source_ata = solana_tx::derive_ata(&sender, &mint);
            let dest_ata = solana_tx::derive_ata(&recipient, &mint);

            // Verify sender's ATA exists (they need tokens to send)
            if !self.account_exists(&source_ata).await? {
                return Err(TradeError::BadRequest(format!(
                    "sender has no token account for mint {}",
                    req.mint
                )));
            }

            let mut ixs = Vec::new();

            // Use idempotent ATA creation — safe even if ATA exists (no-op).
            // Always include it to avoid race conditions between our check and tx landing.
            // The sender pays ~0.00203 SOL rent if the ATA is new.
            if !self.account_exists(&dest_ata).await? {
                creates_ata = true;
                ixs.push(solana_tx::create_ata_idempotent(sender, recipient, mint));
            }

            ixs.push(solana_tx::spl_transfer_checked(
                source_ata, mint, dest_ata, sender, amount, decimals,
            ));
            ixs
        };

        let tx_bytes = solana_tx::build_unsigned_transaction(instructions, sender, blockhash);
        let transaction = base64::Engine::encode(
            &base64::engine::general_purpose::STANDARD,
            &tx_bytes,
        );

        Ok(TransferBuildResponse {
            transaction,
            recipient_resolved: resolved.resolved,
            recipient_type,
            last_valid_block_height,
            creates_ata,
        })
    }

    pub async fn resolve_address(&self, input: &str) -> Result<ResolveResponse, TradeError> {
        if input.ends_with(".sol") {
            let resolved = sns::resolve_sol_domain(&self.client, &self.rpc_url, input).await?;
            return Ok(ResolveResponse {
                input: input.to_string(),
                resolved,
                address_type: RecipientType::Domain,
            });
        }

        validate_pubkey(input)?;
        Ok(ResolveResponse {
            input: input.to_string(),
            resolved: input.to_string(),
            address_type: RecipientType::Address,
        })
    }

    async fn fetch_blockhash_with_height(&self) -> Result<([u8; 32], u64), TradeError> {
        let body = serde_json::json!({
            "jsonrpc": "2.0", "id": 1,
            "method": "getLatestBlockhash",
            "params": [{ "commitment": "finalized" }]
        });

        let resp: serde_json::Value = self.client.post(&self.rpc_url).json(&body)
            .send().await.map_err(|e| TradeError::RpcError(e.to_string()))?
            .json().await.map_err(|e| TradeError::RpcError(e.to_string()))?;

        let value = &resp["result"]["value"];
        let hash_str = value["blockhash"].as_str()
            .ok_or_else(|| TradeError::RpcError("missing blockhash".into()))?;
        let height = value["lastValidBlockHeight"].as_u64()
            .ok_or_else(|| TradeError::RpcError("missing lastValidBlockHeight".into()))?;

        let bytes = bs58::decode(hash_str).into_vec()
            .map_err(|e| TradeError::RpcError(format!("invalid blockhash: {e}")))?;
        let arr: [u8; 32] = bytes.try_into()
            .map_err(|_| TradeError::RpcError("blockhash must be 32 bytes".into()))?;
        Ok((arr, height))
    }

    async fn fetch_mint_decimals(&self, mint: &str) -> Result<u8, TradeError> {
        match mint {
            SOL_MINT => return Ok(9),
            "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" => return Ok(6),
            "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" => return Ok(6),
            "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" => return Ok(5),
            "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" => return Ok(6),
            _ => {}
        }
        let body = serde_json::json!({
            "jsonrpc": "2.0", "id": 1,
            "method": "getAccountInfo",
            "params": [mint, { "encoding": "jsonParsed" }]
        });
        let resp: serde_json::Value = self.client.post(&self.rpc_url).json(&body)
            .send().await.map_err(|e| TradeError::RpcError(e.to_string()))?
            .json().await.map_err(|e| TradeError::RpcError(e.to_string()))?;
        resp["result"]["value"]["data"]["parsed"]["info"]["decimals"]
            .as_u64().map(|d| d as u8)
            .ok_or_else(|| TradeError::RpcError(format!("could not get decimals for {mint}")))
    }

    async fn account_exists(&self, pubkey: &Pubkey) -> Result<bool, TradeError> {
        let addr = bs58::encode(pubkey.as_bytes()).into_string();
        let body = serde_json::json!({
            "jsonrpc": "2.0", "id": 1,
            "method": "getAccountInfo",
            "params": [addr, { "encoding": "base64" }]
        });
        let resp: serde_json::Value = self.client.post(&self.rpc_url).json(&body)
            .send().await.map_err(|e| TradeError::RpcError(e.to_string()))?
            .json().await.map_err(|e| TradeError::RpcError(e.to_string()))?;
        Ok(!resp["result"]["value"].is_null())
    }
}

fn validate_pubkey_or_domain(value: &str, field: &str) -> Result<(), TradeError> {
    if value.is_empty() {
        return Err(TradeError::BadRequest(format!("{field} is empty")));
    }
    if value.ends_with(".sol") {
        return Ok(());
    }
    validate_pubkey(value).map_err(|_| {
        TradeError::BadRequest(format!("{field} is not a valid public key or .sol domain"))
    })
}

fn validate_pubkey(value: &str) -> Result<(), TradeError> {
    if value.len() < 32 || value.len() > 44 {
        return Err(TradeError::BadRequest(format!(
            "invalid public key length: {value}"
        )));
    }
    bs58::decode(value).into_vec().map_err(|_| {
        TradeError::BadRequest(format!("not valid base58: {value}"))
    })?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    const SOL: &str = "So11111111111111111111111111111111111111112";
    const USDC: &str = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

    fn make_req(recipient: &str, amount: &str) -> TransferBuildRequest {
        TransferBuildRequest {
            sender: SOL.into(), recipient: recipient.into(),
            mint: SOL.into(), amount: amount.into(), memo: None,
        }
    }

    #[test]
    fn test_validate_transfer() {
        let svc = TransferService::new("http://localhost".into());
        assert!(svc.validate_transfer(&make_req(USDC, "1000000")).is_ok());
    }

    #[test]
    fn test_validate_transfer_zero_amount() {
        let svc = TransferService::new("http://localhost".into());
        assert!(svc.validate_transfer(&make_req(USDC, "0")).is_err());
    }

    #[test]
    fn test_validate_transfer_domain_recipient() {
        let svc = TransferService::new("http://localhost".into());
        assert!(svc.validate_transfer(&make_req("vitalik.sol", "1000000")).is_ok());
    }

    #[tokio::test]
    async fn test_resolve_address_pubkey() {
        let svc = TransferService::new("http://localhost".into());
        let r = svc.resolve_address(SOL).await;
        assert!(r.is_ok());
        assert!(matches!(r.unwrap().address_type, RecipientType::Address));
    }

    #[tokio::test]
    async fn test_resolve_address_domain_no_rpc() {
        let svc = TransferService::new("http://localhost:1".into());
        assert!(svc.resolve_address("vitalik.sol").await.is_err());
    }
}
