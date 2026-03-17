# cedros-trade

Solana trading infrastructure by [Cedros](https://cedros.io). Multi-provider swap routing (Jupiter, Ultra, DFlow), smart orders, SOL/SPL transfers, portfolio tracking, and Manifest orderbook integration.

## Packages

| Package | Description |
|---------|-------------|
| [`cedros-trade`](https://crates.io/crates/cedros-trade) | Rust server — embeddable library or standalone binary |
| [`@cedros/trade-react`](https://www.npmjs.com/package/@cedros/trade-react) | React components, hooks, and page templates |

## Quick Start

### As a library

```rust
use cedros_trade::{TradeService, TradeRouter, TradeConfig};

let config = TradeConfig::builder()
    .solana_rpc_url("https://api.mainnet-beta.solana.com")
    .enable_jupiter("https://api.jup.ag/swap/v1")
    .build();

let service = TradeService::new(config).await?;
let router = TradeRouter::new(service);

// Mount into your existing Axum app
let app = your_app.nest("/api/trade", router.into_router());
```

### As a standalone binary

```bash
SOLANA_RPC_URL=https://... cedros-trade
# or
cedros-trade --config trade.toml
```

### React

```tsx
import { CedrosTradeProvider, SwapPage, TradingPage } from '@cedros/trade-react';
import '@cedros/trade-react/style.css';

<CedrosTradeProvider config={{ serverUrl: '/api/trade' }}>
  <SwapPage walletAddress={pubkey} onSign={signTx} />
  <TradingPage walletAddress={pubkey} chartType="tradingview" onSign={signTx} />
</CedrosTradeProvider>
```

## Features

- **Swap routing** — best price across Jupiter v6, Jupiter Ultra (gasless), and DFlow (MEV-protected)
- **Smart orders** — limit, stop-loss, take-profit, trailing stop, OCO, bracket, DCA
- **Transfers** — SOL/SPL with .sol domain resolution, automatic ATA creation
- **Orderbook** — Manifest on-chain CLOB integration (read, stream, place orders)
- **Portfolio** — holdings with current values, P&L with trade history (via Helius/Shyft)
- **Server-signed execution** — embedded wallet users get automated trailing stops, OCO, brackets
- **Action queue** — browser wallet users get notifications when triggers fire

## License

MIT
