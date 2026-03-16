use serde::{Deserialize, Serialize};

/// A curated token entry in the registry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenRecord {
    pub mint: String,
    pub symbol: String,
    pub name: String,
    pub decimals: u8,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub logo_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub coingecko_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tradingview_symbol: Option<String>,
    pub categories: Vec<TokenCategory>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum TokenCategory {
    Governance,
    Meme,
    LiquidStaking,
    Stablecoin,
}

/// Parameters for requesting a swap quote.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuoteParams {
    pub input_mint: String,
    pub output_mint: String,
    /// Amount in smallest unit (lamports / raw token amount).
    pub amount: String,
    /// Slippage tolerance in basis points. Uses default if omitted.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slippage_bps: Option<u32>,
    /// Request quote from a specific provider.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider: Option<String>,
}

/// A swap quote returned by a provider.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SwapQuote {
    pub provider: String,
    pub input_mint: String,
    pub output_mint: String,
    pub in_amount: String,
    pub out_amount: String,
    /// Minimum output after slippage — the worst-case the user will accept.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub other_amount_threshold: Option<String>,
    pub price_impact_pct: f64,
    pub slippage_bps: u32,
    /// Opaque provider-specific data needed to build the transaction.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub route_data: Option<serde_json::Value>,
    /// Whether this swap is gasless (e.g. Jupiter Ultra).
    #[serde(default)]
    pub gasless: bool,
}

/// An unsigned swap transaction ready for wallet signing.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SwapTransaction {
    /// Base64-encoded serialized transaction.
    pub transaction: String,
    /// Whether the transaction is gasless (no SOL needed for fees).
    #[serde(default)]
    pub gasless: bool,
    /// Block height after which the transaction expires.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_valid_block_height: Option<u64>,
    /// Request ID for Ultra execute flow.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
}

/// Request body for building a swap transaction from an accepted quote.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SwapBuildRequest {
    pub quote: SwapQuote,
    /// The user's wallet address (fee payer / signer).
    pub user_public_key: String,
}

/// Request to execute (submit) a signed transaction.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteRequest {
    /// Base64-encoded signed transaction.
    pub signed_transaction: String,
    /// Provider that built the transaction (determines submission method).
    pub provider: String,
    /// Request ID from Ultra order (required for Ultra, ignored for others).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
}

/// Result of executing a signed transaction.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecuteResponse {
    pub signature: String,
    pub status: ExecuteStatus,
    /// Block height after which the tx expires (retain from build step if not present).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_valid_block_height: Option<u64>,
    /// Explorer URL for the transaction.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub explorer_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExecuteStatus {
    Confirmed,
    Submitted,
    Failed,
}

/// Health status of a swap provider.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderHealth {
    pub name: String,
    pub healthy: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub latency_ms: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Capabilities advertised by a swap provider.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderCapabilities {
    pub name: String,
    pub gasless: bool,
    pub mev_protected: bool,
    pub supports_exact_out: bool,
}

/// Response shape for provider listing.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderInfo {
    pub name: String,
    pub enabled: bool,
    pub capabilities: ProviderCapabilities,
    pub health: ProviderHealth,
}
