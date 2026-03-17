use std::sync::Arc;

use reqwest::Client;
use tokio::sync::RwLock;
use tracing::info;

use crate::config::TradeConfig;
use crate::embedded_wallet::EmbeddedWalletClient;
use crate::error::TradeError;
use crate::indexer::IndexerService;
use crate::metaplex::MetaplexService;
use crate::rate_limit::KeyRateLookup;
use crate::monitor::PriceMonitor;
use crate::orderbook::OrderbookService;
use crate::orders::dca::DcaOrderService;
use crate::orders::limit::LimitOrderService;
use crate::storage::Storage;
use crate::orders::types::*;
use crate::portfolio::PortfolioService;
use crate::prices::PriceService;
use crate::stats::SwapStats;
use crate::swap::dflow::DflowProvider;
use crate::swap::jupiter::JupiterProvider;
use crate::swap::jupiter_ultra::JupiterUltraProvider;
use crate::swap::SwapProvider;
use crate::token_registry::TokenRegistry;
use crate::transfers::TransferService;
use crate::types::{
    ProviderHealth, ProviderInfo, QuoteParams, SwapQuote, SwapTransaction, TokenRecord,
};

pub(crate) struct ProviderEntry {
    pub provider: Box<dyn SwapProvider>,
    pub enabled: bool,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiKey {
    pub id: String,
    pub name: String,
    pub key_hash: String,
    pub created_at: String,
    pub rate_limit: Option<u32>,
    pub allowed_origins: Vec<String>,
}

#[derive(Clone)]
pub struct TradeService {
    inner: Arc<TradeServiceInner>,
}

struct TradeServiceInner {
    config: TradeConfig,
    overrides: RwLock<ConfigOverrides>,
    providers: RwLock<Vec<ProviderEntry>>,
    token_registry: RwLock<TokenRegistry>,
    price_service: PriceService,
    transfer_service: TransferService,
    portfolio_service: PortfolioService,
    limit_order_service: LimitOrderService,
    dca_order_service: DcaOrderService,
    indexer_service: IndexerService,
    orderbook_service: OrderbookService,
    metaplex_service: MetaplexService,
    storage: Arc<Storage>,
    embedded_wallet: Arc<EmbeddedWalletClient>,
    monitor: Option<Arc<PriceMonitor>>,
    api_keys: RwLock<Vec<ApiKey>>,
    stats: Arc<SwapStats>,
}

/// Runtime-overridable config fields (applied on top of base config).
#[derive(Debug, Clone, Default)]
pub struct ConfigOverrides {
    pub default_slippage_bps: Option<u32>,
}

impl TradeService {
    /// Create a new TradeService from config.
    pub async fn new(config: TradeConfig) -> Result<Self, TradeError> {
        let http_client = Client::builder()
            .pool_max_idle_per_host(10)
            .build()
            .map_err(|e| {
                TradeError::ConfigError(format!("failed to create HTTP client: {e}"))
            })?;

        let slippage = config.swap.default_slippage_bps;
        let stats = Arc::new(SwapStats::new());
        let mut providers = Vec::new();
        let add = |p: Box<dyn SwapProvider>| ProviderEntry { provider: p, enabled: true };
        for name in &config.swap.enabled_providers {
            match name.as_str() {
                "jupiter" => {
                    info!(api_url = %config.swap.jupiter.api_url, "enabling jupiter");
                    providers.push(add(Box::new(JupiterProvider::new(
                        http_client.clone(), config.swap.jupiter.clone(), slippage, stats.clone(),
                    ))));
                }
                "ultra" => {
                    info!(api_url = %config.swap.ultra.api_url, "enabling ultra");
                    providers.push(add(Box::new(JupiterUltraProvider::new(
                        http_client.clone(), config.swap.ultra.clone(), slippage,
                    ))));
                }
                "dflow" => {
                    info!(api_url = %config.swap.dflow.api_url, "enabling dflow");
                    providers.push(add(Box::new(DflowProvider::new(
                        http_client.clone(), config.swap.dflow.clone(), slippage,
                    ))));
                }
                other => tracing::warn!(provider = other, "unknown provider, skipping"),
            }
        }

        let token_registry = TokenRegistry::embedded();
        let price_service =
            PriceService::new(http_client.clone(), &config.swap.jupiter, &config.coingecko);
        let transfer_service = TransferService::new(config.solana.rpc_url.clone());
        let portfolio_service =
            PortfolioService::new(http_client.clone(), config.solana.rpc_url.clone());
        let limit_order_service = LimitOrderService::new(http_client.clone());
        let dca_order_service = DcaOrderService::new(http_client.clone());
        let indexer_service = IndexerService::new(http_client.clone(), config.indexer.clone());
        let orderbook_service = OrderbookService::new(
            http_client.clone(), config.solana.rpc_url.clone(), config.manifest.clone(),
        );
        let metaplex_service = MetaplexService::new(
            http_client.clone(), config.solana.rpc_url.clone(),
        );
        let storage = if config.database.url.is_empty() {
            tracing::warn!("DATABASE_URL not set — monitored orders will not persist across restarts");
            Arc::new(Storage::in_memory())
        } else {
            let s = Arc::new(Storage::connect(&config.database.url).await?);
            crate::action_queue::init_action_tables(&s).await;
            s
        };
        let embedded_wallet = Arc::new(EmbeddedWalletClient::new(
            http_client.clone(), config.embedded_wallet.clone(),
        ));

        Ok(Self {
            inner: Arc::new(TradeServiceInner {
                config,
                overrides: RwLock::new(ConfigOverrides::default()),
                providers: RwLock::new(providers),
                token_registry: RwLock::new(token_registry),
                price_service,
                transfer_service,
                portfolio_service,
                limit_order_service,
                dca_order_service,
                indexer_service, orderbook_service, metaplex_service,
                storage: storage.clone(),
                embedded_wallet: embedded_wallet.clone(),
                monitor: None, // Initialized after service creation via start_monitor()
                api_keys: RwLock::new(Vec::new()),
                stats,
            }),
        })
    }

    pub fn config(&self) -> &TradeConfig { &self.inner.config }
    pub fn stats(&self) -> &SwapStats { &self.inner.stats }
    pub fn price_service(&self) -> &PriceService { &self.inner.price_service }
    pub fn transfer_service(&self) -> &TransferService { &self.inner.transfer_service }
    pub fn portfolio_service(&self) -> &PortfolioService { &self.inner.portfolio_service }

    pub async fn effective_slippage_bps(&self) -> u32 {
        self.inner.overrides.read().await.default_slippage_bps
            .unwrap_or(self.inner.config.swap.default_slippage_bps)
    }
    pub async fn apply_config_overrides(&self, patch: ConfigOverrides) {
        let mut ov = self.inner.overrides.write().await;
        if let Some(v) = patch.default_slippage_bps { ov.default_slippage_bps = Some(v); }
    }
    pub async fn config_overrides(&self) -> ConfigOverrides {
        self.inner.overrides.read().await.clone()
    }
    pub async fn token_registry_snapshot(&self) -> Vec<TokenRecord> {
        self.inner.token_registry.read().await.all().to_vec()
    }
    pub async fn token_by_mint(&self, mint: &str) -> Option<TokenRecord> {
        self.inner.token_registry.read().await.by_mint(mint).cloned()
    }
    pub async fn token_coingecko_id(&self, mint: &str) -> Option<String> {
        self.inner.token_registry.read().await.by_mint(mint).and_then(|t| t.coingecko_id.clone())
    }
    pub async fn list_tokens(&self, category: Option<&str>) -> Result<(Vec<TokenRecord>, usize), TradeError> {
        let reg = self.inner.token_registry.read().await;
        crate::token_registry::TokenListResponse::from_registry(&reg, category)
            .map(|r| (r.tokens, r.count))
    }

    pub async fn add_token(&self, token: TokenRecord) -> Result<(), TradeError> {
        let mut reg = self.inner.token_registry.write().await;
        if reg.by_mint(&token.mint).is_some() {
            return Err(TradeError::BadRequest(format!(
                "token already exists: {}",
                token.mint
            )));
        }
        reg.add(token);
        Ok(())
    }

    pub async fn update_token(
        &self,
        mint: &str,
        patch: crate::admin::TokenPatch,
    ) -> Result<TokenRecord, TradeError> {
        let mut reg = self.inner.token_registry.write().await;
        reg.update(mint, patch)
    }

    pub async fn remove_token(&self, mint: &str) -> Result<(), TradeError> {
        let mut reg = self.inner.token_registry.write().await;
        reg.remove(mint)
    }

    pub async fn enable_provider(&self, id: &str) -> Result<(), TradeError> {
        let mut providers = self.inner.providers.write().await;
        let entry = providers
            .iter_mut()
            .find(|e| e.provider.name() == id)
            .ok_or_else(|| TradeError::BadRequest(format!("provider not found: {id}")))?;
        entry.enabled = true;
        info!(provider = id, "provider enabled");
        Ok(())
    }

    pub async fn disable_provider(&self, id: &str) -> Result<(), TradeError> {
        let mut providers = self.inner.providers.write().await;
        let entry = providers
            .iter_mut()
            .find(|e| e.provider.name() == id)
            .ok_or_else(|| TradeError::BadRequest(format!("provider not found: {id}")))?;
        entry.enabled = false;
        info!(provider = id, "provider disabled");
        Ok(())
    }

    pub async fn list_api_keys(&self) -> Vec<ApiKey> {
        self.inner.api_keys.read().await.clone()
    }

    pub async fn create_api_key(
        &self,
        name: String,
        rate_limit: Option<u32>,
        allowed_origins: Vec<String>,
    ) -> ApiKey {
        let id = format!("key_{}", generate_id());
        let raw_key = generate_id();
        let key = ApiKey {
            id: id.clone(),
            name,
            key_hash: format!("ctk_{raw_key}"),
            created_at: chrono::Utc::now().to_rfc3339(),
            rate_limit,
            allowed_origins,
        };
        self.inner.api_keys.write().await.push(key.clone());
        info!(key_id = %id, "API key created");
        key
    }

    pub async fn revoke_api_key(&self, id: &str) -> Result<(), TradeError> {
        let mut keys = self.inner.api_keys.write().await;
        let before = keys.len();
        keys.retain(|k| k.id != id);
        if keys.len() == before {
            return Err(TradeError::BadRequest(format!("API key not found: {id}")));
        }
        info!(key_id = %id, "API key revoked");
        Ok(())
    }

    pub async fn get_quote(&self, params: &QuoteParams) -> Result<SwapQuote, TradeError> {
        let providers = self.inner.providers.read().await;
        let enabled: Vec<_> = providers.iter().filter(|e| e.enabled).collect();

        if enabled.is_empty() {
            return Err(TradeError::NoProvidersAvailable);
        }

        // Specific provider requested
        if let Some(ref name) = params.provider {
            let entry = enabled
                .iter()
                .find(|e| e.provider.name() == name)
                .ok_or_else(|| TradeError::BadRequest(format!("provider not found: {name}")))?;
            let quote = entry.provider.quote(params).await?;
            self.inner.stats.record_quote(&quote.provider);
            return Ok(quote);
        }

        // Query all enabled providers concurrently, timing each
        let stats = self.inner.stats.clone();
        let futs: Vec<_> = enabled.iter().map(|e| {
            let name = e.provider.name().to_string();
            let stats = stats.clone();
            let fut = e.provider.quote(params);
            async move {
                let start = std::time::Instant::now();
                let result = fut.await;
                let ms = start.elapsed().as_millis() as u64;
                stats.record_latency(&name, ms, result.is_ok());
                result
            }
        }).collect();
        let results = futures::future::join_all(futs).await;
        drop(providers);

        let mut best: Option<SwapQuote> = None;
        let mut last_error: Option<TradeError> = None;

        for result in results {
            match result {
                Ok(quote) => {
                    self.inner.stats.record_quote(&quote.provider);
                    let out: u64 = quote.out_amount.parse().unwrap_or(0);
                    let current_best = best
                        .as_ref()
                        .and_then(|q| q.out_amount.parse::<u64>().ok())
                        .unwrap_or(0);
                    if out > current_best {
                        best = Some(quote);
                    }
                }
                Err(e) => {
                    if matches!(
                        e,
                        TradeError::InvalidMint(_)
                            | TradeError::InvalidAmount(_)
                            | TradeError::BadRequest(_)
                    ) {
                        return Err(e);
                    }
                    tracing::warn!(error = %e, "provider quote failed");
                    last_error = Some(e);
                }
            }
        }

        best.ok_or(last_error.unwrap_or(TradeError::NoProvidersAvailable))
    }

    pub async fn build_swap(
        &self,
        quote: &SwapQuote,
        user_public_key: &str,
    ) -> Result<SwapTransaction, TradeError> {
        let providers = self.inner.providers.read().await;
        let entry = providers
            .iter()
            .find(|e| e.provider.name() == quote.provider && e.enabled)
            .ok_or_else(|| {
                TradeError::BadRequest(format!("provider not found: {}", quote.provider))
            })?;

        let tx = entry.provider.build(quote, user_public_key).await?;
        Ok(tx)
    }

    // execute_transaction, execute_ultra, execute_rpc are in execute.rs
    // get_positions is in positions.rs

    pub fn limit_order_service(&self) -> &LimitOrderService {
        &self.inner.limit_order_service
    }

    pub fn dca_order_service(&self) -> &DcaOrderService {
        &self.inner.dca_order_service
    }

    pub fn indexer_service(&self) -> &IndexerService { &self.inner.indexer_service }
    pub fn orderbook_service(&self) -> &OrderbookService { &self.inner.orderbook_service }
    pub fn metaplex_service(&self) -> &MetaplexService { &self.inner.metaplex_service }

    /// Look up a token by mint — checks registry first, falls back to Metaplex on-chain metadata.
    pub async fn token_by_mint_with_fallback(&self, mint: &str) -> Option<TokenRecord> {
        // Check curated registry first
        if let Some(t) = self.token_by_mint(mint).await { return Some(t); }
        // Fall back to Metaplex on-chain metadata
        if let Ok(Some(meta)) = self.inner.metaplex_service.get_metadata(mint).await {
            return Some(TokenRecord {
                mint: meta.mint, symbol: meta.symbol, name: meta.name,
                decimals: 0, // Unknown from Metaplex — caller should fetch separately
                logo_url: if meta.uri.is_empty() { None } else { Some(meta.uri) },
                coingecko_id: None, tradingview_symbol: None, categories: vec![],
            });
        }
        None
    }

    pub fn storage(&self) -> &Storage {
        &self.inner.storage
    }

    pub fn embedded_wallet(&self) -> &EmbeddedWalletClient { &self.inner.embedded_wallet }
    pub fn embedded_wallet_enabled(&self) -> bool { self.inner.embedded_wallet.is_enabled() }

    pub fn require_embedded_wallet(&self) -> Result<(), TradeError> {
        if !self.embedded_wallet_enabled() {
            return Err(TradeError::BadRequest(
                "this order type requires an embedded wallet (walletId + configured signing)".into(),
            ));
        }
        Ok(())
    }

    pub fn monitor(&self) -> Option<&Arc<PriceMonitor>> { self.inner.monitor.as_ref() }

    pub fn start_monitor(&self) {
        if !self.embedded_wallet_enabled() { return; }
        let monitor = Arc::new(PriceMonitor::new(
            self.inner.storage.clone(),
            Arc::new(crate::prices::PriceService::new(
                reqwest::Client::new(), &self.inner.config.swap.jupiter, &self.inner.config.coingecko,
            )),
            self.inner.embedded_wallet.clone(),
            self.inner.config.solana.rpc_url.clone(),
        ));
        monitor.clone().spawn();
        info!("price monitor started");
    }

    pub async fn get_open_orders(&self, wallet: &str) -> Result<OrdersResponse, TradeError> {
        let (limits, dcas) = tokio::join!(
            self.inner.limit_order_service.get_open_orders(wallet),
            self.inner.dca_order_service.get_dca_orders(wallet),
        );
        Ok(OrdersResponse {
            limit_orders: limits.unwrap_or_default(),
            dca_orders: dcas.unwrap_or_default(),
        })
    }

    pub async fn compare_quotes(
        &self,
        params: &QuoteParams,
    ) -> Result<Vec<SwapQuote>, TradeError> {
        let providers = self.inner.providers.read().await;
        let enabled: Vec<_> = providers.iter().filter(|e| e.enabled).collect();

        if enabled.is_empty() {
            return Err(TradeError::NoProvidersAvailable);
        }

        let futs: Vec<_> = enabled.iter().map(|e| e.provider.quote(params)).collect();
        let results = futures::future::join_all(futs).await;
        drop(providers);
        let mut quotes = Vec::new();

        for result in results {
            match result {
                Ok(quote) => {
                    self.inner.stats.record_quote(&quote.provider);
                    quotes.push(quote);
                }
                Err(e) => {
                    if matches!(
                        e,
                        TradeError::InvalidMint(_)
                            | TradeError::InvalidAmount(_)
                            | TradeError::BadRequest(_)
                    ) {
                        return Err(e);
                    }
                    tracing::warn!(error = %e, "provider quote failed during compare");
                }
            }
        }

        Ok(quotes)
    }

    pub async fn provider_health(&self) -> Vec<ProviderHealth> {
        let providers = self.inner.providers.read().await;
        let futs: Vec<_> = providers.iter().map(|e| e.provider.health()).collect();
        let results = futures::future::join_all(futs).await;
        drop(providers);
        results
    }

    pub async fn list_providers(&self) -> Vec<ProviderInfo> {
        let providers = self.inner.providers.read().await;
        let futs: Vec<_> = providers.iter().map(|e| {
            let (enabled, caps, name) = (e.enabled, e.provider.capabilities(), e.provider.name().to_string());
            let h = e.provider.health();
            async move { ProviderInfo { name, enabled, capabilities: caps, health: h.await } }
        }).collect();
        let r = futures::future::join_all(futs).await;
        drop(providers);
        r
    }
}

#[async_trait::async_trait]
impl KeyRateLookup for TradeService {
    async fn get_rate(&self, api_key: &str) -> Option<u32> {
        let keys = self.inner.api_keys.read().await;
        keys.iter()
            .find(|k| k.key_hash == api_key)
            .and_then(|k| k.rate_limit)
    }
}

fn generate_id() -> String {
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_nanos();
    format!("{ts:x}")
}
