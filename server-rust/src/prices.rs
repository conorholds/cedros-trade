use std::sync::Arc;
use std::time::{Duration, Instant};

use dashmap::DashMap;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::warn;

use crate::config::{CoinGeckoConfig, JupiterConfig};
use crate::error::TradeError;

/// Aggregated price snapshot from multiple sources.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PriceSnapshot {
    pub mint: String,
    pub price_usd: f64,
    pub sources: Vec<PriceSource>,
    pub degraded: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub market_cap: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub volume_24h: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub price_change_24h_pct: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceSource {
    pub name: String,
    pub price_usd: f64,
    pub stale: bool,
}

/// Request body for batch price lookup.
#[derive(Debug, Deserialize)]
pub struct BatchPriceRequest {
    pub mints: Vec<String>,
}

/// Response for batch price lookup.
#[derive(Debug, Serialize)]
pub struct BatchPriceResponse {
    pub prices: Vec<PriceSnapshot>,
}

struct CachedPrice {
    snapshot: PriceSnapshot,
    expires_at: Instant,
}

/// Price aggregation service combining Jupiter and CoinGecko.
pub struct PriceService {
    client: Client,
    jupiter_price_url: String,
    coingecko_api_url: String,
    coingecko_api_key: String,
    cache_ttl: Duration,
    cache: Arc<DashMap<String, CachedPrice>>,
}

impl PriceService {
    pub fn new(
        client: Client,
        jupiter_config: &JupiterConfig,
        coingecko_config: &CoinGeckoConfig,
    ) -> Self {
        // Derive Jupiter Price API URL from the quote API URL
        let base = jupiter_config
            .api_url
            .trim_end_matches("/quote")
            .trim_end_matches("/v6")
            .trim_end_matches('/');
        let jupiter_price_url = format!("{}/price/v2", base.replace("quote-api", "api"));

        Self {
            client,
            jupiter_price_url,
            coingecko_api_url: coingecko_config.api_url.clone(),
            coingecko_api_key: coingecko_config.api_key.clone(),
            cache_ttl: Duration::from_secs(coingecko_config.price_cache_ttl_secs),
            cache: Arc::new(DashMap::new()),
        }
    }

    pub async fn get_price(
        &self,
        mint: &str,
        coingecko_id: Option<&str>,
    ) -> Result<PriceSnapshot, TradeError> {
        // Check cache
        if let Some(entry) = self.cache.get(mint) {
            if entry.expires_at > Instant::now() {
                return Ok(entry.snapshot.clone());
            }
        }

        // Fetch from both sources concurrently
        let jup_fut = self.fetch_jupiter_price(mint);
        let cg_fut = self.fetch_coingecko_price(coingecko_id);

        let (jup_result, cg_result) = tokio::join!(jup_fut, cg_fut);

        let mut sources = Vec::new();
        let mut degraded = false;
        let mut market_cap = None;
        let mut volume_24h = None;
        let mut price_change_24h_pct = None;

        let jup_price = match jup_result {
            Ok(price) => {
                sources.push(PriceSource {
                    name: "jupiter".into(),
                    price_usd: price,
                    stale: false,
                });
                Some(price)
            }
            Err(e) => {
                warn!(error = %e, "jupiter price fetch failed");
                degraded = true;
                None
            }
        };

        let cg_price = match cg_result {
            Ok(Some(data)) => {
                sources.push(PriceSource {
                    name: "coingecko".into(),
                    price_usd: data.price_usd,
                    stale: false,
                });
                market_cap = data.market_cap;
                volume_24h = data.volume_24h;
                price_change_24h_pct = data.price_change_24h_pct;
                Some(data.price_usd)
            }
            Ok(None) => None, // No CoinGecko ID provided
            Err(e) => {
                warn!(error = %e, "coingecko price fetch failed");
                degraded = true;
                None
            }
        };

        // Use Jupiter price as primary, CoinGecko as fallback
        let price_usd = jup_price.or(cg_price).ok_or_else(|| {
            TradeError::ProviderError {
                provider: "prices".into(),
                message: "no price data available from any source".into(),
                source: None,
            }
        })?;

        let snapshot = PriceSnapshot {
            mint: mint.to_string(),
            price_usd,
            sources,
            degraded,
            market_cap,
            volume_24h,
            price_change_24h_pct,
        };

        // Cache
        self.cache.insert(
            mint.to_string(),
            CachedPrice {
                snapshot: snapshot.clone(),
                expires_at: Instant::now() + self.cache_ttl,
            },
        );

        Ok(snapshot)
    }

    async fn fetch_jupiter_price(&self, mint: &str) -> Result<f64, TradeError> {
        let resp = self
            .client
            .get(&self.jupiter_price_url)
            .query(&[("ids", mint)])
            .timeout(Duration::from_secs(5))
            .send()
            .await
            .map_err(|e| TradeError::ProviderError {
                provider: "jupiter-price".into(),
                message: e.to_string(),
                source: Some(Box::new(e)),
            })?;

        if !resp.status().is_success() {
            return Err(TradeError::ProviderError {
                provider: "jupiter-price".into(),
                message: format!("HTTP {}", resp.status()),
                source: None,
            });
        }

        let body: JupiterPriceResponse = resp.json().await.map_err(|e| {
            TradeError::ProviderError {
                provider: "jupiter-price".into(),
                message: e.to_string(),
                source: Some(Box::new(e)),
            }
        })?;

        body.data
            .get(mint)
            .and_then(|p| p.price.parse::<f64>().ok())
            .ok_or_else(|| TradeError::ProviderError {
                provider: "jupiter-price".into(),
                message: format!("no price data for {mint}"),
                source: None,
            })
    }

    async fn fetch_coingecko_price(
        &self,
        coingecko_id: Option<&str>,
    ) -> Result<Option<CoinGeckoData>, TradeError> {
        let id = match coingecko_id {
            Some(id) if !id.is_empty() => id,
            _ => return Ok(None),
        };

        let url = format!("{}/coins/{}", self.coingecko_api_url, id);

        let mut req = self
            .client
            .get(&url)
            .query(&[
                ("localization", "false"),
                ("tickers", "false"),
                ("community_data", "false"),
                ("developer_data", "false"),
            ])
            .timeout(Duration::from_secs(10));

        if !self.coingecko_api_key.is_empty() {
            req = req.header("x-cg-pro-api-key", &self.coingecko_api_key);
        }

        let resp = req.send().await.map_err(|e| TradeError::CoinGeckoError(e.to_string()))?;

        if !resp.status().is_success() {
            return Err(TradeError::CoinGeckoError(format!(
                "HTTP {}",
                resp.status()
            )));
        }

        let body: CoinGeckoCoinResponse = resp
            .json()
            .await
            .map_err(|e| TradeError::CoinGeckoError(e.to_string()))?;

        let market = &body.market_data;
        Ok(Some(CoinGeckoData {
            price_usd: market.current_price.usd,
            market_cap: Some(market.market_cap.usd),
            volume_24h: Some(market.total_volume.usd),
            price_change_24h_pct: market.price_change_percentage_24h,
        }))
    }
}

struct CoinGeckoData {
    price_usd: f64,
    market_cap: Option<f64>,
    volume_24h: Option<f64>,
    price_change_24h_pct: Option<f64>,
}

// --- Jupiter Price API types ---

#[derive(Debug, Deserialize)]
struct JupiterPriceResponse {
    data: std::collections::HashMap<String, JupiterPriceEntry>,
}

#[derive(Debug, Deserialize)]
struct JupiterPriceEntry {
    price: String,
}

// --- CoinGecko API types ---

#[derive(Debug, Deserialize)]
struct CoinGeckoCoinResponse {
    market_data: CoinGeckoMarketData,
}

#[derive(Debug, Deserialize)]
struct CoinGeckoMarketData {
    current_price: CoinGeckoCurrency,
    market_cap: CoinGeckoCurrency,
    total_volume: CoinGeckoCurrency,
    #[serde(default)]
    price_change_percentage_24h: Option<f64>,
}

#[derive(Debug, Deserialize)]
struct CoinGeckoCurrency {
    #[serde(default)]
    usd: f64,
}
