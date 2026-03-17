//! Persistence for server-monitored orders via PostgreSQL.
//! Uses the same DATABASE_URL connection string as cedros-login and cedros-pay.

use serde::{Deserialize, Serialize};
use sqlx::postgres::PgPoolOptions;
use sqlx::{FromRow, PgPool};

use crate::error::TradeError;

/// A server-monitored order persisted across restarts.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct MonitoredOrder {
    pub id: String,
    pub order_type: String,
    pub maker: String,
    pub wallet_id: String,
    pub input_mint: String,
    pub output_mint: String,
    pub in_amount: String,
    pub status: String,
    pub config_json: String,
    pub current_trigger: Option<String>,
    pub peak_price: Option<String>,
    pub created_at: String,
    pub executed_at: Option<String>,
    pub tx_signature: Option<String>,
    pub fill_price: Option<String>,
    pub linked_order_id: Option<String>,
}

/// Execution record for a monitored order.
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionRecord {
    pub order_id: String,
    pub timestamp: String,
    pub tx_signature: String,
    pub fill_price: String,
    pub slippage_bps: Option<i32>,
    pub status: String,
}

pub struct Storage {
    pool: PgPool,
}

impl Storage {
    /// Connect to postgres using DATABASE_URL (same as cedros-login / cedros-pay).
    pub fn pool(&self) -> &PgPool { &self.pool }

    pub async fn connect(database_url: &str) -> Result<Self, TradeError> {
        if database_url.is_empty() {
            return Err(TradeError::ConfigError(
                "DATABASE_URL is required for order persistence".into(),
            ));
        }

        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(database_url)
            .await
            .map_err(|e| TradeError::ConfigError(format!("postgres connect: {e}")))?;

        let storage = Self { pool };
        storage.run_migrations().await?;
        Ok(storage)
    }

    /// Create a disconnected fallback when DATABASE_URL is not set.
    /// Orders are held in-process only (lost on restart).
    pub fn in_memory() -> Self {
        // Pool with no actual connection — all queries will fail.
        // Callers should check is_connected() before using.
        Self {
            pool: PgPool::connect_lazy("postgres://invalid").unwrap(),
        }
    }

    pub fn is_connected(&self) -> bool {
        !self.pool.is_closed()
    }

    async fn run_migrations(&self) -> Result<(), TradeError> {
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS trade_monitored_orders (
                id TEXT PRIMARY KEY,
                order_type TEXT NOT NULL,
                maker TEXT NOT NULL,
                wallet_id TEXT NOT NULL,
                input_mint TEXT NOT NULL,
                output_mint TEXT NOT NULL,
                in_amount TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'monitoring',
                config_json TEXT NOT NULL DEFAULT '{}',
                current_trigger TEXT,
                peak_price TEXT,
                created_at TEXT NOT NULL,
                executed_at TEXT,
                tx_signature TEXT,
                fill_price TEXT,
                linked_order_id TEXT
            )"
        ).execute(&self.pool).await
        .map_err(|e| TradeError::ConfigError(format!("migration: {e}")))?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS trade_execution_records (
                id SERIAL PRIMARY KEY,
                order_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                tx_signature TEXT NOT NULL,
                fill_price TEXT NOT NULL,
                slippage_bps INTEGER,
                status TEXT NOT NULL
            )"
        ).execute(&self.pool).await
        .map_err(|e| TradeError::ConfigError(format!("migration: {e}")))?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_trade_orders_status ON trade_monitored_orders(status)")
            .execute(&self.pool).await.ok();
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_trade_orders_maker ON trade_monitored_orders(maker)")
            .execute(&self.pool).await.ok();
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_trade_exec_order ON trade_execution_records(order_id)")
            .execute(&self.pool).await.ok();

        Ok(())
    }

    pub async fn save_order(&self, order: &MonitoredOrder) -> Result<(), TradeError> {
        sqlx::query(
            "INSERT INTO trade_monitored_orders
             (id, order_type, maker, wallet_id, input_mint, output_mint, in_amount, status,
              config_json, current_trigger, peak_price, created_at, executed_at, tx_signature,
              fill_price, linked_order_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
             ON CONFLICT (id) DO UPDATE SET
              status = EXCLUDED.status, current_trigger = EXCLUDED.current_trigger,
              peak_price = EXCLUDED.peak_price, executed_at = EXCLUDED.executed_at,
              tx_signature = EXCLUDED.tx_signature, fill_price = EXCLUDED.fill_price"
        )
        .bind(&order.id).bind(&order.order_type).bind(&order.maker).bind(&order.wallet_id)
        .bind(&order.input_mint).bind(&order.output_mint).bind(&order.in_amount)
        .bind(&order.status).bind(&order.config_json).bind(&order.current_trigger)
        .bind(&order.peak_price).bind(&order.created_at).bind(&order.executed_at)
        .bind(&order.tx_signature).bind(&order.fill_price).bind(&order.linked_order_id)
        .execute(&self.pool).await
        .map_err(|e| TradeError::RpcError(format!("save order: {e}")))?;
        Ok(())
    }

    pub async fn get_active_orders(&self) -> Result<Vec<MonitoredOrder>, TradeError> {
        sqlx::query_as::<_, MonitoredOrder>(
            "SELECT id, order_type, maker, wallet_id, input_mint, output_mint, in_amount,
                    status, config_json, current_trigger, peak_price, created_at,
                    executed_at, tx_signature, fill_price, linked_order_id
             FROM trade_monitored_orders WHERE status = 'monitoring'"
        ).fetch_all(&self.pool).await
        .map_err(|e| TradeError::RpcError(format!("query active: {e}")))
    }

    pub async fn get_orders_by_wallet(&self, wallet: &str) -> Result<Vec<MonitoredOrder>, TradeError> {
        sqlx::query_as::<_, MonitoredOrder>(
            "SELECT id, order_type, maker, wallet_id, input_mint, output_mint, in_amount,
                    status, config_json, current_trigger, peak_price, created_at,
                    executed_at, tx_signature, fill_price, linked_order_id
             FROM trade_monitored_orders WHERE maker = $1 ORDER BY created_at DESC"
        ).bind(wallet).fetch_all(&self.pool).await
        .map_err(|e| TradeError::RpcError(format!("query wallet: {e}")))
    }

    pub async fn get_executions(&self, order_id: &str) -> Result<Vec<ExecutionRecord>, TradeError> {
        sqlx::query_as::<_, ExecutionRecord>(
            "SELECT order_id, timestamp, tx_signature, fill_price, slippage_bps, status
             FROM trade_execution_records WHERE order_id = $1 ORDER BY timestamp DESC"
        ).bind(order_id).fetch_all(&self.pool).await
        .map_err(|e| TradeError::RpcError(format!("query executions: {e}")))
    }

    pub async fn save_execution(&self, record: &ExecutionRecord) -> Result<(), TradeError> {
        sqlx::query(
            "INSERT INTO trade_execution_records
             (order_id, timestamp, tx_signature, fill_price, slippage_bps, status)
             VALUES ($1, $2, $3, $4, $5, $6)"
        )
        .bind(&record.order_id).bind(&record.timestamp).bind(&record.tx_signature)
        .bind(&record.fill_price).bind(record.slippage_bps).bind(&record.status)
        .execute(&self.pool).await
        .map_err(|e| TradeError::RpcError(format!("save execution: {e}")))?;
        Ok(())
    }

    pub async fn active_count(&self) -> usize {
        self.get_active_orders().await.map(|o| o.len()).unwrap_or(0)
    }
}
