//! Action queue for external (browser) wallets.
//!
//! When a trigger fires for an external wallet order, instead of auto-executing,
//! we create a "pending action" with the pre-built unsigned transaction.
//! The user sees a notification, clicks to sign, and completes the action.

use axum::extract::{Path, State};
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::Json;
use futures::stream::Stream;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio_stream::wrappers::IntervalStream;
use tokio_stream::StreamExt;

use crate::error::TradeError;
use crate::service::TradeService;
use crate::storage::Storage;

/// A pending action the user needs to sign.
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct PendingAction {
    pub id: String,
    pub wallet_address: String,
    pub order_id: String,
    pub action_type: String, // "trailing-stop-triggered", "oco-stop-loss-triggered", etc.
    pub transaction: String, // base64 unsigned tx
    pub reason: String,      // human-readable explanation
    pub status: String,      // "pending", "completed", "dismissed", "expired"
    pub created_at: String,
    pub expires_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tx_signature: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompleteActionRequest {
    pub signed_transaction: String,
}

/// Run migrations for the action queue table.
pub async fn init_action_tables(storage: &Storage) {
    let _ = sqlx::query(
        "CREATE TABLE IF NOT EXISTS trade_pending_actions (
            id TEXT PRIMARY KEY,
            wallet_address TEXT NOT NULL,
            order_id TEXT NOT NULL,
            action_type TEXT NOT NULL,
            transaction TEXT NOT NULL,
            reason TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            tx_signature TEXT
        )"
    ).execute(storage.pool()).await;

    let _ = sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_actions_wallet_status
         ON trade_pending_actions(wallet_address, status)"
    ).execute(storage.pool()).await;
}

/// Create a pending action for a browser wallet user.
pub async fn create_action(
    storage: &Storage,
    wallet: &str,
    order_id: &str,
    action_type: &str,
    transaction: &str,
    reason: &str,
) -> Result<PendingAction, TradeError> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now();
    let expires = now + chrono::Duration::minutes(10);

    let action = PendingAction {
        id: id.clone(), wallet_address: wallet.into(), order_id: order_id.into(),
        action_type: action_type.into(), transaction: transaction.into(),
        reason: reason.into(), status: "pending".into(),
        created_at: now.to_rfc3339(), expires_at: expires.to_rfc3339(),
        tx_signature: None,
    };

    sqlx::query(
        "INSERT INTO trade_pending_actions
         (id, wallet_address, order_id, action_type, transaction, reason, status, created_at, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)"
    )
    .bind(&action.id).bind(&action.wallet_address).bind(&action.order_id)
    .bind(&action.action_type).bind(&action.transaction).bind(&action.reason)
    .bind(&action.status).bind(&action.created_at).bind(&action.expires_at)
    .execute(storage.pool()).await
    .map_err(|e| TradeError::RpcError(format!("save action: {e}")))?;

    Ok(action)
}

// --- Handlers ---

/// List pending actions for a wallet.
pub async fn list_actions(
    State(svc): State<TradeService>,
    Path(wallet): Path<String>,
) -> Result<Json<Vec<PendingAction>>, TradeError> {
    let actions = sqlx::query_as::<_, PendingAction>(
        "SELECT id, wallet_address, order_id, action_type, transaction, reason,
                status, created_at, expires_at, tx_signature
         FROM trade_pending_actions
         WHERE wallet_address = $1 AND status = 'pending'
         ORDER BY created_at DESC"
    ).bind(&wallet).fetch_all(svc.storage().pool()).await
    .map_err(|e| TradeError::RpcError(format!("query actions: {e}")))?;

    Ok(Json(actions))
}

/// Complete a pending action by submitting the signed transaction.
pub async fn complete_action(
    State(svc): State<TradeService>,
    Path(action_id): Path<String>,
    Json(req): Json<CompleteActionRequest>,
) -> Result<Json<serde_json::Value>, TradeError> {
    // Submit the signed transaction via RPC
    let exec_req = crate::types::ExecuteRequest {
        signed_transaction: req.signed_transaction,
        provider: "rpc".into(),
        request_id: None,
    };
    let result = svc.execute_transaction(&exec_req).await?;

    sqlx::query(
        "UPDATE trade_pending_actions SET status = 'completed', tx_signature = $1 WHERE id = $2"
    ).bind(&result.signature).bind(&action_id)
    .execute(svc.storage().pool()).await
    .map_err(|e| TradeError::RpcError(format!("update action: {e}")))?;

    Ok(Json(serde_json::json!({
        "actionId": action_id,
        "status": "completed",
        "signature": result.signature,
    })))
}

/// Dismiss a pending action.
pub async fn dismiss_action(
    State(svc): State<TradeService>,
    Path(action_id): Path<String>,
) -> Result<Json<serde_json::Value>, TradeError> {
    sqlx::query("UPDATE trade_pending_actions SET status = 'dismissed' WHERE id = $1")
        .bind(&action_id).execute(svc.storage().pool()).await
        .map_err(|e| TradeError::RpcError(format!("dismiss: {e}")))?;

    Ok(Json(serde_json::json!({ "actionId": action_id, "status": "dismissed" })))
}

/// SSE stream of pending actions — frontend subscribes for real-time notifications.
pub async fn action_stream(
    State(svc): State<TradeService>,
    Path(wallet): Path<String>,
) -> Sse<impl Stream<Item = Result<Event, std::convert::Infallible>>> {
    let interval = IntervalStream::new(tokio::time::interval(Duration::from_secs(3)));

    let stream = interval.map(move |_| {
        let wallet = wallet.clone();
        let svc = svc.clone();
        async move {
            let actions = sqlx::query_as::<_, PendingAction>(
                "SELECT id, wallet_address, order_id, action_type, transaction, reason,
                        status, created_at, expires_at, tx_signature
                 FROM trade_pending_actions
                 WHERE wallet_address = $1 AND status = 'pending'
                 ORDER BY created_at DESC"
            ).bind(&wallet).fetch_all(svc.storage().pool()).await
            .unwrap_or_default();

            let data = serde_json::json!({
                "count": actions.len(),
                "actions": actions,
            });
            Ok(Event::default().data(data.to_string()))
        }
    });

    // Flatten the async stream
    let stream = stream.then(|fut| fut);

    Sse::new(stream).keep_alive(KeepAlive::default())
}
