//! WebSocket price streaming — clients subscribe to mint addresses and receive
//! real-time PriceSnapshot updates from the existing price cache.

use std::collections::HashSet;
use std::time::Duration;

use axum::extract::ws::{Message, WebSocket};
use axum::extract::{State, WebSocketUpgrade};
use axum::response::Response;
use serde::{Deserialize, Serialize};
use tokio::time;
use tracing::{debug, warn};

use crate::service::TradeService;

/// Client → server messages.
#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
enum ClientMsg {
    Subscribe { mints: Vec<String> },
    Unsubscribe { mints: Vec<String> },
}

/// Server → client messages.
#[derive(Debug, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
enum ServerMsg {
    Price {
        mint: String,
        price_usd: f64,
        #[serde(skip_serializing_if = "Option::is_none")]
        market_cap: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        volume_24h: Option<f64>,
        degraded: bool,
    },
    Error { message: String },
    Subscribed { mints: Vec<String> },
}

/// Axum handler for `GET /ws/prices`.
pub async fn ws_prices_handler(
    ws: WebSocketUpgrade,
    State(service): State<TradeService>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, service))
}

async fn handle_socket(mut socket: WebSocket, service: TradeService) {
    let mut subscriptions: HashSet<String> = HashSet::new();
    let mut push_interval = time::interval(Duration::from_secs(5));

    loop {
        tokio::select! {
            // Receive client messages (subscribe/unsubscribe)
            msg = socket.recv() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        match serde_json::from_str::<ClientMsg>(&text) {
                            Ok(ClientMsg::Subscribe { mints }) => {
                                subscriptions.extend(mints.iter().cloned());
                                let ack = ServerMsg::Subscribed {
                                    mints: subscriptions.iter().cloned().collect(),
                                };
                                if send_json(&mut socket, &ack).await.is_err() { return; }
                                debug!(count = subscriptions.len(), "ws subscriptions updated");
                            }
                            Ok(ClientMsg::Unsubscribe { mints }) => {
                                for m in &mints { subscriptions.remove(m); }
                                let ack = ServerMsg::Subscribed {
                                    mints: subscriptions.iter().cloned().collect(),
                                };
                                if send_json(&mut socket, &ack).await.is_err() { return; }
                            }
                            Err(e) => {
                                let _ = send_json(&mut socket, &ServerMsg::Error {
                                    message: format!("invalid message: {e}"),
                                }).await;
                            }
                        }
                    }
                    Some(Ok(Message::Close(_))) | None => return,
                    _ => {} // Ping/Pong handled by axum
                }
            }

            // Push price updates on interval
            _ = push_interval.tick() => {
                if subscriptions.is_empty() { continue; }

                for mint in &subscriptions {
                    let cg_id = service.token_coingecko_id(mint).await;
                    match service.price_service()
                        .get_price(mint, cg_id.as_deref()).await
                    {
                        Ok(snap) => {
                            let msg = ServerMsg::Price {
                                mint: mint.clone(),
                                price_usd: snap.price_usd,
                                market_cap: snap.market_cap,
                                volume_24h: snap.volume_24h,
                                degraded: snap.degraded,
                            };
                            if send_json(&mut socket, &msg).await.is_err() { return; }
                        }
                        Err(e) => {
                            warn!(mint = %mint, error = %e, "ws price fetch failed");
                        }
                    }
                }
            }
        }
    }
}

async fn send_json(socket: &mut WebSocket, msg: &ServerMsg) -> Result<(), ()> {
    let text = serde_json::to_string(msg).map_err(|_| ())?;
    socket.send(Message::Text(text)).await.map_err(|_| ())
}
