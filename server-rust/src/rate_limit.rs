//! Per-key and global rate limiting middleware.
//!
//! Reads the API key from `x-api-key` header, looks up the per-key rate limit,
//! and enforces it using a token bucket. Unauthenticated requests share a global bucket.

use std::sync::Arc;
use std::time::Instant;

use axum::extract::Request;
use axum::http::StatusCode;
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use dashmap::DashMap;

/// A simple token bucket rate limiter.
struct Bucket {
    tokens: f64,
    max_tokens: f64,
    refill_rate: f64, // tokens per second
    last_refill: Instant,
}

impl Bucket {
    fn new(max_per_sec: u32) -> Self {
        let max = max_per_sec as f64;
        Self { tokens: max, max_tokens: max, refill_rate: max, last_refill: Instant::now() }
    }

    fn try_consume(&mut self) -> bool {
        let now = Instant::now();
        let elapsed = now.duration_since(self.last_refill).as_secs_f64();
        self.tokens = (self.tokens + elapsed * self.refill_rate).min(self.max_tokens);
        self.last_refill = now;

        if self.tokens >= 1.0 {
            self.tokens -= 1.0;
            true
        } else {
            false
        }
    }
}

/// Shared rate limiter state. Keyed by API key or "global" for unauthenticated requests.
pub struct RateLimiter {
    buckets: DashMap<String, Bucket>,
    default_rate: u32,
}

impl RateLimiter {
    pub fn new(default_rate_per_sec: u32) -> Self {
        Self { buckets: DashMap::new(), default_rate: default_rate_per_sec }
    }

    fn check(&self, key: &str, rate: u32) -> bool {
        let mut entry = self.buckets.entry(key.to_string())
            .or_insert_with(|| Bucket::new(rate));
        entry.try_consume()
    }
}

/// Axum middleware that enforces rate limits.
/// Looks up API keys against the TradeService's key store to get per-key limits.
pub async fn rate_limit_middleware(
    request: Request,
    next: Next,
    limiter: Arc<RateLimiter>,
    key_lookup: Arc<dyn KeyRateLookup>,
) -> Response {
    let api_key = request.headers()
        .get("x-api-key")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string());

    let (bucket_key, rate) = match &api_key {
        Some(key) => {
            let rate = key_lookup.get_rate(key).await.unwrap_or(limiter.default_rate);
            (format!("key:{key}"), rate)
        }
        None => ("global".into(), limiter.default_rate),
    };

    if !limiter.check(&bucket_key, rate) {
        return (
            StatusCode::TOO_MANY_REQUESTS,
            [("retry-after", "1")],
            "rate limit exceeded",
        ).into_response();
    }

    next.run(request).await
}

/// Trait for looking up per-key rate limits without coupling to TradeService directly.
#[async_trait::async_trait]
pub trait KeyRateLookup: Send + Sync {
    async fn get_rate(&self, api_key: &str) -> Option<u32>;
}
