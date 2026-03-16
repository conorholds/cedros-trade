use cedros_trade::TradeConfig;

#[test]
fn test_config_defaults() {
    let cfg = TradeConfig::default();
    assert_eq!(cfg.swap.default_slippage_bps, 30);
    assert_eq!(cfg.swap.jupiter.api_url, "https://api.jup.ag/swap/v1");
    assert_eq!(cfg.swap.ultra.api_url, "https://api.jup.ag/ultra/v1");
    assert_eq!(cfg.swap.dflow.api_url, "https://quote-api.dflow.net");
    assert_eq!(cfg.solana.rpc_url, "https://api.mainnet-beta.solana.com");
    assert_eq!(cfg.solana.network, "mainnet-beta");
    assert_eq!(cfg.server.host, "0.0.0.0");
    assert_eq!(cfg.server.port, 8080);
    assert_eq!(cfg.coingecko.api_url, "https://api.coingecko.com/api/v3");
    assert_eq!(cfg.coingecko.price_cache_ttl_secs, 30);
    assert_eq!(cfg.swap.enabled_providers, vec!["jupiter"]);
    assert!(cfg.swap.dflow.fallback_to_jupiter);
    assert!(!cfg.embedded_wallet.enabled);
    assert!(!cfg.indexer.enabled);
}

#[test]
fn test_config_from_toml() {
    let toml_str = r#"
[solana]
rpc_url = "https://my-rpc.example.com"
network = "devnet"

[swap]
default_slippage_bps = 50

[swap.jupiter]
api_url = "https://custom-jup.example.com"
quote_cache_ttl_secs = 10
max_requests_per_sec = 5

[server]
port = 9090
"#;
    let cfg: TradeConfig = toml::from_str(toml_str).expect("valid TOML");
    assert_eq!(cfg.solana.rpc_url, "https://my-rpc.example.com");
    assert_eq!(cfg.solana.network, "devnet");
    assert_eq!(cfg.swap.default_slippage_bps, 50);
    assert_eq!(cfg.swap.jupiter.api_url, "https://custom-jup.example.com");
    assert_eq!(cfg.server.port, 9090);
    assert_eq!(cfg.server.host, "0.0.0.0");
}

#[test]
fn test_config_builder() {
    let cfg = TradeConfig::builder()
        .solana_rpc_url("https://builder-rpc.example.com")
        .network("testnet")
        .enable_jupiter("https://builder-jup.example.com")
        .enable_ultra("https://builder-ultra.example.com")
        .default_slippage_bps(100)
        .server_port(3000)
        .cors_origins(vec!["https://app.example.com".into()])
        .build();

    assert_eq!(cfg.solana.rpc_url, "https://builder-rpc.example.com");
    assert_eq!(cfg.swap.default_slippage_bps, 100);
    assert_eq!(cfg.server.port, 3000);
    assert!(cfg.swap.enabled_providers.contains(&"jupiter".to_string()));
    assert!(cfg.swap.enabled_providers.contains(&"ultra".to_string()));
}

#[test]
fn test_config_builder_no_duplicate_providers() {
    let cfg = TradeConfig::builder()
        .enable_jupiter("url1")
        .enable_jupiter("url2")
        .build();
    let count = cfg.swap.enabled_providers.iter().filter(|p| *p == "jupiter").count();
    assert_eq!(count, 1);
    assert_eq!(cfg.swap.jupiter.api_url, "url2");
}

#[test]
fn test_config_toml_partial_swap() {
    let toml_str = r#"
[swap]
default_slippage_bps = 100
enabled_providers = ["jupiter", "ultra", "dflow"]
"#;
    let cfg: TradeConfig = toml::from_str(toml_str).expect("valid TOML");
    assert_eq!(cfg.swap.default_slippage_bps, 100);
    assert_eq!(cfg.swap.enabled_providers.len(), 3);
    assert_eq!(cfg.swap.jupiter.api_url, "https://api.jup.ag/swap/v1");
}
