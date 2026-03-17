use serde::{Deserialize, Serialize};
use std::path::Path;

use crate::error::TradeError;

/// Top-level configuration for the trade service.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(default)]
pub struct TradeConfig {
    pub server: ServerConfig,
    pub solana: SolanaConfig,
    pub swap: SwapConfig,
    pub coingecko: CoinGeckoConfig,
    pub tokens: TokensConfig,
    pub database: DatabaseConfig,
    pub indexer: IndexerConfig,
    pub embedded_wallet: EmbeddedWalletConfig,
    pub manifest: ManifestConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct ManifestConfig {
    pub enabled: bool,
    pub program_id: String,
    /// Curated market addresses: "BASE_MINT:QUOTE_MINT" → market pubkey
    pub markets: std::collections::HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub cors_origins: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct SolanaConfig {
    pub rpc_url: String,
    pub network: String,
    pub explorer_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct SwapConfig {
    pub default_slippage_bps: u32,
    pub enabled_providers: Vec<String>,
    pub jupiter: JupiterConfig,
    pub ultra: UltraConfig,
    pub dflow: DflowConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct JupiterConfig {
    pub api_url: String,
    pub quote_cache_ttl_secs: u64,
    pub max_requests_per_sec: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct UltraConfig {
    pub api_url: String,
    pub fee_bps: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct DflowConfig {
    pub api_url: String,
    pub api_key: String,
    pub fallback_to_jupiter: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct CoinGeckoConfig {
    pub api_url: String,
    pub price_cache_ttl_secs: u64,
    pub api_key: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct TokensConfig {
    pub source: String,
    pub file_path: String,
    pub url: String,
    pub refresh_interval_secs: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
#[derive(Default)]
pub struct DatabaseConfig {
    /// Postgres connection string. Same env var as cedros-login and cedros-pay.
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct IndexerConfig {
    pub enabled: bool,
    pub provider: String,
    pub api_key: String,
    pub api_url: String,
    pub cache_ttl_secs: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct EmbeddedWalletConfig {
    pub enabled: bool,
    pub cedros_login_url: String,
    pub service_token: String,
    pub signing_timeout_ms: u64,
}

// --- Defaults ---


impl Default for ServerConfig {
    fn default() -> Self {
        Self {
            host: "0.0.0.0".into(),
            port: 8080,
            cors_origins: vec!["*".into()],
        }
    }
}

impl Default for SolanaConfig {
    fn default() -> Self {
        Self {
            rpc_url: "https://api.mainnet-beta.solana.com".into(),
            network: "mainnet-beta".into(),
            explorer_url: "https://solscan.io/tx/".into(),
        }
    }
}

impl Default for SwapConfig {
    fn default() -> Self {
        Self {
            default_slippage_bps: 30,
            enabled_providers: vec!["jupiter".into()],
            jupiter: JupiterConfig::default(),
            ultra: UltraConfig::default(),
            dflow: DflowConfig::default(),
        }
    }
}

impl Default for JupiterConfig {
    fn default() -> Self {
        Self {
            api_url: "https://api.jup.ag/swap/v1".into(),
            quote_cache_ttl_secs: 5,
            max_requests_per_sec: 10,
        }
    }
}

impl Default for UltraConfig {
    fn default() -> Self {
        Self {
            api_url: "https://api.jup.ag/ultra/v1".into(),
            fee_bps: 0,
        }
    }
}

impl Default for DflowConfig {
    fn default() -> Self {
        Self {
            api_url: "https://quote-api.dflow.net".into(),
            api_key: String::new(),
            fallback_to_jupiter: true,
        }
    }
}

impl Default for CoinGeckoConfig {
    fn default() -> Self {
        Self {
            api_url: "https://api.coingecko.com/api/v3".into(),
            price_cache_ttl_secs: 30,
            api_key: String::new(),
        }
    }
}

impl Default for TokensConfig {
    fn default() -> Self {
        Self {
            source: "embedded".into(),
            file_path: String::new(),
            url: String::new(),
            refresh_interval_secs: 3600,
        }
    }
}

impl Default for EmbeddedWalletConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            cedros_login_url: String::new(),
            service_token: String::new(),
            signing_timeout_ms: 5000,
        }
    }
}


impl Default for ManifestConfig {
    fn default() -> Self {
        let mut markets = std::collections::HashMap::new();
        // Known Manifest markets for top pairs
        markets.insert(
            "So11111111111111111111111111111111111111112:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".into(),
            "".into(), // SOL/USDC market — set via config
        );
        Self {
            enabled: false,
            program_id: "MNFSTqtC93rEfYHB6hF82sKdZpUDFWkViLByLd1k1Ms".into(),
            markets,
        }
    }
}

impl Default for IndexerConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            provider: "helius".into(),
            api_key: String::new(),
            api_url: "https://api.helius.xyz".into(),
            cache_ttl_secs: 300,
        }
    }
}

// --- Loading ---

impl TradeConfig {
    /// Load config from a TOML file, then apply env var overrides.
    pub fn load(path: &Path) -> Result<Self, TradeError> {
        let content = std::fs::read_to_string(path).map_err(|e| {
            TradeError::ConfigError(format!("failed to read config file {}: {e}", path.display()))
        })?;
        let mut config: Self = toml::from_str(&content)
            .map_err(|e| TradeError::ConfigError(format!("invalid TOML: {e}")))?;
        config.apply_env_overrides();
        Ok(config)
    }

    /// Load config from env vars only, using defaults for unset values.
    pub fn from_env() -> Self {
        let mut config = Self::default();
        config.apply_env_overrides();
        config
    }

    fn apply_env_overrides(&mut self) {
        if let Ok(v) = std::env::var("SOLANA_RPC_URL") {
            self.solana.rpc_url = v;
        }
        if let Ok(v) = std::env::var("SOLANA_NETWORK") {
            self.solana.network = v;
        }
        if let Ok(v) = std::env::var("JUPITER_API_URL") {
            self.swap.jupiter.api_url = v;
        }
        if let Ok(v) = std::env::var("ULTRA_API_URL") {
            self.swap.ultra.api_url = v;
        }
        if let Ok(v) = std::env::var("DFLOW_API_URL") {
            self.swap.dflow.api_url = v;
        }
        if let Ok(v) = std::env::var("DFLOW_API_KEY") {
            self.swap.dflow.api_key = v;
        }
        if let Ok(v) = std::env::var("COINGECKO_API_KEY") {
            self.coingecko.api_key = v;
        }
        if let Ok(v) = std::env::var("COINGECKO_API_URL") {
            self.coingecko.api_url = v;
        }
        if let Ok(v) = std::env::var("SERVER_HOST") {
            self.server.host = v;
        }
        if let Ok(v) = std::env::var("SERVER_PORT") {
            if let Ok(port) = v.parse() {
                self.server.port = port;
            }
        }
        // DATABASE_URL — same env var as cedros-login and cedros-pay
        if let Ok(v) = std::env::var("DATABASE_URL") {
            self.database.url = v;
        }
        if let Ok(v) = std::env::var("INDEXER_API_KEY") {
            self.indexer.api_key = v;
            self.indexer.enabled = true;
        }
        if let Ok(v) = std::env::var("INDEXER_PROVIDER") {
            self.indexer.provider = v;
        }
        if let Ok(v) = std::env::var("INDEXER_API_URL") {
            self.indexer.api_url = v;
        }
        if let Ok(v) = std::env::var("EMBEDDED_WALLET_SERVICE_TOKEN") {
            self.embedded_wallet.service_token = v;
            self.embedded_wallet.enabled = true;
        }
        if let Ok(v) = std::env::var("CEDROS_LOGIN_URL") {
            self.embedded_wallet.cedros_login_url = v;
        }
    }

    /// Builder for constructing config programmatically (library usage).
    pub fn builder() -> TradeConfigBuilder {
        TradeConfigBuilder::default()
    }
}

// --- Builder (for library consumers) ---

#[derive(Default)]
pub struct TradeConfigBuilder {
    config: TradeConfig,
}

impl TradeConfigBuilder {
    pub fn solana_rpc_url(mut self, url: impl Into<String>) -> Self {
        self.config.solana.rpc_url = url.into();
        self
    }

    pub fn network(mut self, network: impl Into<String>) -> Self {
        self.config.solana.network = network.into();
        self
    }

    pub fn enable_jupiter(mut self, api_url: impl Into<String>) -> Self {
        self.config.swap.jupiter.api_url = api_url.into();
        if !self.config.swap.enabled_providers.contains(&"jupiter".to_string()) {
            self.config.swap.enabled_providers.push("jupiter".into());
        }
        self
    }

    pub fn enable_ultra(mut self, api_url: impl Into<String>) -> Self {
        self.config.swap.ultra.api_url = api_url.into();
        if !self.config.swap.enabled_providers.contains(&"ultra".to_string()) {
            self.config.swap.enabled_providers.push("ultra".into());
        }
        self
    }

    pub fn enable_dflow(mut self, api_url: impl Into<String>) -> Self {
        self.config.swap.dflow.api_url = api_url.into();
        if !self.config.swap.enabled_providers.contains(&"dflow".to_string()) {
            self.config.swap.enabled_providers.push("dflow".into());
        }
        self
    }

    pub fn default_slippage_bps(mut self, bps: u32) -> Self {
        self.config.swap.default_slippage_bps = bps;
        self
    }

    pub fn server_port(mut self, port: u16) -> Self {
        self.config.server.port = port;
        self
    }

    pub fn cors_origins(mut self, origins: Vec<String>) -> Self {
        self.config.server.cors_origins = origins;
        self
    }

    pub fn build(self) -> TradeConfig {
        self.config
    }
}

