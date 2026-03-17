//! Example: embedding cedros-trade into an existing Axum application.

use axum::routing::get;
use axum::Router;
use tokio::net::TcpListener;

use cedros_trade::{TradeConfig, TradeRouter, TradeService};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    let config = TradeConfig::builder()
        .solana_rpc_url("https://api.mainnet-beta.solana.com")
        .enable_jupiter("https://quote-api.jup.ag/v6")
        .server_port(3000)
        .build();

    let service = TradeService::new(config).await?;
    let trade_router = TradeRouter::new(service);

    // Your existing application routes
    let app = Router::new()
        .route("/", get(|| async { "Hello from the host app!" }))
        // Mount trade routes under /api/trade
        .nest("/api/trade", trade_router.into_router());

    let listener = TcpListener::bind("0.0.0.0:3000").await?;
    println!("Embedded server running on http://localhost:3000");
    println!("Trade API at http://localhost:3000/api/trade/health");

    axum::serve(listener, app).await?;
    Ok(())
}
