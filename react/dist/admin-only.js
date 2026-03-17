import { jsxs as s, jsx as e } from "react/jsx-runtime";
import { useState as u, useEffect as w, useCallback as S } from "react";
import { T as A } from "./apiClient-Chdwm2xl.js";
function $({ pluginContext: a }) {
  const [c, l] = u(null), [d, m] = u(null);
  return w(() => {
    new A(a.serverUrl, a.getAccessToken).getHealth().then(m).catch(() => {
    }), fetch(`${a.serverUrl}/admin/stats`, {
      headers: { Authorization: `Bearer ${a.getAccessToken()}` }
    }).then((g) => g.json()).then(l).catch(() => {
    });
  }, [a]), /* @__PURE__ */ s("div", { className: "ct-space-y-6", children: [
    /* @__PURE__ */ e("h2", { className: "ct-text-xl ct-font-semibold", children: "Trade Overview" }),
    /* @__PURE__ */ s("div", { className: "ct-grid ct-grid-cols-2 lg:ct-grid-cols-4 ct-gap-4", children: [
      /* @__PURE__ */ e(b, { label: "Total Quotes", value: (c == null ? void 0 : c.totalQuotes) ?? 0 }),
      /* @__PURE__ */ e(b, { label: "Total Swaps", value: (c == null ? void 0 : c.totalSwaps) ?? 0 }),
      /* @__PURE__ */ e(b, { label: "Cache Hit Ratio", value: `${(((c == null ? void 0 : c.cacheHitRatio) ?? 0) * 100).toFixed(1)}%` }),
      /* @__PURE__ */ e(b, { label: "Service Status", value: (d == null ? void 0 : d.status) ?? "unknown" })
    ] }),
    (c == null ? void 0 : c.executions) && /* @__PURE__ */ s("div", { className: "ct-grid ct-grid-cols-2 ct-gap-4", children: [
      /* @__PURE__ */ e(b, { label: "Executions Succeeded", value: c.executions.succeeded }),
      /* @__PURE__ */ e(b, { label: "Executions Failed", value: c.executions.failed })
    ] })
  ] });
}
function b({ label: a, value: c }) {
  return /* @__PURE__ */ s("div", { className: "ct-bg-[hsl(var(--cedros-muted))] ct-rounded-cedros ct-p-4", children: [
    /* @__PURE__ */ e("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: a }),
    /* @__PURE__ */ e("div", { className: "ct-text-2xl ct-font-bold ct-text-[hsl(var(--cedros-foreground))]", children: c })
  ] });
}
function O({ pluginContext: a }) {
  const [c, l] = u([]), d = new A(a.serverUrl, a.getAccessToken);
  w(() => {
    d.getProviders().then(l).catch(() => {
    });
  }, []);
  const m = S(async (o, g) => {
    const n = `${a.serverUrl}/admin/providers/${o}/${g ? "enable" : "disable"}`;
    await fetch(n, {
      method: "POST",
      headers: { Authorization: `Bearer ${a.getAccessToken()}` }
    }), d.getProviders().then(l);
  }, [a]);
  return /* @__PURE__ */ s("div", { className: "ct-space-y-4", children: [
    /* @__PURE__ */ e("h2", { className: "ct-text-xl ct-font-semibold", children: "Swap Providers" }),
    /* @__PURE__ */ e("div", { className: "ct-grid ct-gap-4", children: c.map((o) => /* @__PURE__ */ s("div", { className: "ct-bg-[hsl(var(--cedros-muted))] ct-rounded-cedros ct-p-4 ct-flex ct-items-center ct-justify-between", children: [
      /* @__PURE__ */ s("div", { children: [
        /* @__PURE__ */ e("div", { className: "ct-font-medium ct-text-[hsl(var(--cedros-foreground))] ct-capitalize", children: o.name }),
        /* @__PURE__ */ s("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))] ct-space-x-2", children: [
          /* @__PURE__ */ e("span", { children: o.health.healthy ? "● Healthy" : "○ Unhealthy" }),
          o.health.latencyMs && /* @__PURE__ */ s("span", { children: [
            o.health.latencyMs,
            "ms"
          ] }),
          o.capabilities.gasless && /* @__PURE__ */ e("span", { children: "Gasless" }),
          o.capabilities.mevProtected && /* @__PURE__ */ e("span", { children: "MEV-protected" })
        ] }),
        o.health.error && /* @__PURE__ */ e("div", { className: "ct-text-xs ct-text-red-400 ct-mt-1", children: o.health.error })
      ] }),
      /* @__PURE__ */ e(
        "button",
        {
          onClick: () => m(o.name, !o.enabled),
          className: `ct-px-3 ct-py-1.5 ct-rounded ct-text-xs ct-font-medium ${o.enabled ? "ct-bg-green-500/10 ct-text-green-400" : "ct-bg-red-500/10 ct-text-red-400"}`,
          children: o.enabled ? "Enabled" : "Disabled"
        }
      )
    ] }, o.name)) })
  ] });
}
const T = {
  mint: "",
  symbol: "",
  name: "",
  decimals: "9",
  logoUrl: "",
  coingeckoId: "",
  categories: ""
};
function M({ pluginContext: a }) {
  const [c, l] = u([]), [d, m] = u(""), [o, g] = u(!1), [n, v] = u(null), [r, i] = u(T), [P, y] = u(null), k = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${a.getAccessToken()}`
  }, p = a.serverUrl, f = S(() => {
    fetch(`${p}/admin/tokens`, { headers: k }).then((t) => t.json()).then((t) => l(t.tokens ?? [])).catch(() => {
    });
  }, [p]);
  w(() => {
    f();
  }, [f]);
  const C = async () => {
    var N;
    y(null);
    const t = {
      mint: r.mint,
      symbol: r.symbol,
      name: r.name,
      decimals: parseInt(r.decimals) || 9,
      logoUrl: r.logoUrl || void 0,
      coingeckoId: r.coingeckoId || void 0,
      categories: r.categories ? r.categories.split(",").map((x) => x.trim()) : []
    }, h = await fetch(`${p}/admin/tokens`, { method: "POST", headers: k, body: JSON.stringify(t) });
    if (!h.ok) {
      const x = await h.json().catch(() => ({}));
      y(((N = x.error) == null ? void 0 : N.message) ?? "Failed");
      return;
    }
    i(T), g(!1), f();
  }, U = async () => {
    var N;
    if (!n) return;
    y(null);
    const t = {};
    r.name && (t.name = r.name), r.symbol && (t.symbol = r.symbol), r.logoUrl && (t.logoUrl = r.logoUrl), r.coingeckoId && (t.coingeckoId = r.coingeckoId), r.categories && (t.categories = r.categories.split(",").map((x) => x.trim()));
    const h = await fetch(`${p}/admin/tokens/${n}`, { method: "PATCH", headers: k, body: JSON.stringify(t) });
    if (!h.ok) {
      const x = await h.json().catch(() => ({}));
      y(((N = x.error) == null ? void 0 : N.message) ?? "Failed");
      return;
    }
    v(null), i(T), f();
  }, E = async (t, h) => {
    confirm(`Delete ${h} (${t.slice(0, 8)}...)?`) && (await fetch(`${p}/admin/tokens/${t}`, { method: "DELETE", headers: k }), f());
  }, I = (t) => {
    v(t.mint), i({ mint: t.mint, symbol: t.symbol, name: t.name, decimals: String(t.decimals), logoUrl: t.logoUrl ?? "", coingeckoId: t.coingeckoId ?? "", categories: t.categories.join(", ") }), g(!1);
  }, j = c.filter(
    (t) => !d || t.symbol.toLowerCase().includes(d.toLowerCase()) || t.name.toLowerCase().includes(d.toLowerCase())
  );
  return /* @__PURE__ */ s("div", { className: "ct-space-y-4", children: [
    /* @__PURE__ */ s("div", { className: "ct-flex ct-items-center ct-justify-between", children: [
      /* @__PURE__ */ e("h2", { className: "ct-text-xl ct-font-semibold", children: "Token Registry" }),
      /* @__PURE__ */ s("div", { className: "ct-flex ct-items-center ct-gap-2", children: [
        /* @__PURE__ */ s("span", { className: "ct-text-sm ct-text-[hsl(var(--cedros-muted-foreground))]", children: [
          c.length,
          " tokens"
        ] }),
        /* @__PURE__ */ e(
          "button",
          {
            onClick: () => {
              g(!o), v(null), i(T);
            },
            className: "ct-px-3 ct-py-1.5 ct-rounded ct-text-xs ct-font-medium ct-bg-[hsl(var(--cedros-primary))] ct-text-[hsl(var(--cedros-primary-foreground))]",
            children: o ? "Cancel" : "+ Add Token"
          }
        )
      ] })
    ] }),
    (o || n) && /* @__PURE__ */ s("div", { className: "ct-bg-[hsl(var(--cedros-muted))] ct-rounded-cedros ct-p-4 ct-space-y-3", children: [
      /* @__PURE__ */ e("h3", { className: "ct-text-sm ct-font-medium", children: n ? `Edit ${r.symbol}` : "Add Token" }),
      P && /* @__PURE__ */ e("div", { className: "ct-text-xs ct-text-red-400", children: P }),
      /* @__PURE__ */ s("div", { className: "ct-grid ct-grid-cols-2 ct-gap-2", children: [
        !n && /* @__PURE__ */ e(
          "input",
          {
            value: r.mint,
            onChange: (t) => i({ ...r, mint: t.target.value }),
            placeholder: "Mint address",
            className: "ct-col-span-2 ct-px-2 ct-py-1.5 ct-text-sm ct-rounded ct-bg-[hsl(var(--cedros-background))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
          }
        ),
        /* @__PURE__ */ e(
          "input",
          {
            value: r.symbol,
            onChange: (t) => i({ ...r, symbol: t.target.value }),
            placeholder: "Symbol (e.g. SOL)",
            className: "ct-px-2 ct-py-1.5 ct-text-sm ct-rounded ct-bg-[hsl(var(--cedros-background))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
          }
        ),
        /* @__PURE__ */ e(
          "input",
          {
            value: r.name,
            onChange: (t) => i({ ...r, name: t.target.value }),
            placeholder: "Name (e.g. Solana)",
            className: "ct-px-2 ct-py-1.5 ct-text-sm ct-rounded ct-bg-[hsl(var(--cedros-background))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
          }
        ),
        /* @__PURE__ */ e(
          "input",
          {
            value: r.decimals,
            onChange: (t) => i({ ...r, decimals: t.target.value }),
            placeholder: "Decimals",
            className: "ct-px-2 ct-py-1.5 ct-text-sm ct-rounded ct-bg-[hsl(var(--cedros-background))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
          }
        ),
        /* @__PURE__ */ e(
          "input",
          {
            value: r.logoUrl,
            onChange: (t) => i({ ...r, logoUrl: t.target.value }),
            placeholder: "Logo URL",
            className: "ct-px-2 ct-py-1.5 ct-text-sm ct-rounded ct-bg-[hsl(var(--cedros-background))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
          }
        ),
        /* @__PURE__ */ e(
          "input",
          {
            value: r.coingeckoId,
            onChange: (t) => i({ ...r, coingeckoId: t.target.value }),
            placeholder: "CoinGecko ID",
            className: "ct-px-2 ct-py-1.5 ct-text-sm ct-rounded ct-bg-[hsl(var(--cedros-background))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
          }
        ),
        /* @__PURE__ */ e(
          "input",
          {
            value: r.categories,
            onChange: (t) => i({ ...r, categories: t.target.value }),
            placeholder: "Categories (comma-separated)",
            className: "ct-px-2 ct-py-1.5 ct-text-sm ct-rounded ct-bg-[hsl(var(--cedros-background))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
          }
        )
      ] }),
      /* @__PURE__ */ e(
        "button",
        {
          onClick: n ? U : C,
          className: "ct-px-4 ct-py-2 ct-rounded ct-text-sm ct-font-medium ct-bg-[hsl(var(--cedros-primary))] ct-text-[hsl(var(--cedros-primary-foreground))]",
          children: n ? "Save Changes" : "Add Token"
        }
      )
    ] }),
    /* @__PURE__ */ e(
      "input",
      {
        type: "text",
        value: d,
        onChange: (t) => m(t.target.value),
        placeholder: "Search tokens...",
        className: "ct-w-full ct-px-3 ct-py-2 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
      }
    ),
    /* @__PURE__ */ s("table", { className: "ct-w-full ct-text-sm", children: [
      /* @__PURE__ */ e("thead", { children: /* @__PURE__ */ s("tr", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))] ct-border-b ct-border-[hsl(var(--cedros-border))]", children: [
        /* @__PURE__ */ e("th", { className: "ct-text-left ct-py-2", children: "Token" }),
        /* @__PURE__ */ e("th", { className: "ct-text-left ct-py-2", children: "Mint" }),
        /* @__PURE__ */ e("th", { className: "ct-text-left ct-py-2", children: "Dec" }),
        /* @__PURE__ */ e("th", { className: "ct-text-left ct-py-2", children: "Categories" }),
        /* @__PURE__ */ e("th", { className: "ct-text-right ct-py-2", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ e("tbody", { children: j.map((t) => /* @__PURE__ */ s("tr", { className: "ct-border-b ct-border-[hsl(var(--cedros-border))]", children: [
        /* @__PURE__ */ s("td", { className: "ct-py-2 ct-flex ct-items-center ct-gap-2", children: [
          t.logoUrl && /* @__PURE__ */ e("img", { src: t.logoUrl, className: "ct-w-5 ct-h-5 ct-rounded-full", alt: "" }),
          /* @__PURE__ */ e("span", { className: "ct-font-medium", children: t.symbol }),
          /* @__PURE__ */ e("span", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: t.name })
        ] }),
        /* @__PURE__ */ s("td", { className: "ct-py-2 ct-font-mono ct-text-xs", children: [
          t.mint.slice(0, 8),
          "..."
        ] }),
        /* @__PURE__ */ e("td", { className: "ct-py-2", children: t.decimals }),
        /* @__PURE__ */ e("td", { className: "ct-py-2 ct-space-x-1", children: t.categories.map((h) => /* @__PURE__ */ e("span", { className: "ct-px-2 ct-py-0.5 ct-rounded ct-text-xs ct-bg-[hsl(var(--cedros-muted))]", children: h }, h)) }),
        /* @__PURE__ */ s("td", { className: "ct-py-2 ct-text-right ct-space-x-2", children: [
          /* @__PURE__ */ e("button", { onClick: () => I(t), className: "ct-text-xs ct-text-blue-400 hover:ct-text-blue-300", children: "Edit" }),
          /* @__PURE__ */ e("button", { onClick: () => E(t.mint, t.symbol), className: "ct-text-xs ct-text-red-400 hover:ct-text-red-300", children: "Delete" })
        ] })
      ] }, t.mint)) })
    ] })
  ] });
}
function L({ pluginContext: a }) {
  const [c, l] = u(null), d = { Authorization: `Bearer ${a.getAccessToken()}` }, m = a.serverUrl, o = S(() => {
    fetch(`${m}/admin/monitor/status`, { headers: d }).then((v) => v.json()).then(l).catch(() => {
    });
  }, [m]);
  w(() => {
    o();
    const v = setInterval(o, 5e3);
    return () => clearInterval(v);
  }, [o]);
  const g = () => fetch(`${m}/admin/monitor/pause`, { method: "POST", headers: d }).then(o), n = () => fetch(`${m}/admin/monitor/resume`, { method: "POST", headers: d }).then(o);
  return /* @__PURE__ */ s("div", { className: "ct-space-y-4", children: [
    /* @__PURE__ */ s("div", { className: "ct-flex ct-items-center ct-justify-between", children: [
      /* @__PURE__ */ e("h2", { className: "ct-text-xl ct-font-semibold", children: "Price Monitor" }),
      c && /* @__PURE__ */ e("div", { className: "ct-flex ct-gap-2", children: c.paused ? /* @__PURE__ */ e("button", { onClick: n, className: "ct-px-3 ct-py-1.5 ct-rounded ct-text-xs ct-font-medium ct-bg-green-500/10 ct-text-green-400", children: "Resume" }) : /* @__PURE__ */ e("button", { onClick: g, className: "ct-px-3 ct-py-1.5 ct-rounded ct-text-xs ct-font-medium ct-bg-red-500/10 ct-text-red-400", children: "Pause" }) })
    ] }),
    c && /* @__PURE__ */ s("div", { className: "ct-grid ct-grid-cols-2 lg:ct-grid-cols-4 ct-gap-4", children: [
      /* @__PURE__ */ s("div", { className: "ct-bg-[hsl(var(--cedros-muted))] ct-rounded-cedros ct-p-4", children: [
        /* @__PURE__ */ e("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Active Orders" }),
        /* @__PURE__ */ e("div", { className: "ct-text-2xl ct-font-bold", children: c.activeOrders })
      ] }),
      /* @__PURE__ */ s("div", { className: "ct-bg-[hsl(var(--cedros-muted))] ct-rounded-cedros ct-p-4", children: [
        /* @__PURE__ */ e("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Poll Interval" }),
        /* @__PURE__ */ s("div", { className: "ct-text-2xl ct-font-bold", children: [
          c.pollIntervalMs,
          "ms"
        ] })
      ] }),
      /* @__PURE__ */ s("div", { className: "ct-bg-[hsl(var(--cedros-muted))] ct-rounded-cedros ct-p-4", children: [
        /* @__PURE__ */ e("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Total Executions" }),
        /* @__PURE__ */ e("div", { className: "ct-text-2xl ct-font-bold", children: c.totalExecutions })
      ] }),
      /* @__PURE__ */ s("div", { className: "ct-bg-[hsl(var(--cedros-muted))] ct-rounded-cedros ct-p-4", children: [
        /* @__PURE__ */ e("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Status" }),
        /* @__PURE__ */ e("div", { className: `ct-text-2xl ct-font-bold ${c.paused ? "ct-text-yellow-400" : "ct-text-green-400"}`, children: c.paused ? "Paused" : "Running" })
      ] })
    ] })
  ] });
}
const H = {
  id: "cedros-trade",
  name: "Cedros Trade",
  version: "0.1.0",
  cssNamespace: "cedros-trade-admin",
  groups: [
    { id: "trading", label: "Trading", order: 1 }
  ],
  sections: [
    { id: "overview", label: "Overview", group: "trading", order: 0 },
    { id: "providers", label: "Swap Providers", group: "trading", order: 1 },
    { id: "tokens", label: "Token Registry", group: "trading", order: 2 },
    { id: "monitor", label: "Monitor", group: "trading", order: 3 },
    { id: "settings-trade", label: "Trade Settings", group: "Configuration", order: 12 }
  ],
  components: {
    overview: $,
    providers: O,
    tokens: M,
    monitor: L,
    "settings-trade": $
    // Reuses overview for settings (can be expanded)
  },
  createPluginContext: (a) => {
    var c, l;
    return {
      serverUrl: ((c = a.cedrosTrade) == null ? void 0 : c.serverUrl) ?? "",
      getAccessToken: ((l = a.cedrosLogin) == null ? void 0 : l.getAccessToken) ?? (() => null)
    };
  },
  checkPermission: (a, c) => {
    var l, d;
    return ((d = (l = c.org) == null ? void 0 : l.permissions) == null ? void 0 : d.includes(a)) ?? !0;
  }
};
export {
  H as cedrosTradePlugin
};
