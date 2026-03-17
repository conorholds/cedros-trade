//! Individual skill file content generators.

use super::types::ContentConfig;

pub fn generate_skill_swap_md(c: &ContentConfig) -> String {
    format!(r#"---
skill: swap
name: Swap & Routing
version: "{ver}"
description: Multi-provider swap routing across Jupiter v6, Jupiter Ultra, and DFlow
apiBase: "{bp}"
requiresAuth: false
---

# Swap & Routing Skill

## Get Quote (best price across all providers)
```
GET {bp}/swap/quote?inputMint=So111...112&outputMint=EPjFW...1v&amount=1000000000&slippageBps=50
```
Response: `{{ provider, inAmount, outAmount, otherAmountThreshold, priceImpactPct, gasless }}`

## Compare All Providers
```
GET {bp}/swap/compare?inputMint=So111...&outputMint=EPjFW...&amount=1000000000
```
Returns array of quotes from all enabled providers.

## Build Transaction
```
POST {bp}/swap/build
{{ "quote": <quote-from-step-1>, "userPublicKey": "<wallet-pubkey>" }}
```
Response: `{{ transaction (base64), lastValidBlockHeight, requestId }}`

## Execute (after signing)
```
POST {bp}/swap/execute
{{ "signedTransaction": "<base64>", "provider": "<from-quote>", "requestId": "<if-ultra>" }}
```
Response: `{{ signature, status, explorerUrl }}`

## Simulate Before Sending
```
POST {bp}/swap/simulate
{{ "signedTransaction": "<base64>" }}
```

## Providers
- **Jupiter v6** — deepest liquidity, AMM routing
- **Jupiter Ultra** — gasless, MEV-protected, intent-based
- **DFlow** — order flow auction, price improvement on larger trades
"#, ver = c.version, bp = c.base_path)
}

pub fn generate_skill_transfers_md(c: &ContentConfig) -> String {
    format!(r#"---
skill: transfers
name: Transfers
version: "{ver}"
description: SOL and SPL token transfers with .sol domain resolution
apiBase: "{bp}"
requiresAuth: false
---

# Transfers Skill

## Build Transfer
```
POST {bp}/transfers/build
{{ "sender": "<pubkey>", "recipient": "<pubkey-or-name.sol>", "mint": "So111...112", "amount": "1000000000" }}
```
Response includes `createsAta: true` if recipient needs a new token account (~0.002 SOL rent).

## Resolve Address
```
GET {bp}/transfers/resolve/vitalik.sol
```
Returns `{{ input, resolved, type: "domain" }}` — resolves .sol via Bonfida SNS.

## Execute
```
POST {bp}/transfers/execute
{{ "signedTransaction": "<base64>", "provider": "rpc" }}
```
"#, ver = c.version, bp = c.base_path)
}

pub fn generate_skill_orders_md(c: &ContentConfig) -> String {
    format!(r#"---
skill: orders
name: Smart Orders
version: "{ver}"
description: Limit orders, stop-loss, take-profit, trailing stop, OCO, bracket, DCA
apiBase: "{bp}"
requiresAuth: false
---

# Smart Orders Skill

## Limit Order
```
POST {bp}/orders/limit
{{ "maker": "<wallet>", "inputMint": "...", "outputMint": "...", "inAmount": "...", "outAmount": "..." }}
```

## Stop-Loss (sell when price drops below trigger)
```
POST {bp}/orders/stop-loss
{{ "maker": "<wallet>", "inputMint": "...", "outputMint": "...", "inAmount": "...", "triggerPrice": "120.00" }}
```

## Take-Profit (sell when price rises above trigger)
```
POST {bp}/orders/take-profit
{{ "maker": "<wallet>", "inputMint": "...", "outputMint": "...", "inAmount": "...", "triggerPrice": "200.00" }}
```

## Trailing Stop (server-monitored, follows peak)
```
POST {bp}/orders/trailing-stop
{{ "maker": "<wallet>", "walletId": "<embedded-wallet-id>", "inputMint": "...", "outputMint": "...", "inAmount": "...", "trailPercent": 10 }}
```

## OCO (one-cancels-other)
```
POST {bp}/orders/oco
{{ "maker": "...", "inputMint": "...", "outputMint": "...", "inAmount": "...", "stopLoss": {{ "triggerPrice": "130.00", "slippageBps": 100 }}, "takeProfit": {{ "triggerPrice": "200.00", "slippageBps": 50 }} }}
```

## Bracket (entry + auto SL/TP)
```
POST {bp}/orders/bracket
{{ "maker": "...", "walletId": "...", "inputMint": "...", "outputMint": "...", "inAmount": "...", "stopLossPercent": 10, "takeProfitPercent": 30 }}
```

## DCA (dollar cost averaging)
```
POST {bp}/orders/dca
{{ "maker": "...", "inputMint": "...", "outputMint": "...", "totalInAmount": "100000000", "perCycleAmount": "10000000", "cycleInterval": 86400 }}
```

## Cancel Order
```
DELETE {bp}/orders/<orderId>
{{ "maker": "<wallet>" }}
```

## List Open Orders
```
GET {bp}/orders/wallet/<walletAddress>
```
"#, ver = c.version, bp = c.base_path)
}

pub fn generate_skill_positions_md(c: &ContentConfig) -> String {
    format!(r#"---
skill: positions
name: Positions & Portfolio
version: "{ver}"
description: Holdings, prices, P&L, trade history
apiBase: "{bp}"
requiresAuth: false
---

# Positions & Portfolio Skill

## Current Holdings (Tier 1 — no indexer needed)
```
GET {bp}/positions/<walletAddress>
```
Returns: `{{ holdings: [{{ mint, symbol, balance, uiBalance, currentPrice, currentValue }}], totalValue, openOrders }}`

## P&L with Entry Prices (Tier 2 — requires indexer)
```
GET {bp}/positions/<walletAddress>/pnl
```
Returns: `{{ holdings: [{{ ..., entryPrice, costBasis, unrealizedPnl, unrealizedPnlPercent }}], totalCostBasis, totalUnrealizedPnl }}`

## Trade History
```
GET {bp}/positions/<walletAddress>/history?mint=So111...&limit=50
```

## Prices
```
GET {bp}/prices/<mint>
GET {bp}/prices/by-symbol/SOL
POST {bp}/prices/batch  {{ "mints": ["So111...", "EPjFW..."] }}
```

## WebSocket Price Streaming
```
ws://.../ws/prices
Send: {{ "type": "subscribe", "mints": ["So111..."] }}
Receive: {{ "type": "price", "mint": "...", "priceUsd": 155.42, ... }}
```
"#, ver = c.version, bp = c.base_path)
}

pub fn generate_skill_orderbook_md(c: &ContentConfig) -> String {
    format!(r#"---
skill: orderbook
name: Orderbook (Manifest)
version: "{ver}"
description: On-chain CLOB via Manifest protocol — read, stream, place orders
apiBase: "{bp}"
requiresAuth: false
---

# Orderbook Skill (Manifest)

## Read Orderbook
```
GET {bp}/orderbook/<marketAddress>
```
Returns: `{{ bids, asks, spread, midPrice }}`

## Find Market
```
GET {bp}/orderbook/markets?base=So111...&quote=EPjFW...
```

## Place Order
```
POST {bp}/orders/manifest
{{ "market": "<address>", "maker": "<wallet>", "isBid": true, "numBaseTokens": 1.0, "tokenPrice": 155.0 }}
```

## WebSocket Streaming
```
ws://.../ws/orderbook/<marketAddress>
```
Pushes full orderbook snapshot every 1 second.
"#, ver = c.version, bp = c.base_path)
}

pub fn generate_skill_admin_md(c: &ContentConfig) -> String {
    format!(r#"---
skill: admin
name: Admin
version: "{ver}"
description: Provider management, token registry, API keys, monitoring
apiBase: "{bp}"
requiresAuth: true
---

# Admin Skill

All admin endpoints require `Authorization: Bearer <admin-token>`.

## Config
```
GET {bp}/admin/config          # View (secrets redacted)
PATCH {bp}/admin/config        # Update slippage default
```

## Providers
```
GET {bp}/admin/providers
POST {bp}/admin/providers/jupiter/disable
POST {bp}/admin/providers/jupiter/enable
```

## Token Registry
```
GET {bp}/admin/tokens
POST {bp}/admin/tokens         # Add token
PATCH {bp}/admin/tokens/<mint> # Edit metadata
DELETE {bp}/admin/tokens/<mint> # Remove
```

## API Keys
```
GET {bp}/admin/api-keys
POST {bp}/admin/api-keys       {{ "name": "...", "rateLimit": 100 }}
DELETE {bp}/admin/api-keys/<id>
```

## Stats & Monitoring
```
GET {bp}/admin/stats           # Swap volume, cache, latency p50/p95/p99
GET {bp}/admin/monitor/status  # Price monitor state
POST {bp}/admin/monitor/pause  # Emergency stop
POST {bp}/admin/monitor/resume
```
"#, ver = c.version, bp = c.base_path)
}
