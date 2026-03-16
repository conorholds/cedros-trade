use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::warn;

use crate::error::TradeError;

/// Token balance entry in a portfolio.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TokenBalance {
    pub mint: String,
    pub amount: String,
    pub decimals: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ui_amount: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub symbol: Option<String>,
}

/// Portfolio response with SOL + SPL balances.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PortfolioResponse {
    pub address: String,
    pub sol_balance: TokenBalance,
    pub tokens: Vec<TokenBalance>,
}

/// Portfolio service — reads wallet balances via Solana RPC.
pub struct PortfolioService {
    client: Client,
    rpc_url: String,
}

impl PortfolioService {
    pub fn new(client: Client, rpc_url: String) -> Self {
        Self { client, rpc_url }
    }

    pub async fn get_balances(&self, address: &str) -> Result<PortfolioResponse, TradeError> {
        // Validate address
        if address.len() < 32 || address.len() > 44 {
            return Err(TradeError::BadRequest(format!(
                "invalid wallet address: {address}"
            )));
        }
        bs58::decode(address).into_vec().map_err(|_| {
            TradeError::BadRequest(format!("invalid base58 address: {address}"))
        })?;

        // Fetch SOL balance and token accounts concurrently
        let sol_fut = self.fetch_sol_balance(address);
        let tokens_fut = self.fetch_token_accounts(address);

        let (sol_result, tokens_result) = tokio::join!(sol_fut, tokens_fut);

        let sol_balance = sol_result?;
        let tokens = tokens_result.unwrap_or_else(|e| {
            warn!(error = %e, "failed to fetch token accounts");
            Vec::new()
        });

        Ok(PortfolioResponse {
            address: address.to_string(),
            sol_balance,
            tokens,
        })
    }

    async fn fetch_sol_balance(&self, address: &str) -> Result<TokenBalance, TradeError> {
        let body = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getBalance",
            "params": [address]
        });

        let resp = self
            .client
            .post(&self.rpc_url)
            .json(&body)
            .send()
            .await
            .map_err(|e| TradeError::RpcError(e.to_string()))?;

        let rpc_resp: RpcResponse<RpcBalanceResult> = resp
            .json()
            .await
            .map_err(|e| TradeError::RpcError(format!("failed to parse balance: {e}")))?;

        if let Some(err) = rpc_resp.error {
            return Err(TradeError::RpcError(format!(
                "RPC error {}: {}",
                err.code, err.message
            )));
        }

        let lamports = rpc_resp
            .result
            .map(|r| r.value)
            .unwrap_or(0);

        Ok(TokenBalance {
            mint: "So11111111111111111111111111111111111111112".into(),
            amount: lamports.to_string(),
            decimals: 9,
            ui_amount: Some(lamports as f64 / 1_000_000_000.0),
            symbol: Some("SOL".into()),
        })
    }

    async fn fetch_token_accounts(
        &self,
        address: &str,
    ) -> Result<Vec<TokenBalance>, TradeError> {
        let body = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "getTokenAccountsByOwner",
            "params": [
                address,
                { "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
                { "encoding": "jsonParsed" }
            ]
        });

        let resp = self
            .client
            .post(&self.rpc_url)
            .json(&body)
            .send()
            .await
            .map_err(|e| TradeError::RpcError(e.to_string()))?;

        let rpc_resp: RpcResponse<RpcTokenAccountsResult> = resp
            .json()
            .await
            .map_err(|e| TradeError::RpcError(format!("failed to parse token accounts: {e}")))?;

        if let Some(err) = rpc_resp.error {
            return Err(TradeError::RpcError(format!(
                "RPC error {}: {}",
                err.code, err.message
            )));
        }

        let accounts = rpc_resp
            .result
            .map(|r| r.value)
            .unwrap_or_default();

        let balances: Vec<TokenBalance> = accounts
            .into_iter()
            .filter_map(|account| {
                let info = account.account.data.parsed.info;
                let amount_str = info.token_amount.amount;

                // Skip zero balances
                if amount_str == "0" {
                    return None;
                }

                Some(TokenBalance {
                    mint: info.mint,
                    amount: amount_str,
                    decimals: info.token_amount.decimals,
                    ui_amount: info.token_amount.ui_amount,
                    symbol: None, // Could be enriched from token registry
                })
            })
            .collect();

        Ok(balances)
    }
}

// --- Solana RPC response types ---

#[derive(Debug, Deserialize)]
struct RpcResponse<T> {
    result: Option<T>,
    #[serde(default)]
    error: Option<RpcError>,
}

#[derive(Debug, Deserialize)]
struct RpcError {
    code: i64,
    message: String,
}

#[derive(Debug, Deserialize)]
struct RpcBalanceResult {
    value: u64,
}

#[derive(Debug, Deserialize)]
struct RpcTokenAccountsResult {
    value: Vec<RpcTokenAccount>,
}

#[derive(Debug, Deserialize)]
struct RpcTokenAccount {
    account: RpcAccountData,
}

#[derive(Debug, Deserialize)]
struct RpcAccountData {
    data: RpcParsedData,
}

#[derive(Debug, Deserialize)]
struct RpcParsedData {
    parsed: RpcParsedInfo,
}

#[derive(Debug, Deserialize)]
struct RpcParsedInfo {
    info: RpcTokenInfo,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RpcTokenInfo {
    mint: String,
    token_amount: RpcTokenAmount,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct RpcTokenAmount {
    amount: String,
    decimals: u8,
    #[serde(default)]
    ui_amount: Option<f64>,
}
