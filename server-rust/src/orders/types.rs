use serde::{Deserialize, Serialize};

/// Limit / stop-loss / take-profit order request.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LimitOrderRequest {
    pub maker: String,
    pub input_mint: String,
    pub output_mint: String,
    pub in_amount: String,
    pub out_amount: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expiry: Option<String>,
}

/// Stop-loss order request.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StopLossRequest {
    pub maker: String,
    pub input_mint: String,
    pub output_mint: String,
    pub in_amount: String,
    pub trigger_price: String,
    #[serde(default = "default_slippage")]
    pub slippage_bps: u32,
}

/// Take-profit order request.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TakeProfitRequest {
    pub maker: String,
    pub input_mint: String,
    pub output_mint: String,
    pub in_amount: String,
    pub trigger_price: String,
    #[serde(default = "default_slippage")]
    pub slippage_bps: u32,
}

fn default_slippage() -> u32 { 100 }

/// DCA order request.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DcaOrderRequest {
    pub maker: String,
    pub input_mint: String,
    pub output_mint: String,
    pub total_in_amount: String,
    pub per_cycle_amount: String,
    pub cycle_interval: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_out_per_cycle: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start_at: Option<String>,
}

/// Cancel order request.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CancelOrderRequest {
    pub maker: String,
}

/// Response from building an order transaction.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrderBuildResponse {
    pub transaction: String,
    pub order_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trigger_condition: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub estimated_price: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_cycles: Option<u64>,
}

/// The semantic type of an order (crate-level concept, not on-chain).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum OrderType {
    Limit,
    StopLoss,
    TakeProfit,
}

/// A single open limit/trigger order.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OpenOrder {
    pub order_id: String,
    pub input_mint: String,
    pub output_mint: String,
    pub in_amount: String,
    pub out_amount: String,
    pub filled: String,
    pub status: String,
    pub order_type: OrderType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trigger_price: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expiry: Option<String>,
}

/// A DCA schedule.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DcaOrder {
    pub dca_account_id: String,
    pub input_mint: String,
    pub output_mint: String,
    pub total_in_amount: String,
    pub per_cycle_amount: String,
    pub cycle_interval: u64,
    pub completed_cycles: u64,
    pub total_cycles: u64,
    pub total_out_received: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub next_cycle_at: Option<String>,
}

/// Combined open orders response.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OrdersResponse {
    pub limit_orders: Vec<OpenOrder>,
    pub dca_orders: Vec<DcaOrder>,
}
