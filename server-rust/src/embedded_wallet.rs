//! Embedded wallet signing client — delegates signing to cedros-login's wallet API.
//!
//! The crate never touches private keys. For embedded wallets, it sends an unsigned
//! transaction to cedros-login which signs it using the server-managed keypair.

use std::time::Duration;

use reqwest::Client;
use serde::{Deserialize, Serialize};

use crate::config::EmbeddedWalletConfig;
use crate::error::TradeError;

pub struct EmbeddedWalletClient {
    client: Client,
    config: EmbeddedWalletConfig,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SignRequest {
    transaction: String,
    reason: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    order_id: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignResponse {
    pub signed_transaction: String,
    pub signature: String,
}

impl EmbeddedWalletClient {
    pub fn new(client: Client, config: EmbeddedWalletConfig) -> Self {
        Self { client, config }
    }

    pub fn client_ref(&self) -> &Client {
        &self.client
    }

    pub fn is_enabled(&self) -> bool {
        self.config.enabled && !self.config.cedros_login_url.is_empty()
    }

    /// Sign an unsigned transaction via cedros-login's wallet signing API.
    pub async fn sign(
        &self,
        wallet_id: &str,
        unsigned_tx: &str,
        reason: &str,
        order_id: Option<&str>,
    ) -> Result<SignResponse, TradeError> {
        if !self.is_enabled() {
            return Err(TradeError::BadRequest(
                "embedded wallet signing not configured".into(),
            ));
        }

        let url = format!(
            "{}/wallets/{}/sign",
            self.config.cedros_login_url, wallet_id
        );

        let body = SignRequest {
            transaction: unsigned_tx.to_string(),
            reason: reason.to_string(),
            order_id: order_id.map(|s| s.to_string()),
        };

        let timeout = Duration::from_millis(self.config.signing_timeout_ms);
        let resp = self.client
            .post(&url)
            .bearer_auth(&self.config.service_token)
            .json(&body)
            .timeout(timeout)
            .send()
            .await
            .map_err(|e| TradeError::ProviderError {
                provider: "cedros-login".into(),
                message: format!("signing request failed: {e}"),
                source: Some(Box::new(e)),
            })?;

        if !resp.status().is_success() {
            let status = resp.status();
            let body = resp.text().await.unwrap_or_default();
            return Err(TradeError::ProviderError {
                provider: "cedros-login".into(),
                message: format!("signing failed HTTP {status}: {body}"),
                source: None,
            });
        }

        resp.json().await.map_err(|e| TradeError::ProviderError {
            provider: "cedros-login".into(),
            message: format!("signing response parse: {e}"),
            source: Some(Box::new(e)),
        })
    }

    /// Sign an unsigned transaction and submit it to Solana RPC.
    pub async fn sign_and_submit(
        &self,
        wallet_id: &str,
        unsigned_tx: &str,
        reason: &str,
        order_id: Option<&str>,
        rpc_url: &str,
    ) -> Result<String, TradeError> {
        let signed = self.sign(wallet_id, unsigned_tx, reason, order_id).await?;

        let body = serde_json::json!({
            "jsonrpc": "2.0", "id": 1,
            "method": "sendTransaction",
            "params": [
                signed.signed_transaction,
                { "encoding": "base64", "skipPreflight": true, "maxRetries": 3 }
            ]
        });

        let resp: serde_json::Value = self.client
            .post(rpc_url)
            .json(&body)
            .timeout(Duration::from_secs(15))
            .send().await
            .map_err(|e| TradeError::RpcError(e.to_string()))?
            .json().await
            .map_err(|e| TradeError::RpcError(e.to_string()))?;

        if let Some(err) = resp.get("error") {
            return Err(TradeError::RpcError(format!(
                "sendTransaction failed: {}", err["message"].as_str().unwrap_or("unknown")
            )));
        }

        Ok(resp["result"].as_str().unwrap_or("").to_string())
    }
}
