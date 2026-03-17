use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Mutex;

use serde::Serialize;

const LATENCY_WINDOW: usize = 100;

/// Per-provider latency samples (rolling window for percentile calculation).
struct LatencyTracker {
    samples: Vec<u64>,
    success_count: u64,
    total_count: u64,
}

impl LatencyTracker {
    fn new() -> Self {
        Self { samples: Vec::with_capacity(LATENCY_WINDOW), success_count: 0, total_count: 0 }
    }

    fn record(&mut self, latency_ms: u64, success: bool) {
        self.total_count += 1;
        if success { self.success_count += 1; }
        if self.samples.len() >= LATENCY_WINDOW {
            self.samples.remove(0);
        }
        self.samples.push(latency_ms);
    }

    fn percentile(&self, pct: f64) -> Option<u64> {
        if self.samples.is_empty() { return None; }
        let mut sorted = self.samples.clone();
        sorted.sort_unstable();
        let idx = ((pct / 100.0) * (sorted.len() - 1) as f64).round() as usize;
        Some(sorted[idx.min(sorted.len() - 1)])
    }

    fn uptime_pct(&self) -> f64 {
        if self.total_count == 0 { return 100.0; }
        (self.success_count as f64 / self.total_count as f64) * 100.0
    }
}

/// Atomic swap statistics collected at runtime.
pub struct SwapStats {
    pub total_quotes: AtomicU64,
    pub total_swaps: AtomicU64,
    pub quote_cache_hits: AtomicU64,
    pub quote_cache_misses: AtomicU64,
    pub quotes_jupiter: AtomicU64,
    pub quotes_ultra: AtomicU64,
    pub quotes_dflow: AtomicU64,
    pub errors_jupiter: AtomicU64,
    pub errors_ultra: AtomicU64,
    pub errors_dflow: AtomicU64,
    // Quote latency (from requesting quote to receiving response)
    latency_jupiter: Mutex<LatencyTracker>,
    latency_ultra: Mutex<LatencyTracker>,
    latency_dflow: Mutex<LatencyTracker>,
    // Execution stats (actual tx submission results)
    pub executions_succeeded: AtomicU64,
    pub executions_failed: AtomicU64,
    exec_latency_jupiter: Mutex<LatencyTracker>,
    exec_latency_ultra: Mutex<LatencyTracker>,
    exec_latency_dflow: Mutex<LatencyTracker>,
}

impl Default for SwapStats {
    fn default() -> Self { Self::new() }
}

impl SwapStats {
    pub fn new() -> Self {
        Self {
            total_quotes: AtomicU64::new(0),
            total_swaps: AtomicU64::new(0),
            quote_cache_hits: AtomicU64::new(0),
            quote_cache_misses: AtomicU64::new(0),
            quotes_jupiter: AtomicU64::new(0),
            quotes_ultra: AtomicU64::new(0),
            quotes_dflow: AtomicU64::new(0),
            errors_jupiter: AtomicU64::new(0),
            errors_ultra: AtomicU64::new(0),
            errors_dflow: AtomicU64::new(0),
            latency_jupiter: Mutex::new(LatencyTracker::new()),
            latency_ultra: Mutex::new(LatencyTracker::new()),
            latency_dflow: Mutex::new(LatencyTracker::new()),
            executions_succeeded: AtomicU64::new(0),
            executions_failed: AtomicU64::new(0),
            exec_latency_jupiter: Mutex::new(LatencyTracker::new()),
            exec_latency_ultra: Mutex::new(LatencyTracker::new()),
            exec_latency_dflow: Mutex::new(LatencyTracker::new()),
        }
    }

    pub fn record_quote(&self, provider: &str) {
        self.total_quotes.fetch_add(1, Ordering::Relaxed);
        match provider {
            "jupiter" => self.quotes_jupiter.fetch_add(1, Ordering::Relaxed),
            "ultra" => self.quotes_ultra.fetch_add(1, Ordering::Relaxed),
            "dflow" => self.quotes_dflow.fetch_add(1, Ordering::Relaxed),
            _ => 0,
        };
    }

    pub fn record_swap(&self) {
        self.total_swaps.fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_error(&self, provider: &str) {
        match provider {
            "jupiter" => self.errors_jupiter.fetch_add(1, Ordering::Relaxed),
            "ultra" => self.errors_ultra.fetch_add(1, Ordering::Relaxed),
            "dflow" => self.errors_dflow.fetch_add(1, Ordering::Relaxed),
            _ => 0,
        };
    }

    pub fn record_cache_hit(&self) {
        self.quote_cache_hits.fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_cache_miss(&self) {
        self.quote_cache_misses.fetch_add(1, Ordering::Relaxed);
    }

    pub fn record_execution(&self, provider: &str, latency_ms: u64, success: bool) {
        if success {
            self.executions_succeeded.fetch_add(1, Ordering::Relaxed);
        } else {
            self.executions_failed.fetch_add(1, Ordering::Relaxed);
        }
        let tracker = match provider {
            "jupiter" => &self.exec_latency_jupiter,
            "ultra" => &self.exec_latency_ultra,
            "dflow" => &self.exec_latency_dflow,
            _ => return,
        };
        if let Ok(mut t) = tracker.lock() {
            t.record(latency_ms, success);
        }
    }

    pub fn record_latency(&self, provider: &str, latency_ms: u64, success: bool) {
        let tracker = match provider {
            "jupiter" => &self.latency_jupiter,
            "ultra" => &self.latency_ultra,
            "dflow" => &self.latency_dflow,
            _ => return,
        };
        if let Ok(mut t) = tracker.lock() {
            t.record(latency_ms, success);
        }
    }

    fn provider_latency_snapshot(&self, tracker: &Mutex<LatencyTracker>) -> ProviderLatency {
        let t = tracker.lock().unwrap_or_else(|e| e.into_inner());
        ProviderLatency {
            p50_ms: t.percentile(50.0),
            p95_ms: t.percentile(95.0),
            p99_ms: t.percentile(99.0),
            uptime_pct: t.uptime_pct(),
        }
    }

    pub fn snapshot(&self) -> StatsSnapshot {
        let hits = self.quote_cache_hits.load(Ordering::Relaxed);
        let misses = self.quote_cache_misses.load(Ordering::Relaxed);
        let total_cache = hits + misses;

        StatsSnapshot {
            total_quotes: self.total_quotes.load(Ordering::Relaxed),
            total_swaps: self.total_swaps.load(Ordering::Relaxed),
            cache_hit_ratio: if total_cache > 0 { hits as f64 / total_cache as f64 } else { 0.0 },
            quotes_by_provider: ProviderQuoteCounts {
                jupiter: self.quotes_jupiter.load(Ordering::Relaxed),
                ultra: self.quotes_ultra.load(Ordering::Relaxed),
                dflow: self.quotes_dflow.load(Ordering::Relaxed),
            },
            errors_by_provider: ProviderQuoteCounts {
                jupiter: self.errors_jupiter.load(Ordering::Relaxed),
                ultra: self.errors_ultra.load(Ordering::Relaxed),
                dflow: self.errors_dflow.load(Ordering::Relaxed),
            },
            latency_jupiter: self.provider_latency_snapshot(&self.latency_jupiter),
            latency_ultra: self.provider_latency_snapshot(&self.latency_ultra),
            latency_dflow: self.provider_latency_snapshot(&self.latency_dflow),
            executions: ExecutionStats {
                succeeded: self.executions_succeeded.load(Ordering::Relaxed),
                failed: self.executions_failed.load(Ordering::Relaxed),
                jupiter: self.provider_latency_snapshot(&self.exec_latency_jupiter),
                ultra: self.provider_latency_snapshot(&self.exec_latency_ultra),
                dflow: self.provider_latency_snapshot(&self.exec_latency_dflow),
            },
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StatsSnapshot {
    pub total_quotes: u64,
    pub total_swaps: u64,
    pub cache_hit_ratio: f64,
    pub quotes_by_provider: ProviderQuoteCounts,
    pub errors_by_provider: ProviderQuoteCounts,
    pub latency_jupiter: ProviderLatency,
    pub latency_ultra: ProviderLatency,
    pub latency_dflow: ProviderLatency,
    pub executions: ExecutionStats,
}

/// Actual transaction execution results (not just quotes).
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutionStats {
    pub succeeded: u64,
    pub failed: u64,
    pub jupiter: ProviderLatency,
    pub ultra: ProviderLatency,
    pub dflow: ProviderLatency,
}

#[derive(Debug, Serialize)]
pub struct ProviderQuoteCounts {
    pub jupiter: u64,
    pub ultra: u64,
    pub dflow: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderLatency {
    pub p50_ms: Option<u64>,
    pub p95_ms: Option<u64>,
    pub p99_ms: Option<u64>,
    pub uptime_pct: f64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_stats_recording() {
        let stats = SwapStats::new();
        stats.record_quote("jupiter");
        stats.record_quote("jupiter");
        stats.record_quote("ultra");
        stats.record_swap();
        stats.record_error("dflow");
        stats.record_cache_hit();
        stats.record_cache_miss();
        stats.record_cache_miss();

        let snap = stats.snapshot();
        assert_eq!(snap.total_quotes, 3);
        assert_eq!(snap.total_swaps, 1);
        assert_eq!(snap.quotes_by_provider.jupiter, 2);
        assert_eq!(snap.quotes_by_provider.ultra, 1);
        assert_eq!(snap.errors_by_provider.dflow, 1);
        assert!((snap.cache_hit_ratio - 1.0 / 3.0).abs() < 0.01);
    }

    #[test]
    fn test_latency_tracking() {
        let stats = SwapStats::new();
        for ms in [100, 200, 150, 300, 250] {
            stats.record_latency("jupiter", ms, true);
        }
        stats.record_latency("jupiter", 500, false);

        let snap = stats.snapshot();
        assert!(snap.latency_jupiter.p50_ms.is_some());
        assert!((snap.latency_jupiter.uptime_pct - 83.33).abs() < 1.0);
        assert!(snap.latency_ultra.p50_ms.is_none());
        assert!((snap.latency_ultra.uptime_pct - 100.0).abs() < 0.01);
    }

    #[test]
    fn test_execution_stats() {
        let stats = SwapStats::new();
        stats.record_execution("jupiter", 800, true);
        stats.record_execution("jupiter", 1200, true);
        stats.record_execution("jupiter", 2500, false);
        stats.record_execution("ultra", 400, true);

        let snap = stats.snapshot();
        assert_eq!(snap.executions.succeeded, 3);
        assert_eq!(snap.executions.failed, 1);
        assert!(snap.executions.jupiter.p50_ms.is_some());
        assert!((snap.executions.jupiter.uptime_pct - 66.66).abs() < 1.0);
        assert_eq!(snap.executions.ultra.p50_ms, Some(400));
        assert!((snap.executions.ultra.uptime_pct - 100.0).abs() < 0.01);
        // total_swaps should be incremented by record_execution with success
        // (but record_swap is called separately in service.rs, not here)
    }
}
