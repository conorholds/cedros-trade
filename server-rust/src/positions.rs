//! Position tracking — holdings with current prices and optional P&L.

use serde::{Deserialize, Serialize};

use crate::error::TradeError;
use crate::service::TradeService;

/// Tier 1: Holdings with current prices and values (stateless, RPC only).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PositionsResponse {
    pub holdings: Vec<Holding>,
    pub open_orders: u64,
    pub total_value: String,
}

/// A single token holding with current value.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Holding {
    pub mint: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub symbol: Option<String>,
    pub balance: String,
    pub decimals: u8,
    pub ui_balance: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub current_price: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub current_value: Option<String>,
}

/// Tier 2: Holdings with entry prices and unrealized P&L (requires indexer).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PnlResponse {
    pub holdings: Vec<PnlHolding>,
    pub total_value: String,
    pub total_cost_basis: String,
    pub total_unrealized_pnl: String,
    pub data_source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PnlHolding {
    pub mint: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub symbol: Option<String>,
    pub ui_balance: String,
    pub current_price: String,
    pub current_value: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub entry_price: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cost_basis: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unrealized_pnl: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unrealized_pnl_percent: Option<String>,
}

/// Trade history entry (from indexer).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TradeHistoryEntry {
    pub signature: String,
    pub timestamp: String,
    pub trade_type: String,
    pub input_mint: String,
    pub output_mint: String,
    pub input_amount: String,
    pub output_amount: String,
    pub price: String,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TradeHistoryResponse {
    pub trades: Vec<TradeHistoryEntry>,
}

impl TradeService {
    /// Tier 1: Get holdings with current prices (stateless, no indexer needed).
    pub async fn get_positions(&self, wallet: &str) -> Result<PositionsResponse, TradeError> {
        let portfolio = self.portfolio_service().get_balances(wallet).await?;

        let mut holdings = Vec::new();
        let mut total_value: f64 = 0.0;

        // SOL balance
        let sol_price = self.price_service()
            .get_price(&portfolio.sol_balance.mint, Some("solana")).await.ok();
        let sol_ui = portfolio.sol_balance.ui_amount.unwrap_or(0.0);
        let sol_value = sol_price.as_ref().map(|p| sol_ui * p.price_usd);
        if let Some(v) = sol_value { total_value += v; }

        holdings.push(Holding {
            mint: portfolio.sol_balance.mint,
            symbol: Some("SOL".into()),
            balance: portfolio.sol_balance.amount,
            decimals: 9,
            ui_balance: format!("{sol_ui}"),
            current_price: sol_price.as_ref().map(|p| format!("{:.2}", p.price_usd)),
            current_value: sol_value.map(|v| format!("{v:.2}")),
        });

        // SPL tokens
        for token in portfolio.tokens {
            let cg_id = self.token_coingecko_id(&token.mint).await;
            let price = self.price_service()
                .get_price(&token.mint, cg_id.as_deref()).await.ok();
            let ui = token.ui_amount.unwrap_or(0.0);
            let value = price.as_ref().map(|p| ui * p.price_usd);
            if let Some(v) = value { total_value += v; }

            let symbol = self.token_by_mint(&token.mint).await
                .map(|t| t.symbol);

            holdings.push(Holding {
                mint: token.mint,
                symbol,
                balance: token.amount,
                decimals: token.decimals,
                ui_balance: format!("{ui}"),
                current_price: price.as_ref().map(|p| format!("{:.2}", p.price_usd)),
                current_value: value.map(|v| format!("{v:.2}")),
            });
        }

        // Count open orders
        let open_orders = self.get_open_orders(wallet).await
            .map(|o| (o.limit_orders.len() + o.dca_orders.len()) as u64)
            .unwrap_or(0);

        Ok(PositionsResponse {
            holdings,
            open_orders,
            total_value: format!("{total_value:.2}"),
        })
    }

    /// Tier 2: Holdings with entry prices and P&L (requires indexer).
    pub async fn get_pnl(&self, wallet: &str) -> Result<PnlResponse, TradeError> {
        let positions = self.get_positions(wallet).await?;
        let mut pnl_holdings = Vec::new();
        let mut total_cost_basis: f64 = 0.0;
        let mut total_value: f64 = 0.0;

        for h in &positions.holdings {
            let current_price: f64 = h.current_price.as_deref()
                .and_then(|s| s.parse().ok()).unwrap_or(0.0);
            let current_val: f64 = h.current_value.as_deref()
                .and_then(|s| s.parse().ok()).unwrap_or(0.0);
            total_value += current_val;

            // Fetch swap history for this token to compute FIFO entry price
            let history = self.indexer_service()
                .get_swap_history(wallet, Some(&h.mint), 100).await
                .unwrap_or_default();

            let entry = compute_fifo_entry_price(&history, &h.mint);
            let ui_bal: f64 = h.ui_balance.parse().unwrap_or(0.0);

            let (cost_basis, pnl, pnl_pct) = match entry {
                Some(ep) => {
                    let cb = ui_bal * ep;
                    total_cost_basis += cb;
                    let pnl_val = current_val - cb;
                    let pnl_pct_val = if cb > 0.0 { (pnl_val / cb) * 100.0 } else { 0.0 };
                    (Some(format!("{cb:.2}")),
                     Some(format!("{pnl_val:+.2}")),
                     Some(format!("{pnl_pct_val:+.2}%")))
                }
                None => (None, None, None),
            };

            pnl_holdings.push(PnlHolding {
                mint: h.mint.clone(),
                symbol: h.symbol.clone(),
                ui_balance: h.ui_balance.clone(),
                current_price: format!("{current_price:.2}"),
                current_value: format!("{current_val:.2}"),
                entry_price: entry.map(|e| format!("{e:.2}")),
                cost_basis,
                unrealized_pnl: pnl,
                unrealized_pnl_percent: pnl_pct,
            });
        }

        let total_pnl = total_value - total_cost_basis;

        Ok(PnlResponse {
            holdings: pnl_holdings,
            total_value: format!("{total_value:.2}"),
            total_cost_basis: format!("{total_cost_basis:.2}"),
            total_unrealized_pnl: format!("{total_pnl:+.2}"),
            data_source: self.config().indexer.provider.clone(),
        })
    }

    /// Tier 2: Trade history for a wallet, optionally filtered by mint.
    pub async fn get_trade_history(
        &self,
        wallet: &str,
        mint: Option<&str>,
        limit: usize,
    ) -> Result<TradeHistoryResponse, TradeError> {
        let trades = self.indexer_service()
            .get_swap_history(wallet, mint, limit).await?;
        Ok(TradeHistoryResponse { trades })
    }
}

/// FIFO entry price: weighted average cost from swap history where this mint was the output.
fn compute_fifo_entry_price(history: &[TradeHistoryEntry], mint: &str) -> Option<f64> {
    let mut total_cost = 0.0;
    let mut total_qty = 0.0;

    for trade in history {
        if trade.output_mint == mint {
            let input_val: f64 = trade.input_amount.parse().unwrap_or(0.0);
            let output_qty: f64 = trade.output_amount.parse().unwrap_or(0.0);
            if output_qty > 0.0 {
                total_cost += input_val;
                total_qty += output_qty;
            }
        }
    }

    if total_qty > 0.0 { Some(total_cost / total_qty) } else { None }
}
