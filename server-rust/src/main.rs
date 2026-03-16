use std::path::PathBuf;

use clap::Parser;
use tokio::net::TcpListener;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::info;

use cedros_trade::{AdminAuthMode, TradeConfig, TradeRouter, TradeService};

#[derive(Parser)]
#[command(name = "cedros-trade", version, about = "Cedros Trade — Solana trading infrastructure")]
struct Cli {
    /// Path to TOML config file.
    #[arg(short, long)]
    config: Option<PathBuf>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "cedros_trade=info,tower_http=info".into()),
        )
        .init();

    let cli = Cli::parse();

    let config = match cli.config {
        Some(path) => {
            info!(path = %path.display(), "loading config from file");
            TradeConfig::load(&path)?
        }
        None => {
            info!("no config file specified, using env vars + defaults");
            TradeConfig::from_env()
        }
    };

    let bind_addr = format!("{}:{}", config.server.host, config.server.port);

    let service = TradeService::new(config).await?;

    // Start background price monitor for embedded wallet orders
    service.start_monitor();

    // Enable admin API if ADMIN_BEARER_TOKEN is set
    let mut router = TradeRouter::new(service);
    if let Ok(token) = std::env::var("ADMIN_BEARER_TOKEN") {
        info!("admin API enabled with bearer token auth");
        router = router.with_admin(AdminAuthMode::BearerToken(token));
    } else {
        info!("admin API disabled (set ADMIN_BEARER_TOKEN to enable)");
    }

    let app = router
        .into_router()
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any));

    let listener = TcpListener::bind(&bind_addr).await?;
    info!(addr = %bind_addr, "cedros-trade server starting");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    info!("server shut down");
    Ok(())
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("failed to install CTRL+C handler");
    info!("shutdown signal received");
}
