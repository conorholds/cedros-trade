//! Prometheus-format metrics endpoint.
//! Exposes existing SwapStats in prometheus exposition text format at GET /metrics.

use axum::extract::State;
use axum::http::header;
use axum::response::{IntoResponse, Response};

use crate::service::TradeService;

pub async fn metrics_handler(State(service): State<TradeService>) -> Response {
    let snap = service.stats().snapshot();
    let mut out = String::with_capacity(2048);

    // Swap counters
    prom_counter(&mut out, "trade_quotes_total", "Total swap quotes requested", snap.total_quotes);
    prom_counter(&mut out, "trade_swaps_total", "Total swaps executed", snap.total_swaps);
    prom_gauge(&mut out, "trade_cache_hit_ratio", "Quote cache hit ratio", snap.cache_hit_ratio);

    // Per-provider quotes
    prom_counter_label(&mut out, "trade_quotes_by_provider", "Quotes by provider", "provider", "jupiter", snap.quotes_by_provider.jupiter);
    prom_counter_label(&mut out, "trade_quotes_by_provider", "", "provider", "ultra", snap.quotes_by_provider.ultra);
    prom_counter_label(&mut out, "trade_quotes_by_provider", "", "provider", "dflow", snap.quotes_by_provider.dflow);

    // Per-provider errors
    prom_counter_label(&mut out, "trade_errors_by_provider", "Errors by provider", "provider", "jupiter", snap.errors_by_provider.jupiter);
    prom_counter_label(&mut out, "trade_errors_by_provider", "", "provider", "ultra", snap.errors_by_provider.ultra);
    prom_counter_label(&mut out, "trade_errors_by_provider", "", "provider", "dflow", snap.errors_by_provider.dflow);

    // Execution stats
    prom_counter(&mut out, "trade_executions_succeeded", "Successful transaction executions", snap.executions.succeeded);
    prom_counter(&mut out, "trade_executions_failed", "Failed transaction executions", snap.executions.failed);

    // Provider latencies (quote)
    for (name, lat) in [("jupiter", &snap.latency_jupiter), ("ultra", &snap.latency_ultra), ("dflow", &snap.latency_dflow)] {
        if let Some(v) = lat.p50_ms { prom_gauge_label(&mut out, "trade_quote_latency_p50_ms", "Quote latency p50", "provider", name, v as f64); }
        if let Some(v) = lat.p95_ms { prom_gauge_label(&mut out, "trade_quote_latency_p95_ms", "Quote latency p95", "provider", name, v as f64); }
        if let Some(v) = lat.p99_ms { prom_gauge_label(&mut out, "trade_quote_latency_p99_ms", "Quote latency p99", "provider", name, v as f64); }
        prom_gauge_label(&mut out, "trade_provider_uptime_pct", "Provider uptime %", "provider", name, lat.uptime_pct);
    }

    // Execution latencies
    for (name, lat) in [("jupiter", &snap.executions.jupiter), ("ultra", &snap.executions.ultra), ("dflow", &snap.executions.dflow)] {
        if let Some(v) = lat.p50_ms { prom_gauge_label(&mut out, "trade_exec_latency_p50_ms", "Execution latency p50", "provider", name, v as f64); }
        if let Some(v) = lat.p95_ms { prom_gauge_label(&mut out, "trade_exec_latency_p95_ms", "Execution latency p95", "provider", name, v as f64); }
        if let Some(v) = lat.p99_ms { prom_gauge_label(&mut out, "trade_exec_latency_p99_ms", "Execution latency p99", "provider", name, v as f64); }
    }

    ([(header::CONTENT_TYPE, "text/plain; version=0.0.4; charset=utf-8")], out).into_response()
}

fn prom_counter(out: &mut String, name: &str, help: &str, value: u64) {
    if !help.is_empty() {
        out.push_str(&format!("# HELP {name} {help}\n# TYPE {name} counter\n"));
    }
    out.push_str(&format!("{name} {value}\n"));
}

fn prom_gauge(out: &mut String, name: &str, help: &str, value: f64) {
    out.push_str(&format!("# HELP {name} {help}\n# TYPE {name} gauge\n{name} {value:.4}\n"));
}

fn prom_counter_label(out: &mut String, name: &str, help: &str, label: &str, lval: &str, value: u64) {
    if !help.is_empty() {
        out.push_str(&format!("# HELP {name} {help}\n# TYPE {name} counter\n"));
    }
    out.push_str(&format!("{name}{{{label}=\"{lval}\"}} {value}\n"));
}

fn prom_gauge_label(out: &mut String, name: &str, help: &str, label: &str, lval: &str, value: f64) {
    if !help.is_empty() {
        out.push_str(&format!("# HELP {name} {help}\n# TYPE {name} gauge\n"));
    }
    out.push_str(&format!("{name}{{{label}=\"{lval}\"}} {value:.4}\n"));
}
