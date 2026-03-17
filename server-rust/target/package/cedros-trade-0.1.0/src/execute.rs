//! Transaction execution — submits signed transactions via provider-specific methods.

use std::time::{Duration, Instant};

use crate::error::TradeError;
use crate::service::TradeService;
use crate::types::{ExecuteRequest, ExecuteResponse, ExecuteStatus};

impl TradeService {
    /// Execute (submit) a signed transaction via the appropriate method:
    /// - Ultra: POST to Jupiter's /execute endpoint with requestId
    /// - Jupiter/DFlow/transfers: sendTransaction via Solana RPC
    pub async fn execute_transaction(
        &self,
        req: &ExecuteRequest,
    ) -> Result<ExecuteResponse, TradeError> {
        let start = Instant::now();
        let result = match req.provider.as_str() {
            "ultra" => self.execute_ultra(req).await,
            _ => self.execute_rpc(req).await,
        };
        let ms = start.elapsed().as_millis() as u64;
        let provider = &req.provider;

        match &result {
            Ok(resp) => {
                let success = matches!(
                    resp.status,
                    ExecuteStatus::Confirmed | ExecuteStatus::Submitted
                );
                self.stats().record_swap();
                self.stats().record_execution(provider, ms, success);
                if !success {
                    self.stats().record_error(provider);
                }
            }
            Err(_) => {
                self.stats().record_execution(provider, ms, false);
                self.stats().record_error(provider);
            }
        }

        result
    }

    async fn execute_ultra(&self, req: &ExecuteRequest) -> Result<ExecuteResponse, TradeError> {
        let request_id = req.request_id.as_deref().ok_or_else(|| {
            TradeError::BadRequest("requestId required for Ultra execute".into())
        })?;

        let url = format!("{}/execute", self.config().swap.ultra.api_url);
        let body = serde_json::json!({
            "signedTransaction": req.signed_transaction,
            "requestId": request_id,
        });

        let resp = reqwest::Client::new()
            .post(&url)
            .json(&body)
            .timeout(Duration::from_secs(30))
            .send()
            .await
            .map_err(|e| TradeError::ProviderError {
                provider: "ultra".into(),
                message: e.to_string(),
                source: Some(Box::new(e)),
            })?;

        if !resp.status().is_success() {
            let body = resp.text().await.unwrap_or_default();
            return Err(TradeError::ProviderError {
                provider: "ultra".into(),
                message: format!("execute failed: {body}"),
                source: None,
            });
        }

        let result: serde_json::Value = resp.json().await.map_err(|e| {
            TradeError::ProviderError {
                provider: "ultra".into(),
                message: e.to_string(),
                source: Some(Box::new(e)),
            }
        })?;

        let status = result["status"].as_str().unwrap_or("unknown");
        let signature = result["signature"].as_str().unwrap_or("").to_string();

        let explorer = format!("{}{}", self.config().solana.explorer_url, signature);
        Ok(ExecuteResponse {
            signature,
            status: if status == "Success" { ExecuteStatus::Confirmed } else { ExecuteStatus::Failed },
            last_valid_block_height: None, // Ultra handles expiry internally
            explorer_url: Some(explorer),
        })
    }

    async fn execute_rpc(&self, req: &ExecuteRequest) -> Result<ExecuteResponse, TradeError> {
        let rpc_url = &self.config().solana.rpc_url;
        let body = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "sendTransaction",
            "params": [
                req.signed_transaction,
                { "encoding": "base64", "skipPreflight": true, "maxRetries": 3 }
            ]
        });

        let resp: serde_json::Value = reqwest::Client::new()
            .post(rpc_url)
            .json(&body)
            .timeout(Duration::from_secs(15))
            .send()
            .await
            .map_err(|e| TradeError::RpcError(e.to_string()))?
            .json()
            .await
            .map_err(|e| TradeError::RpcError(e.to_string()))?;

        if let Some(err) = resp.get("error") {
            return Err(TradeError::RpcError(format!(
                "sendTransaction failed: {}",
                err["message"].as_str().unwrap_or("unknown")
            )));
        }

        let signature = resp["result"].as_str().unwrap_or("").to_string();
        let explorer = format!("{}{}", self.config().solana.explorer_url, signature);

        // Fetch lastValidBlockHeight for the frontend to poll against
        let height = self.fetch_block_height().await.ok();

        Ok(ExecuteResponse {
            signature,
            status: ExecuteStatus::Submitted,
            last_valid_block_height: height,
            explorer_url: Some(explorer),
        })
    }

    async fn fetch_block_height(&self) -> Result<u64, TradeError> {
        let body = serde_json::json!({
            "jsonrpc": "2.0", "id": 1,
            "method": "getLatestBlockhash",
            "params": [{ "commitment": "finalized" }]
        });
        let resp: serde_json::Value = reqwest::Client::new()
            .post(&self.config().solana.rpc_url).json(&body)
            .send().await.map_err(|e| TradeError::RpcError(e.to_string()))?
            .json().await.map_err(|e| TradeError::RpcError(e.to_string()))?;
        resp["result"]["value"]["lastValidBlockHeight"].as_u64()
            .ok_or_else(|| TradeError::RpcError("missing lastValidBlockHeight".into()))
    }
}
