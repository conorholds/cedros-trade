//! Pure content generators for AI discovery — no HTTP, reusable across contexts.

use super::types::*;

pub fn get_skill_references(c: &ContentConfig) -> Vec<SkillPointer> {
    vec![
        SkillPointer { id: "swap".into(), name: "Swap & Routing".into(), path: c.path("/skills/swap.md"), description: "Multi-provider swap routing (Jupiter, Ultra, DFlow)".into() },
        SkillPointer { id: "transfers".into(), name: "Transfers".into(), path: c.path("/skills/transfers.md"), description: "SOL/SPL token transfers with .sol domain resolution".into() },
        SkillPointer { id: "orders".into(), name: "Smart Orders".into(), path: c.path("/skills/orders.md"), description: "Limit, stop-loss, take-profit, trailing stop, OCO, bracket, DCA".into() },
        SkillPointer { id: "positions".into(), name: "Positions & Portfolio".into(), path: c.path("/skills/positions.md"), description: "Holdings, prices, P&L, trade history".into() },
        SkillPointer { id: "orderbook".into(), name: "Orderbook".into(), path: c.path("/skills/orderbook.md"), description: "Manifest on-chain CLOB — read, stream, place orders".into() },
        SkillPointer { id: "admin".into(), name: "Admin".into(), path: c.path("/skills/admin.md"), description: "Provider management, token registry, API keys, monitoring".into() },
    ]
}

pub fn generate_ai_txt(c: &ContentConfig) -> String {
    format!(r#"# AI Access Policy
User-agent: *
Allow: /

AI-Discovery: {bp}/.well-known/ai-discovery.json
LLMs-Txt: {bp}/llms.txt
LLMs-Full: {bp}/llms-full.txt
OpenAPI: {bp}/openapi.json
Skills: {bp}/skill.json
Agent-Guide: {bp}/agent.md
"#, bp = c.base_path)
}

pub fn generate_llms_txt(c: &ContentConfig) -> String {
    let skills = get_skill_references(c);
    let skill_links: String = skills.iter()
        .map(|s| format!("- [{}]({}): {}", s.name, s.path, s.description))
        .collect::<Vec<_>>().join("\n");

    format!(r#"# Cedros Trade

> {desc} Supports multi-provider swap routing (Jupiter v6, Ultra, DFlow), smart orders (limit, stop-loss, take-profit, trailing stop, OCO, bracket, DCA), SOL/SPL transfers, Manifest orderbook, and portfolio tracking with P&L.

## Quick Start

1. Get a quote: `GET {bp}/swap/quote?inputMint=So111...&outputMint=EPjFW...&amount=1000000000`
2. Build transaction: `POST {bp}/swap/build` with quote + userPublicKey
3. Sign with wallet adapter, then execute: `POST {bp}/swap/execute`

## Docs

- [{bp}/agent.md]({bp}/agent.md): Agent integration guide
- [{bp}/llms-full.txt]({bp}/llms-full.txt): Complete API reference
- [{bp}/llms-admin.txt]({bp}/llms-admin.txt): Admin endpoints
- [{bp}/openapi.json]({bp}/openapi.json): OpenAPI 3.1 spec

## Skills

{skill_links}
"#, desc = c.description, bp = c.base_path)
}

pub fn generate_llms_full_txt(c: &ContentConfig) -> String {
    format!(r#"# Cedros Trade — Full API Reference

> {desc}
> Version: {ver}

## Authentication

Most endpoints are public. Admin endpoints require `Authorization: Bearer <token>`.
Rate-limited endpoints accept `x-api-key` header.

## Swap Endpoints

### GET|POST {bp}/swap/quote
Get best swap quote across enabled providers.
Query/Body: inputMint (string), outputMint (string), amount (string), slippageBps? (u32), provider? (string)
Response: {{ provider, inputMint, outputMint, inAmount, outAmount, otherAmountThreshold, priceImpactPct, slippageBps, routeData, gasless }}

### POST {bp}/swap/build
Build unsigned swap transaction from accepted quote.
Body: {{ quote: SwapQuote, userPublicKey: string }}
Response: {{ transaction (base64), gasless, lastValidBlockHeight, requestId }}

### POST {bp}/swap/execute
Submit signed transaction. Routes to Ultra /execute or Solana RPC based on provider.
Body: {{ signedTransaction (base64), provider, requestId? }}
Response: {{ signature, status (confirmed|submitted|failed), lastValidBlockHeight, explorerUrl }}

### POST {bp}/swap/simulate
Simulate a signed transaction before submission.
Body: {{ signedTransaction (base64) }}
Response: {{ success, logs, unitsConsumed, error? }}

### GET {bp}/swap/compare
Compare quotes from all enabled providers.
Query: inputMint, outputMint, amount
Response: SwapQuote[]

### GET {bp}/swap/providers
List enabled providers with health and capabilities.
Response: ProviderInfo[]

### GET {bp}/swap/routes
List provider capabilities (gasless, MEV-protected, exact-out support).

## Token Endpoints

### GET {bp}/tokens
List curated tokens. Query: category? (governance|meme|liquid-staking|stablecoin)
Response: {{ tokens: TokenRecord[], count }}

### GET {bp}/tokens/:mint
Get single token. Falls back to Metaplex on-chain metadata if not in registry.
Response: {{ mint, symbol, name, decimals, logoUrl, coingeckoId, categories }}

## Price Endpoints

### GET {bp}/prices/:mint
Composite price from Jupiter + CoinGecko.
Response: {{ mint, priceUsd, sources[], degraded, marketCap, volume24h, priceChange24hPct }}

### GET {bp}/prices/by-symbol/:symbol
Price lookup by symbol (e.g., "SOL").

### POST {bp}/prices/batch
Batch price lookup (max 100 mints).
Body: {{ mints: string[] }}

## Transfer Endpoints

### POST {bp}/transfers/build
Build unsigned SOL or SPL transfer transaction.
Body: {{ sender, recipient, mint, amount, memo? }}
Response: {{ transaction (base64), recipientResolved, recipientType, lastValidBlockHeight, createsAta }}

### POST {bp}/transfers/execute
Submit signed transfer.
Body: {{ signedTransaction, provider: "rpc" }}

### GET {bp}/transfers/resolve/:address
Resolve .sol domain or validate pubkey.
Response: {{ input, resolved, type (address|domain) }}

## Order Endpoints

### POST {bp}/orders/limit
Build limit order via Jupiter Trigger V2.
Body: {{ maker, inputMint, outputMint, inAmount, outAmount, expiry? }}

### POST {bp}/orders/stop-loss
Body: {{ maker, inputMint, outputMint, inAmount, triggerPrice, slippageBps? }}

### POST {bp}/orders/take-profit
Body: {{ maker, inputMint, outputMint, inAmount, triggerPrice, slippageBps? }}

### POST {bp}/orders/dca
Build DCA schedule via Jupiter Recurring.
Body: {{ maker, inputMint, outputMint, totalInAmount, perCycleAmount, cycleInterval }}

### DELETE {bp}/orders/:orderId
Cancel order. Body: {{ maker }}

### GET {bp}/orders/wallet/:address
List open on-chain orders.

### POST {bp}/orders/trailing-stop
Server-monitored trailing stop (embedded wallet).
Body: {{ maker, walletId, inputMint, outputMint, inAmount, trailPercent, slippageBps? }}

### POST {bp}/orders/oco
One-cancels-other pair. Degrades for external wallets.
Body: {{ maker, walletId?, inputMint, outputMint, inAmount, stopLoss: {{triggerPrice, slippageBps}}, takeProfit: {{triggerPrice, slippageBps}} }}

### POST {bp}/orders/bracket
Entry + auto SL/TP.
Body: {{ maker, walletId, inputMint, outputMint, inAmount, stopLossPercent, takeProfitPercent }}

### GET {bp}/orders/monitored/:address
List server-monitored orders.

### GET {bp}/orders/:orderId/executions
Execution history for an order.

## Action Queue (Browser Wallet)

### GET {bp}/orders/actions/:address
Pending actions for browser wallet users.

### GET {bp}/orders/actions/:address/stream
SSE stream for real-time action notifications.

### POST {bp}/orders/actions/:actionId/complete
Submit signed transaction to complete action.

### POST {bp}/orders/actions/:actionId/dismiss
Dismiss action.

## Position Endpoints

### GET {bp}/positions/:address
Holdings with current prices and total value.

### GET {bp}/positions/:address/pnl
Holdings with entry prices and unrealized P&L (requires indexer).

### GET {bp}/positions/:address/history
Trade history (requires indexer). Query: mint?, limit?

## Orderbook (Manifest)

### GET {bp}/orderbook/:market
Bids/asks from on-chain Manifest account.

### GET {bp}/orderbook/markets
Find market by mints. Query: base, quote

### POST {bp}/orders/manifest
Place order on Manifest CLOB.
Body: {{ market, maker, isBid, numBaseTokens, tokenPrice }}

## WebSocket

### GET {bp}/ws/prices
Subscribe to real-time price updates per mint.
Send: {{ type: "subscribe", mints: ["..."] }}
Receive: {{ type: "price", mint, priceUsd, ... }}

### GET {bp}/ws/orderbook/:market
1-second orderbook streaming.

## Health & Metrics

### GET {bp}/health
Service health + provider status.

### GET {bp}/metrics
Prometheus exposition format.
"#, desc = c.description, ver = c.version, bp = c.base_path)
}

pub fn generate_llms_admin_txt(c: &ContentConfig) -> String {
    format!(r#"# Cedros Trade — Admin Endpoints

> All admin endpoints require `Authorization: Bearer <admin-token>`.
> Enable by setting `ADMIN_BEARER_TOKEN` env var.

## GET|PATCH {bp}/admin/config
Read/update runtime config. Secrets are redacted. PATCH supports: defaultSlippageBps.

## GET {bp}/admin/providers
Provider health, latency p50/p95/p99, uptime %, error rates.

## POST {bp}/admin/providers/:id/enable | /disable
Toggle providers at runtime without restart.

## GET|POST {bp}/admin/tokens
List or add tokens to the curated registry.
POST body: {{ mint, symbol, name, decimals, logoUrl?, coingeckoId?, categories? }}

## PATCH|DELETE {bp}/admin/tokens/:mint
Update metadata or remove token.

## GET|POST|DELETE {bp}/admin/api-keys
Manage API keys with per-key rate limits and allowed origins.

## GET {bp}/admin/stats
Live swap stats: total quotes/swaps, cache hit ratio, per-provider latency/uptime, execution success/fail.

## GET {bp}/admin/orders/stats
Order execution stats.

## GET {bp}/admin/monitor/status
Price monitor state: active orders, poll interval, paused status.

## POST {bp}/admin/monitor/pause | /resume
Emergency stop/resume for price monitoring.
"#, bp = c.base_path)
}

pub fn generate_agent_md(c: &ContentConfig) -> String {
    format!(r#"---
name: cedros-trade
version: "{ver}"
description: "{desc}"
---

# Cedros Trade — Agent Integration Guide

## What You Can Do

1. **Swap tokens** — get quotes, build transactions, execute swaps across Jupiter, Ultra, DFlow
2. **Transfer SOL/SPL** — send to addresses or .sol domains
3. **Manage orders** — limit, stop-loss, take-profit, trailing stop, OCO, bracket, DCA
4. **Read positions** — holdings, prices, P&L, trade history
5. **Read orderbook** — Manifest on-chain CLOB data

## Authentication

- **Public endpoints** — no auth needed for quotes, prices, tokens, portfolio reads
- **Order execution** — requires a wallet signature (unsigned tx returned, you sign)
- **Admin endpoints** — `Authorization: Bearer <admin-token>`
- **Rate limiting** — `x-api-key` header with per-key limits

## Typical Workflow: Swap

```
1. GET {bp}/swap/quote?inputMint=So111...&outputMint=EPjFW...&amount=1000000000
2. POST {bp}/swap/build  {{ "quote": <quote>, "userPublicKey": "<wallet>" }}
3. Sign the base64 transaction with wallet
4. POST {bp}/swap/execute {{ "signedTransaction": "<signed>", "provider": "<from quote>" }}
```

## Typical Workflow: Place Limit Order

```
1. POST {bp}/orders/limit {{ "maker": "<wallet>", "inputMint": "...", "outputMint": "...", "inAmount": "...", "outAmount": "..." }}
2. Sign the returned transaction
3. Order is now active on-chain via Jupiter Trigger V2
```

## Typical Workflow: Check Portfolio

```
1. GET {bp}/positions/<wallet>           → holdings with current values
2. GET {bp}/positions/<wallet>/pnl       → entry prices + unrealized P&L
3. GET {bp}/orders/wallet/<wallet>       → open on-chain orders
```

## Error Handling

All errors return: `{{ "error": {{ "code": "ERROR_CODE", "message": "..." }} }}`

Common codes: INVALID_MINT, INVALID_AMOUNT, UPSTREAM_TIMEOUT, NO_PROVIDERS_AVAILABLE, TOKEN_NOT_FOUND, RATE_LIMITED, INDEXER_NOT_CONFIGURED

## Discovery

- `{bp}/llms.txt` — quick reference
- `{bp}/llms-full.txt` — complete API docs
- `{bp}/openapi.json` — OpenAPI 3.1 spec
- `{bp}/skill.json` — skill metadata
"#, ver = c.version, desc = c.description, bp = c.base_path)
}

pub fn get_skill_metadata(c: &ContentConfig) -> SkillMetadata {
    SkillMetadata {
        name: c.name.clone(),
        version: c.version.clone(),
        description: c.description.clone(),
        category: "trading".into(),
        api_base: c.base_path.clone(),
        capabilities: serde_json::json!({
            "swapRouting": true, "smartOrders": true, "transfers": true,
            "portfolio": true, "orderbook": true, "priceAggregation": true,
            "serverSignedExecution": true, "actionQueue": true,
        }),
        skills: get_skill_references(c),
    }
}

pub fn get_discovery_index(c: &ContentConfig) -> AiDiscoveryIndex {
    AiDiscoveryIndex {
        version: "1.0.0".into(),
        name: c.name.clone(),
        description: c.description.clone(),
        endpoints: DiscoveryEndpoints {
            llms_txt: c.path("/llms.txt"),
            llms_full_txt: c.path("/llms-full.txt"),
            llms_admin_txt: c.path("/llms-admin.txt"),
            skill_index_markdown: c.path("/skill.md"),
            skill_index_json: c.path("/skill.json"),
            agent_guide: c.path("/agent.md"),
            openapi: c.path("/openapi.json"),
            a2a_agent_card: c.path("/.well-known/agent.json"),
            ai_plugin: c.path("/.well-known/ai-plugin.json"),
            mcp: c.path("/.well-known/mcp"),
            health: c.path("/heartbeat.json"),
            skills_bundle: c.path("/.well-known/skills.zip"),
        },
        skills: get_skill_references(c),
    }
}

pub fn get_ai_plugin_manifest(c: &ContentConfig) -> AiPluginManifest {
    AiPluginManifest {
        schema_version: "v1".into(),
        name_for_human: "Cedros Trade".into(),
        name_for_model: "cedros_trade".into(),
        description_for_human: c.description.clone(),
        description_for_model: "Solana trading API: swap routing across Jupiter/Ultra/DFlow, smart orders (limit/stop-loss/take-profit/trailing-stop/OCO/bracket/DCA), SOL/SPL transfers, portfolio tracking with P&L, Manifest orderbook.".into(),
        auth: AiPluginAuth { auth_type: "none".into() },
        api: AiPluginApi { api_type: "openapi".into(), url: c.path("/openapi.json") },
    }
}

pub fn get_agent_card(c: &ContentConfig) -> AgentCard {
    AgentCard {
        name: c.name.clone(), version: c.version.clone(), description: c.description.clone(),
        url: c.base_path.clone(),
        skills: vec![
            AgentSkill { id: "swap".into(), name: "Token Swaps".into(), description: "Multi-provider swap routing".into(), tags: vec!["trading".into(), "defi".into()] },
            AgentSkill { id: "orders".into(), name: "Smart Orders".into(), description: "Limit, stop-loss, take-profit, DCA".into(), tags: vec!["trading".into()] },
            AgentSkill { id: "transfers".into(), name: "Transfers".into(), description: "SOL/SPL transfers".into(), tags: vec!["payments".into()] },
            AgentSkill { id: "positions".into(), name: "Portfolio".into(), description: "Holdings and P&L tracking".into(), tags: vec!["analytics".into()] },
            AgentSkill { id: "orderbook".into(), name: "Orderbook".into(), description: "Manifest CLOB".into(), tags: vec!["trading".into(), "defi".into()] },
        ],
        authentication: AgentAuth { schemes: vec!["bearer".into()], header: "Authorization".into() },
    }
}

pub fn get_mcp_discovery(c: &ContentConfig) -> McpDiscovery {
    McpDiscovery {
        name: c.name.clone(), version: c.version.clone(), protocol_version: "2024-11-05".into(),
        capabilities: McpCapabilities { tools: true, resources: true },
        tools: vec![
            McpTool { name: "swap_quote".into(), description: "Get best swap quote".into(), input_schema: serde_json::json!({"type":"object","properties":{"inputMint":{"type":"string"},"outputMint":{"type":"string"},"amount":{"type":"string"}},"required":["inputMint","outputMint","amount"]}) },
            McpTool { name: "get_price".into(), description: "Get token price".into(), input_schema: serde_json::json!({"type":"object","properties":{"mint":{"type":"string"}},"required":["mint"]}) },
            McpTool { name: "get_positions".into(), description: "Get wallet holdings".into(), input_schema: serde_json::json!({"type":"object","properties":{"address":{"type":"string"}},"required":["address"]}) },
            McpTool { name: "create_limit_order".into(), description: "Place a limit order".into(), input_schema: serde_json::json!({"type":"object","properties":{"maker":{"type":"string"},"inputMint":{"type":"string"},"outputMint":{"type":"string"},"inAmount":{"type":"string"},"outAmount":{"type":"string"}},"required":["maker","inputMint","outputMint","inAmount","outAmount"]}) },
        ],
    }
}

pub fn get_heartbeat(c: &ContentConfig) -> HeartbeatResponse {
    HeartbeatResponse {
        status: "ok".into(), version: c.version.clone(), name: c.name.clone(),
        capabilities: vec!["swap".into(), "transfers".into(), "orders".into(), "positions".into(), "orderbook".into(), "prices".into()],
        endpoints_count: 59,
    }
}
