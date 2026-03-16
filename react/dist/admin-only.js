import { jsxs as c, jsx as e } from "react/jsx-runtime";
import { useState as m, useEffect as u, useCallback as g } from "react";
import { T as v } from "./apiClient-Pid_ZEt8.js";
function x({ pluginContext: r }) {
  const [t, l] = m(null), [d, n] = m(null);
  return u(() => {
    new v(r.serverUrl, r.getAccessToken).getHealth().then(n).catch(() => {
    }), fetch(`${r.serverUrl}/admin/stats`, {
      headers: { Authorization: `Bearer ${r.getAccessToken()}` }
    }).then((o) => o.json()).then(l).catch(() => {
    });
  }, [r]), /* @__PURE__ */ c("div", { className: "ct-space-y-6", children: [
    /* @__PURE__ */ e("h2", { className: "ct-text-xl ct-font-semibold", children: "Trade Overview" }),
    /* @__PURE__ */ c("div", { className: "ct-grid ct-grid-cols-2 lg:ct-grid-cols-4 ct-gap-4", children: [
      /* @__PURE__ */ e(h, { label: "Total Quotes", value: (t == null ? void 0 : t.totalQuotes) ?? 0 }),
      /* @__PURE__ */ e(h, { label: "Total Swaps", value: (t == null ? void 0 : t.totalSwaps) ?? 0 }),
      /* @__PURE__ */ e(h, { label: "Cache Hit Ratio", value: `${(((t == null ? void 0 : t.cacheHitRatio) ?? 0) * 100).toFixed(1)}%` }),
      /* @__PURE__ */ e(h, { label: "Service Status", value: (d == null ? void 0 : d.status) ?? "unknown" })
    ] }),
    (t == null ? void 0 : t.executions) && /* @__PURE__ */ c("div", { className: "ct-grid ct-grid-cols-2 ct-gap-4", children: [
      /* @__PURE__ */ e(h, { label: "Executions Succeeded", value: t.executions.succeeded }),
      /* @__PURE__ */ e(h, { label: "Executions Failed", value: t.executions.failed })
    ] })
  ] });
}
function h({ label: r, value: t }) {
  return /* @__PURE__ */ c("div", { className: "ct-bg-[hsl(var(--cedros-muted))] ct-rounded-cedros ct-p-4", children: [
    /* @__PURE__ */ e("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: r }),
    /* @__PURE__ */ e("div", { className: "ct-text-2xl ct-font-bold ct-text-[hsl(var(--cedros-foreground))]", children: t })
  ] });
}
function b({ pluginContext: r }) {
  const [t, l] = m([]), d = new v(r.serverUrl, r.getAccessToken);
  u(() => {
    d.getProviders().then(l).catch(() => {
    });
  }, []);
  const n = g(async (s, o) => {
    const a = `${r.serverUrl}/admin/providers/${s}/${o ? "enable" : "disable"}`;
    await fetch(a, {
      method: "POST",
      headers: { Authorization: `Bearer ${r.getAccessToken()}` }
    }), d.getProviders().then(l);
  }, [r]);
  return /* @__PURE__ */ c("div", { className: "ct-space-y-4", children: [
    /* @__PURE__ */ e("h2", { className: "ct-text-xl ct-font-semibold", children: "Swap Providers" }),
    /* @__PURE__ */ e("div", { className: "ct-grid ct-gap-4", children: t.map((s) => /* @__PURE__ */ c("div", { className: "ct-bg-[hsl(var(--cedros-muted))] ct-rounded-cedros ct-p-4 ct-flex ct-items-center ct-justify-between", children: [
      /* @__PURE__ */ c("div", { children: [
        /* @__PURE__ */ e("div", { className: "ct-font-medium ct-text-[hsl(var(--cedros-foreground))] ct-capitalize", children: s.name }),
        /* @__PURE__ */ c("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))] ct-space-x-2", children: [
          /* @__PURE__ */ e("span", { children: s.health.healthy ? "● Healthy" : "○ Unhealthy" }),
          s.health.latencyMs && /* @__PURE__ */ c("span", { children: [
            s.health.latencyMs,
            "ms"
          ] }),
          s.capabilities.gasless && /* @__PURE__ */ e("span", { children: "Gasless" }),
          s.capabilities.mevProtected && /* @__PURE__ */ e("span", { children: "MEV-protected" })
        ] }),
        s.health.error && /* @__PURE__ */ e("div", { className: "ct-text-xs ct-text-red-400 ct-mt-1", children: s.health.error })
      ] }),
      /* @__PURE__ */ e(
        "button",
        {
          onClick: () => n(s.name, !s.enabled),
          className: `ct-px-3 ct-py-1.5 ct-rounded ct-text-xs ct-font-medium ${s.enabled ? "ct-bg-green-500/10 ct-text-green-400" : "ct-bg-red-500/10 ct-text-red-400"}`,
          children: s.enabled ? "Enabled" : "Disabled"
        }
      )
    ] }, s.name)) })
  ] });
}
function p({ pluginContext: r }) {
  const [t, l] = m([]), [d, n] = m(""), s = new v(r.serverUrl, r.getAccessToken);
  u(() => {
    s.getTokens().then((a) => l(a.tokens)).catch(() => {
    });
  }, []);
  const o = t.filter(
    (a) => !d || a.symbol.toLowerCase().includes(d.toLowerCase()) || a.name.toLowerCase().includes(d.toLowerCase())
  );
  return /* @__PURE__ */ c("div", { className: "ct-space-y-4", children: [
    /* @__PURE__ */ c("div", { className: "ct-flex ct-items-center ct-justify-between", children: [
      /* @__PURE__ */ e("h2", { className: "ct-text-xl ct-font-semibold", children: "Token Registry" }),
      /* @__PURE__ */ c("span", { className: "ct-text-sm ct-text-[hsl(var(--cedros-muted-foreground))]", children: [
        t.length,
        " tokens"
      ] })
    ] }),
    /* @__PURE__ */ e(
      "input",
      {
        type: "text",
        value: d,
        onChange: (a) => n(a.target.value),
        placeholder: "Search tokens...",
        className: "ct-w-full ct-px-3 ct-py-2 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
      }
    ),
    /* @__PURE__ */ c("table", { className: "ct-w-full ct-text-sm", children: [
      /* @__PURE__ */ e("thead", { children: /* @__PURE__ */ c("tr", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))] ct-border-b ct-border-[hsl(var(--cedros-border))]", children: [
        /* @__PURE__ */ e("th", { className: "ct-text-left ct-py-2", children: "Token" }),
        /* @__PURE__ */ e("th", { className: "ct-text-left ct-py-2", children: "Mint" }),
        /* @__PURE__ */ e("th", { className: "ct-text-left ct-py-2", children: "Decimals" }),
        /* @__PURE__ */ e("th", { className: "ct-text-left ct-py-2", children: "Categories" })
      ] }) }),
      /* @__PURE__ */ e("tbody", { children: o.map((a) => /* @__PURE__ */ c("tr", { className: "ct-border-b ct-border-[hsl(var(--cedros-border))]", children: [
        /* @__PURE__ */ c("td", { className: "ct-py-2 ct-flex ct-items-center ct-gap-2", children: [
          a.logoUrl && /* @__PURE__ */ e("img", { src: a.logoUrl, className: "ct-w-5 ct-h-5 ct-rounded-full", alt: "" }),
          /* @__PURE__ */ e("span", { className: "ct-font-medium", children: a.symbol }),
          /* @__PURE__ */ e("span", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: a.name })
        ] }),
        /* @__PURE__ */ c("td", { className: "ct-py-2 ct-font-mono ct-text-xs", children: [
          a.mint.slice(0, 8),
          "..."
        ] }),
        /* @__PURE__ */ e("td", { className: "ct-py-2", children: a.decimals }),
        /* @__PURE__ */ e("td", { className: "ct-py-2 ct-space-x-1", children: a.categories.map((i) => /* @__PURE__ */ e("span", { className: "ct-px-2 ct-py-0.5 ct-rounded ct-text-xs ct-bg-[hsl(var(--cedros-muted))]", children: i }, i)) })
      ] }, a.mint)) })
    ] })
  ] });
}
function f({ pluginContext: r }) {
  const [t, l] = m(null), d = { Authorization: `Bearer ${r.getAccessToken()}` }, n = r.serverUrl, s = g(() => {
    fetch(`${n}/admin/monitor/status`, { headers: d }).then((i) => i.json()).then(l).catch(() => {
    });
  }, [n]);
  u(() => {
    s();
    const i = setInterval(s, 5e3);
    return () => clearInterval(i);
  }, [s]);
  const o = () => fetch(`${n}/admin/monitor/pause`, { method: "POST", headers: d }).then(s), a = () => fetch(`${n}/admin/monitor/resume`, { method: "POST", headers: d }).then(s);
  return /* @__PURE__ */ c("div", { className: "ct-space-y-4", children: [
    /* @__PURE__ */ c("div", { className: "ct-flex ct-items-center ct-justify-between", children: [
      /* @__PURE__ */ e("h2", { className: "ct-text-xl ct-font-semibold", children: "Price Monitor" }),
      t && /* @__PURE__ */ e("div", { className: "ct-flex ct-gap-2", children: t.paused ? /* @__PURE__ */ e("button", { onClick: a, className: "ct-px-3 ct-py-1.5 ct-rounded ct-text-xs ct-font-medium ct-bg-green-500/10 ct-text-green-400", children: "Resume" }) : /* @__PURE__ */ e("button", { onClick: o, className: "ct-px-3 ct-py-1.5 ct-rounded ct-text-xs ct-font-medium ct-bg-red-500/10 ct-text-red-400", children: "Pause" }) })
    ] }),
    t && /* @__PURE__ */ c("div", { className: "ct-grid ct-grid-cols-2 lg:ct-grid-cols-4 ct-gap-4", children: [
      /* @__PURE__ */ c("div", { className: "ct-bg-[hsl(var(--cedros-muted))] ct-rounded-cedros ct-p-4", children: [
        /* @__PURE__ */ e("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Active Orders" }),
        /* @__PURE__ */ e("div", { className: "ct-text-2xl ct-font-bold", children: t.activeOrders })
      ] }),
      /* @__PURE__ */ c("div", { className: "ct-bg-[hsl(var(--cedros-muted))] ct-rounded-cedros ct-p-4", children: [
        /* @__PURE__ */ e("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Poll Interval" }),
        /* @__PURE__ */ c("div", { className: "ct-text-2xl ct-font-bold", children: [
          t.pollIntervalMs,
          "ms"
        ] })
      ] }),
      /* @__PURE__ */ c("div", { className: "ct-bg-[hsl(var(--cedros-muted))] ct-rounded-cedros ct-p-4", children: [
        /* @__PURE__ */ e("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Total Executions" }),
        /* @__PURE__ */ e("div", { className: "ct-text-2xl ct-font-bold", children: t.totalExecutions })
      ] }),
      /* @__PURE__ */ c("div", { className: "ct-bg-[hsl(var(--cedros-muted))] ct-rounded-cedros ct-p-4", children: [
        /* @__PURE__ */ e("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Status" }),
        /* @__PURE__ */ e("div", { className: `ct-text-2xl ct-font-bold ${t.paused ? "ct-text-yellow-400" : "ct-text-green-400"}`, children: t.paused ? "Paused" : "Running" })
      ] })
    ] })
  ] });
}
const k = {
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
    overview: x,
    providers: b,
    tokens: p,
    monitor: f,
    "settings-trade": x
    // Reuses overview for settings (can be expanded)
  },
  createPluginContext: (r) => {
    var t, l;
    return {
      serverUrl: ((t = r.cedrosTrade) == null ? void 0 : t.serverUrl) ?? "",
      getAccessToken: ((l = r.cedrosLogin) == null ? void 0 : l.getAccessToken) ?? (() => null)
    };
  },
  checkPermission: (r, t) => {
    var l, d;
    return ((d = (l = t.org) == null ? void 0 : l.permissions) == null ? void 0 : d.includes(r)) ?? !0;
  }
};
export {
  k as cedrosTradePlugin
};
