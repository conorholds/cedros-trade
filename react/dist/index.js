import { jsx as m, jsxs as b, Fragment as Ts } from "react/jsx-runtime";
import { createContext as Ps, useMemo as Qt, useContext as $s, useState as M, useCallback as C, useEffect as X, useRef as lt } from "react";
import { T as Vs } from "./apiClient-Pid_ZEt8.js";
import { a as Kh } from "./apiClient-Pid_ZEt8.js";
const Xi = Ps(null);
function $h({ config: n, children: t }) {
  const e = Qt(() => ({
    api: new Vs(n.serverUrl, n.getAccessToken, n.apiKey),
    config: n
  }), [n.serverUrl, n.apiKey]);
  return /* @__PURE__ */ m(Xi.Provider, { value: e, children: t });
}
function Hi() {
  const n = $s(Xi);
  if (!n)
    throw new Error("useTradeContext must be used within <CedrosTradeProvider>");
  return n;
}
function it() {
  return Hi().api;
}
function Rs() {
  const n = it(), [t, e] = M(null), [i, s] = M(null), [r, h] = M(null), [o, l] = M(!1), [c, a] = M(null), u = C(async (g, y, x, _) => {
    l(!0), a(null);
    try {
      const S = await n.getQuote({ inputMint: g, outputMint: y, amount: x, slippageBps: _ });
      return e(S), S;
    } catch (S) {
      throw a(S.message), S;
    } finally {
      l(!1);
    }
  }, [n]), d = C(async (g, y) => {
    l(!0), a(null);
    try {
      const x = await n.buildSwap(g, y);
      return s(x), x;
    } catch (x) {
      throw a(x.message), x;
    } finally {
      l(!1);
    }
  }, [n]), p = C(async (g, y, x) => {
    l(!0), a(null);
    try {
      const _ = await n.executeSwap(g, y, x);
      return h(_), _;
    } catch (_) {
      throw a(_.message), _;
    } finally {
      l(!1);
    }
  }, [n]), f = C(async (g, y, x) => {
    l(!0), a(null);
    try {
      return await n.compareQuotes(g, y, x);
    } catch (_) {
      throw a(_.message), _;
    } finally {
      l(!1);
    }
  }, [n]), v = C(() => {
    e(null), s(null), h(null), a(null);
  }, []);
  return { quote: t, transaction: i, result: r, isLoading: o, error: c, getQuote: u, buildTransaction: d, execute: p, compareProviders: f, reset: v };
}
function Os() {
  const n = it(), [t, e] = M(null), [i, s] = M(null), [r, h] = M(!1), [o, l] = M(null), c = C(async (p, f, v, g, y) => {
    h(!0), l(null);
    try {
      const x = await n.buildTransfer({ sender: p, recipient: f, mint: v, amount: g, memo: y });
      return e(x), x;
    } catch (x) {
      throw l(x.message), x;
    } finally {
      h(!1);
    }
  }, [n]), a = C(async (p) => {
    h(!0), l(null);
    try {
      const f = await n.executeTransfer(p);
      return s(f), f;
    } catch (f) {
      throw l(f.message), f;
    } finally {
      h(!1);
    }
  }, [n]), u = C(async (p) => n.resolveAddress(p), [n]), d = C(() => {
    e(null), s(null), l(null);
  }, []);
  return { buildResult: t, executeResult: i, isLoading: r, error: o, build: c, execute: a, resolveAddress: u, reset: d };
}
function Ui(n) {
  const t = it(), [e, i] = M(null), [s, r] = M(!1), [h, o] = M(null), l = C(async () => {
    if (n) {
      r(!0), o(null);
      try {
        i(await t.getPositions(n));
      } catch (c) {
        o(c.message);
      } finally {
        r(!1);
      }
    }
  }, [t, n]);
  return X(() => {
    l();
  }, [l]), { positions: e, isLoading: s, error: h, refresh: l };
}
function Ws(n) {
  const t = it(), [e, i] = M([]), [s, r] = M([]), [h, o] = M(!1), [l, c] = M(null), a = C(async () => {
    if (n) {
      o(!0), c(null);
      try {
        const d = await t.getOpenOrders(n);
        i(d.limitOrders), r(d.dcaOrders);
      } catch (d) {
        c(d.message);
      } finally {
        o(!1);
      }
    }
  }, [t, n]);
  X(() => {
    a();
  }, [a]);
  const u = C(async (d, p) => {
    const f = await t.cancelOrder(d, p);
    return await a(), f;
  }, [t, a]);
  return { limitOrders: e, dcaOrders: s, isLoading: h, error: l, refresh: a, cancelOrder: u };
}
function Vh() {
  const n = it(), [t, e] = M({}), [i, s] = M(!1), [r, h] = M(null), o = lt(/* @__PURE__ */ new Set()), l = lt(), c = C(async () => {
    const p = Array.from(o.current);
    if (p.length !== 0)
      try {
        const { prices: f } = await n.getBatchPrices(p);
        e((v) => {
          const g = { ...v };
          for (const y of f) g[y.mint] = y;
          return g;
        });
      } catch (f) {
        h(f.message);
      }
  }, [n]), a = C((p) => {
    for (const f of p) o.current.add(f);
    c();
  }, [c]), u = C((p) => {
    for (const f of p) o.current.delete(f);
  }, []);
  X(() => (l.current = setInterval(c, 1e4), () => clearInterval(l.current)), [c]);
  const d = C(async (p) => {
    s(!0);
    try {
      const f = await n.getPrice(p);
      return e((v) => ({ ...v, [p]: f })), f;
    } catch (f) {
      throw h(f.message), f;
    } finally {
      s(!1);
    }
  }, [n]);
  return { prices: t, isLoading: i, error: r, getPrice: d, subscribe: a, unsubscribe: u };
}
function Ds() {
  const n = it(), [t, e] = M([]), [i, s] = M(!1), [r, h] = M(null), o = C(async () => {
    s(!0), h(null);
    try {
      const { tokens: a } = await n.getTokens();
      e(a);
    } catch (a) {
      h(a.message);
    } finally {
      s(!1);
    }
  }, [n]);
  X(() => {
    o();
  }, [o]);
  const l = C((a) => t.find((u) => u.mint === a), [t]), c = C((a) => {
    const u = a.toUpperCase();
    return t.find((d) => d.symbol.toUpperCase() === u);
  }, [t]);
  return { tokens: t, isLoading: i, error: r, refresh: o, getByMint: l, getBySymbol: c };
}
function Bs() {
  const n = it(), [t, e] = M(!1), [i, s] = M(null);
  C((c) => async () => {
    e(!0), s(null);
    try {
      return await c();
    } catch (a) {
      throw s(a.message), a;
    } finally {
      e(!1);
    }
  }, []);
  const r = C(async (c) => {
    e(!0), s(null);
    try {
      return await n.createLimitOrder(c);
    } catch (a) {
      throw s(a.message), a;
    } finally {
      e(!1);
    }
  }, [n]), h = C(async (c) => {
    e(!0), s(null);
    try {
      return await n.createStopLoss(c);
    } catch (a) {
      throw s(a.message), a;
    } finally {
      e(!1);
    }
  }, [n]), o = C(async (c) => {
    e(!0), s(null);
    try {
      return await n.createTakeProfit(c);
    } catch (a) {
      throw s(a.message), a;
    } finally {
      e(!1);
    }
  }, [n]), l = C(async (c) => {
    e(!0), s(null);
    try {
      return await n.createDca(c);
    } catch (a) {
      throw s(a.message), a;
    } finally {
      e(!1);
    }
  }, [n]);
  return { isLoading: t, error: i, createLimit: r, createStopLoss: h, createTakeProfit: o, createDca: l };
}
function qi(n) {
  const t = it(), [e, i] = M([]), [s, r] = M(!1), [h, o] = M(null);
  lt(null);
  const l = C(async () => {
    if (n) {
      r(!0), o(null);
      try {
        i(await t.getPendingActions(n));
      } catch (u) {
        o(u.message);
      } finally {
        r(!1);
      }
    }
  }, [t, n]);
  X(() => {
    if (!n) return;
    l();
    const u = setInterval(l, 1e4);
    return () => clearInterval(u);
  }, [n, l]);
  const c = C(async (u, d) => {
    await t.completeAction(u, d), await l();
  }, [t, l]), a = C(async (u) => {
    await t.dismissAction(u), await l();
  }, [t, l]);
  return {
    actions: e,
    count: e.length,
    isLoading: s,
    error: h,
    refresh: l,
    complete: c,
    dismiss: a
  };
}
function Is(n, t = !0) {
  const { config: e } = Hi(), [i, s] = M(null), [r, h] = M(!1), [o, l] = M(null), [c, a] = M(!1), u = lt(null), d = C(async () => {
    if (n) {
      h(!0);
      try {
        const p = await fetch(`${e.serverUrl}/orderbook/${n}`);
        if (!p.ok) throw new Error("Failed to fetch orderbook");
        s(await p.json());
      } catch (p) {
        l(p.message);
      } finally {
        h(!1);
      }
    }
  }, [e.serverUrl, n]);
  return X(() => {
    if (!n || !t) {
      d();
      return;
    }
    const p = e.serverUrl.replace(/^http/, "ws") + `/ws/orderbook/${n}`, f = new WebSocket(p);
    return u.current = f, f.onopen = () => a(!0), f.onmessage = (v) => {
      try {
        s(JSON.parse(v.data));
      } catch {
      }
    }, f.onerror = () => {
      a(!1), d();
    }, f.onclose = () => a(!1), () => {
      f.close(), u.current = null;
    };
  }, [n, t, e.serverUrl, d]), { data: i, isLoading: r, error: o, isStreaming: c };
}
function Ji({ isOpen: n, onClose: t, onSelect: e, excludeMints: i = [], className: s = "" }) {
  const { tokens: r } = Ds(), [h, o] = M(""), [l, c] = M(() => {
    try {
      return JSON.parse(localStorage.getItem("ct-favorite-tokens") || "[]");
    } catch {
      return [];
    }
  }), a = Qt(() => {
    const f = h.toLowerCase();
    return r.filter((v) => !i.includes(v.mint)).filter((v) => !f || v.symbol.toLowerCase().includes(f) || v.name.toLowerCase().includes(f) || v.mint.includes(f));
  }, [r, h, i]), u = Qt(
    () => r.filter((f) => l.includes(f.mint)),
    [r, l]
  ), d = C((f) => {
    c((v) => {
      const g = v.includes(f) ? v.filter((y) => y !== f) : [...v, f];
      return localStorage.setItem("ct-favorite-tokens", JSON.stringify(g)), g;
    });
  }, []), p = C((f) => {
    e(f), t(), o("");
  }, [e, t]);
  return X(() => {
    n && o("");
  }, [n]), n ? /* @__PURE__ */ m("div", { className: `ct-fixed ct-inset-0 ct-z-50 ct-flex ct-items-center ct-justify-center ct-bg-black/50 ${s}`, onClick: t, children: /* @__PURE__ */ b("div", { className: "ct-bg-[hsl(var(--cedros-background))] ct-border ct-border-[hsl(var(--cedros-border))] ct-rounded-cedros ct-w-full ct-max-w-md ct-max-h-[80vh] ct-flex ct-flex-col ct-shadow-xl", onClick: (f) => f.stopPropagation(), children: [
    /* @__PURE__ */ b("div", { className: "ct-flex ct-items-center ct-justify-between ct-px-4 ct-py-3 ct-border-b ct-border-[hsl(var(--cedros-border))]", children: [
      /* @__PURE__ */ m("h3", { className: "ct-text-lg ct-font-semibold ct-text-[hsl(var(--cedros-foreground))]", children: "Select Token" }),
      /* @__PURE__ */ m("button", { onClick: t, className: "ct-text-[hsl(var(--cedros-muted-foreground))] hover:ct-text-[hsl(var(--cedros-foreground))] ct-text-xl", children: "×" })
    ] }),
    /* @__PURE__ */ m("div", { className: "ct-px-4 ct-py-3", children: /* @__PURE__ */ m(
      "input",
      {
        type: "text",
        placeholder: "Search by name, symbol, or mint...",
        value: h,
        onChange: (f) => o(f.target.value),
        className: "ct-w-full ct-px-3 ct-py-2 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] ct-placeholder-[hsl(var(--cedros-muted-foreground))] ct-outline-none focus:ct-ring-2 focus:ct-ring-[hsl(var(--cedros-ring))]",
        autoFocus: !0
      }
    ) }),
    u.length > 0 && !h && /* @__PURE__ */ m("div", { className: "ct-px-4 ct-pb-2 ct-flex ct-flex-wrap ct-gap-2", children: u.map((f) => /* @__PURE__ */ m(
      "button",
      {
        onClick: () => p(f),
        className: "ct-px-3 ct-py-1 ct-rounded-full ct-text-sm ct-bg-[hsl(var(--cedros-muted))] ct-text-[hsl(var(--cedros-foreground))] hover:ct-bg-[hsl(var(--cedros-primary))] hover:ct-text-[hsl(var(--cedros-primary-foreground))] ct-transition",
        children: f.symbol
      },
      f.mint
    )) }),
    /* @__PURE__ */ b("div", { className: "ct-flex-1 ct-overflow-y-auto ct-px-2 ct-pb-2", children: [
      a.map((f) => /* @__PURE__ */ b(
        "button",
        {
          onClick: () => p(f),
          className: "ct-w-full ct-flex ct-items-center ct-gap-3 ct-px-3 ct-py-2 ct-rounded-cedros hover:ct-bg-[hsl(var(--cedros-muted))] ct-transition ct-text-left",
          children: [
            f.logoUrl && /* @__PURE__ */ m("img", { src: f.logoUrl, alt: f.symbol, className: "ct-w-8 ct-h-8 ct-rounded-full" }),
            /* @__PURE__ */ b("div", { className: "ct-flex-1 ct-min-w-0", children: [
              /* @__PURE__ */ m("div", { className: "ct-font-medium ct-text-[hsl(var(--cedros-foreground))]", children: f.symbol }),
              /* @__PURE__ */ m("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))] ct-truncate", children: f.name })
            ] }),
            /* @__PURE__ */ m(
              "button",
              {
                onClick: (v) => {
                  v.stopPropagation(), d(f.mint);
                },
                className: "ct-text-lg ct-text-[hsl(var(--cedros-muted-foreground))] hover:ct-text-yellow-400",
                children: l.includes(f.mint) ? "★" : "☆"
              }
            )
          ]
        },
        f.mint
      )),
      a.length === 0 && /* @__PURE__ */ m("div", { className: "ct-text-center ct-py-8 ct-text-[hsl(var(--cedros-muted-foreground))]", children: "No tokens found" })
    ] })
  ] }) }) : null;
}
const qe = [
  { label: "0.1%", bps: 10 },
  { label: "0.5%", bps: 50 },
  { label: "1.0%", bps: 100 }
];
function Gi({ value: n, onChange: t, className: e = "" }) {
  const [i, s] = M(!qe.some((l) => l.bps === n)), [r, h] = M(i ? (n / 100).toString() : ""), o = (l) => {
    h(l);
    const c = parseFloat(l);
    !isNaN(c) && c > 0 && c <= 50 && t(Math.round(c * 100));
  };
  return /* @__PURE__ */ b("div", { className: `ct-flex ct-items-center ct-gap-2 ${e}`, children: [
    /* @__PURE__ */ m("span", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Slippage" }),
    /* @__PURE__ */ b("div", { className: "ct-flex ct-gap-1", children: [
      qe.map((l) => /* @__PURE__ */ m(
        "button",
        {
          onClick: () => {
            t(l.bps), s(!1);
          },
          className: `ct-px-2 ct-py-1 ct-rounded ct-text-xs ct-transition ${n === l.bps && !i ? "ct-bg-[hsl(var(--cedros-primary))] ct-text-[hsl(var(--cedros-primary-foreground))]" : "ct-bg-[hsl(var(--cedros-muted))] ct-text-[hsl(var(--cedros-muted-foreground))] hover:ct-bg-[hsl(var(--cedros-border))]"}`,
          children: l.label
        },
        l.bps
      )),
      /* @__PURE__ */ m(
        "input",
        {
          type: "text",
          placeholder: "Custom",
          value: i ? r : "",
          onFocus: () => s(!0),
          onChange: (l) => o(l.target.value),
          className: "ct-w-16 ct-px-2 ct-py-1 ct-rounded ct-text-xs ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] ct-outline-none focus:ct-ring-1 focus:ct-ring-[hsl(var(--cedros-ring))]"
        }
      ),
      /* @__PURE__ */ m("span", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "%" })
    ] })
  ] });
}
function bt({ className: n = "" }) {
  return /* @__PURE__ */ m("div", { className: `ct-inline-block ct-animate-spin ct-rounded-full ct-h-5 ct-w-5 ct-border-2 ct-border-current ct-border-t-transparent ${n}`, role: "status", children: /* @__PURE__ */ m("span", { className: "ct-sr-only", children: "Loading..." }) });
}
function te({ message: n, className: t = "", onDismiss: e }) {
  return n ? /* @__PURE__ */ b("div", { className: `ct-rounded-cedros ct-bg-red-500/10 ct-border ct-border-red-500/20 ct-px-3 ct-py-2 ct-text-sm ct-text-red-400 ct-flex ct-items-center ct-justify-between ${t}`, children: [
    /* @__PURE__ */ m("span", { children: n }),
    e && /* @__PURE__ */ m("button", { onClick: e, className: "ct-ml-2 ct-text-red-400 hover:ct-text-red-300 ct-text-lg ct-leading-none", children: "×" })
  ] }) : null;
}
const Fs = "So11111111111111111111111111111111111111112", js = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
function Ks({
  walletAddress: n,
  onSign: t,
  onSuccess: e,
  onError: i,
  defaultInputMint: s = Fs,
  defaultOutputMint: r = js,
  className: h = ""
}) {
  const { quote: o, isLoading: l, error: c, getQuote: a, buildTransaction: u, execute: d, reset: p } = Rs(), [f, v] = M(null), [g, y] = M(null), [x, _] = M(s), [S, E] = M(r), [z, T] = M(""), [N, W] = M(50), [R, J] = M(null), [$, j] = M("quote");
  X(() => {
    if (!z || !x || !S) return;
    const k = setTimeout(() => {
      a(x, S, z, N).catch(() => {
      });
    }, 500);
    return () => clearTimeout(k);
  }, [z, x, S, N, a]);
  const G = C(() => {
    _(S), E(x);
    const k = f;
    v(g), y(k), T(""), p();
  }, [x, S, f, g, p]), st = C((k) => {
    R === "input" ? (_(k.mint), v(k)) : (E(k.mint), y(k)), p();
  }, [R, p]), K = C(async () => {
    if (!(!o || !n || !t))
      try {
        j("sign");
        const k = await u(o, n), H = await t(k.transaction, o.provider, k.requestId ?? void 0), nt = await d(H, o.provider, k.requestId ?? void 0);
        j("done"), e == null || e(nt.signature);
      } catch (k) {
        j("quote"), i == null || i(k.message);
      }
  }, [o, n, t, u, d, e, i]), wt = (k) => {
    if (!k) return "";
    const H = (g == null ? void 0 : g.decimals) ?? 6;
    return (parseInt(k.outAmount) / Math.pow(10, H)).toFixed(H > 4 ? 4 : H);
  };
  return /* @__PURE__ */ b("div", { className: `ct-bg-[hsl(var(--cedros-background))] ct-border ct-border-[hsl(var(--cedros-border))] ct-rounded-cedros ct-p-4 ct-space-y-4 ${h}`, children: [
    /* @__PURE__ */ m("h3", { className: "ct-text-lg ct-font-semibold ct-text-[hsl(var(--cedros-foreground))]", children: "Swap" }),
    /* @__PURE__ */ b("div", { className: "ct-space-y-1", children: [
      /* @__PURE__ */ m("label", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "You pay" }),
      /* @__PURE__ */ b("div", { className: "ct-flex ct-gap-2", children: [
        /* @__PURE__ */ m(
          "input",
          {
            type: "text",
            value: z,
            onChange: (k) => T(k.target.value),
            placeholder: "0.00",
            className: "ct-flex-1 ct-px-3 ct-py-3 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-xl ct-text-[hsl(var(--cedros-foreground))] ct-outline-none focus:ct-ring-2 focus:ct-ring-[hsl(var(--cedros-ring))]"
          }
        ),
        /* @__PURE__ */ m(
          "button",
          {
            onClick: () => J("input"),
            className: "ct-px-4 ct-py-3 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] hover:ct-bg-[hsl(var(--cedros-border))] ct-font-medium ct-min-w-[100px]",
            children: (f == null ? void 0 : f.symbol) ?? "SOL"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ m("div", { className: "ct-flex ct-justify-center", children: /* @__PURE__ */ m(
      "button",
      {
        onClick: G,
        className: "ct-p-2 ct-rounded-full ct-bg-[hsl(var(--cedros-muted))] hover:ct-bg-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-muted-foreground))] ct-transition",
        children: "↕"
      }
    ) }),
    /* @__PURE__ */ b("div", { className: "ct-space-y-1", children: [
      /* @__PURE__ */ m("label", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "You receive" }),
      /* @__PURE__ */ b("div", { className: "ct-flex ct-gap-2", children: [
        /* @__PURE__ */ m("div", { className: "ct-flex-1 ct-px-3 ct-py-3 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-xl ct-text-[hsl(var(--cedros-foreground))]", children: l ? /* @__PURE__ */ m(bt, {}) : wt(o) }),
        /* @__PURE__ */ m(
          "button",
          {
            onClick: () => J("output"),
            className: "ct-px-4 ct-py-3 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] hover:ct-bg-[hsl(var(--cedros-border))] ct-font-medium ct-min-w-[100px]",
            children: (g == null ? void 0 : g.symbol) ?? "USDC"
          }
        )
      ] })
    ] }),
    o && /* @__PURE__ */ b("div", { className: "ct-space-y-1 ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: [
      /* @__PURE__ */ b("div", { className: "ct-flex ct-justify-between", children: [
        /* @__PURE__ */ m("span", { children: "Provider" }),
        /* @__PURE__ */ b("span", { className: "ct-capitalize", children: [
          o.provider,
          " ",
          o.gasless && "(gasless)"
        ] })
      ] }),
      /* @__PURE__ */ b("div", { className: "ct-flex ct-justify-between", children: [
        /* @__PURE__ */ m("span", { children: "Price impact" }),
        /* @__PURE__ */ b("span", { className: o.priceImpactPct > 1 ? "ct-text-red-400" : "", children: [
          o.priceImpactPct.toFixed(2),
          "%"
        ] })
      ] }),
      o.otherAmountThreshold && /* @__PURE__ */ b("div", { className: "ct-flex ct-justify-between", children: [
        /* @__PURE__ */ m("span", { children: "Min received" }),
        /* @__PURE__ */ m("span", { children: (parseInt(o.otherAmountThreshold) / Math.pow(10, (g == null ? void 0 : g.decimals) ?? 6)).toFixed(4) })
      ] })
    ] }),
    /* @__PURE__ */ m(Gi, { value: N, onChange: W }),
    /* @__PURE__ */ m(te, { message: c, onDismiss: p }),
    /* @__PURE__ */ m(
      "button",
      {
        onClick: K,
        disabled: !o || !n || l || $ !== "quote",
        className: "ct-w-full ct-py-3 ct-rounded-cedros ct-font-semibold ct-text-[hsl(var(--cedros-primary-foreground))] ct-bg-[hsl(var(--cedros-primary))] hover:ct-opacity-90 disabled:ct-opacity-50 disabled:ct-cursor-not-allowed ct-transition",
        children: n ? $ === "sign" ? "Signing..." : $ === "done" ? "Swap Complete" : l ? "Fetching Quote..." : o ? "Swap" : "Enter Amount" : "Connect Wallet"
      }
    ),
    /* @__PURE__ */ m(
      Ji,
      {
        isOpen: R !== null,
        onClose: () => J(null),
        onSelect: st,
        excludeMints: R === "input" ? [S] : [x]
      }
    )
  ] });
}
function Rh({ title: n = "Swap", ...t }) {
  return /* @__PURE__ */ m("div", { className: "ct-max-w-md ct-mx-auto ct-py-8 ct-px-4", children: /* @__PURE__ */ m(Ks, { ...t }) });
}
const As = "So11111111111111111111111111111111111111112";
function Xs({ walletAddress: n, onSign: t, onSuccess: e, onError: i, className: s = "" }) {
  const { buildResult: r, isLoading: h, error: o, build: l, execute: c, resolveAddress: a, reset: u } = Os(), [d, p] = M(""), [f, v] = M(""), [g, y] = M(null), [x, _] = M(As), [S, E] = M(!1), [z, T] = M(null), [N, W] = M("form");
  X(() => {
    if (!d.endsWith(".sol")) {
      T(null);
      return;
    }
    const $ = setTimeout(async () => {
      try {
        const j = await a(d);
        T(j.resolved);
      } catch {
        T(null);
      }
    }, 500);
    return () => clearTimeout($);
  }, [d, a]);
  const R = C(($) => {
    y($), _($.mint);
  }, []), J = C(async () => {
    if (!(!n || !t))
      try {
        W("sign");
        const $ = (g == null ? void 0 : g.decimals) ?? 9, j = Math.round(parseFloat(f) * Math.pow(10, $)).toString(), G = await l(n, d, x, j), st = await t(G.transaction), K = await c(st);
        W("done"), e == null || e(K.signature);
      } catch ($) {
        W("form"), i == null || i($.message);
      }
  }, [n, t, f, d, x, g, l, c, e, i]);
  return /* @__PURE__ */ b("div", { className: `ct-bg-[hsl(var(--cedros-background))] ct-border ct-border-[hsl(var(--cedros-border))] ct-rounded-cedros ct-p-4 ct-space-y-4 ${s}`, children: [
    /* @__PURE__ */ m("h3", { className: "ct-text-lg ct-font-semibold ct-text-[hsl(var(--cedros-foreground))]", children: "Send" }),
    /* @__PURE__ */ b("div", { className: "ct-space-y-1", children: [
      /* @__PURE__ */ m("label", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Recipient" }),
      /* @__PURE__ */ m(
        "input",
        {
          type: "text",
          value: d,
          onChange: ($) => p($.target.value),
          placeholder: "Wallet address or name.sol",
          className: "ct-w-full ct-px-3 ct-py-3 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] ct-outline-none focus:ct-ring-2 focus:ct-ring-[hsl(var(--cedros-ring))]"
        }
      ),
      z && /* @__PURE__ */ b("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: [
        "Resolves to: ",
        /* @__PURE__ */ b("span", { className: "ct-font-mono", children: [
          z.slice(0, 8),
          "...",
          z.slice(-4)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ b("div", { className: "ct-space-y-1", children: [
      /* @__PURE__ */ m("label", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Amount" }),
      /* @__PURE__ */ b("div", { className: "ct-flex ct-gap-2", children: [
        /* @__PURE__ */ m(
          "input",
          {
            type: "text",
            value: f,
            onChange: ($) => v($.target.value),
            placeholder: "0.00",
            className: "ct-flex-1 ct-px-3 ct-py-3 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-xl ct-text-[hsl(var(--cedros-foreground))] ct-outline-none focus:ct-ring-2 focus:ct-ring-[hsl(var(--cedros-ring))]"
          }
        ),
        /* @__PURE__ */ m(
          "button",
          {
            onClick: () => E(!0),
            className: "ct-px-4 ct-py-3 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] hover:ct-bg-[hsl(var(--cedros-border))] ct-font-medium ct-min-w-[100px]",
            children: (g == null ? void 0 : g.symbol) ?? "SOL"
          }
        )
      ] })
    ] }),
    (r == null ? void 0 : r.createsAta) && /* @__PURE__ */ m("div", { className: "ct-rounded-cedros ct-bg-yellow-500/10 ct-border ct-border-yellow-500/20 ct-px-3 ct-py-2 ct-text-xs ct-text-yellow-400", children: "This will create a token account for the recipient (~0.002 SOL rent)." }),
    /* @__PURE__ */ m(te, { message: o, onDismiss: u }),
    /* @__PURE__ */ m(
      "button",
      {
        onClick: J,
        disabled: !n || !d || !f || h || N !== "form",
        className: "ct-w-full ct-py-3 ct-rounded-cedros ct-font-semibold ct-text-[hsl(var(--cedros-primary-foreground))] ct-bg-[hsl(var(--cedros-primary))] hover:ct-opacity-90 disabled:ct-opacity-50 disabled:ct-cursor-not-allowed ct-transition",
        children: n ? N === "sign" ? "Signing..." : N === "done" ? "Sent!" : h ? /* @__PURE__ */ m(bt, {}) : "Send" : "Connect Wallet"
      }
    ),
    /* @__PURE__ */ m(Ji, { isOpen: S, onClose: () => E(!1), onSelect: R })
  ] });
}
function Oh(n) {
  return /* @__PURE__ */ m("div", { className: "ct-max-w-md ct-mx-auto ct-py-8 ct-px-4", children: /* @__PURE__ */ m(Xs, { ...n }) });
}
function Hs({
  symbol: n,
  interval: t = "D",
  theme: e = "dark",
  className: i = ""
}) {
  const s = lt(null);
  return X(() => {
    if (!s.current) return;
    const r = s.current;
    r.innerHTML = "";
    const h = document.createElement("script");
    h.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js", h.async = !0, h.innerHTML = JSON.stringify({
      autosize: !0,
      symbol: n,
      interval: t,
      timezone: "Etc/UTC",
      theme: e,
      style: "1",
      locale: "en",
      enable_publishing: !1,
      allow_symbol_change: !0,
      save_image: !1,
      hide_top_toolbar: !1,
      hide_legend: !1,
      withdateranges: !0
    });
    const o = document.createElement("div");
    return o.className = "tradingview-widget-container__widget", o.style.height = "100%", o.style.width = "100%", r.appendChild(o), r.appendChild(h), () => {
      r.innerHTML = "";
    };
  }, [n, t, e]), /* @__PURE__ */ m(
    "div",
    {
      ref: s,
      className: `tradingview-widget-container ct-w-full ct-h-full ct-min-h-[400px] ${i}`,
      style: { height: "100%" }
    }
  );
}
function P(n) {
  var t = n.width, e = n.height;
  if (t < 0)
    throw new Error("Negative width is not allowed for Size");
  if (e < 0)
    throw new Error("Negative height is not allowed for Size");
  return {
    width: t,
    height: e
  };
}
function ft(n, t) {
  return n.width === t.width && n.height === t.height;
}
var Us = (
  /** @class */
  function() {
    function n(t) {
      var e = this;
      this._resolutionListener = function() {
        return e._onResolutionChanged();
      }, this._resolutionMediaQueryList = null, this._observers = [], this._window = t, this._installResolutionListener();
    }
    return n.prototype.dispose = function() {
      this._uninstallResolutionListener(), this._window = null;
    }, Object.defineProperty(n.prototype, "value", {
      get: function() {
        return this._window.devicePixelRatio;
      },
      enumerable: !1,
      configurable: !0
    }), n.prototype.subscribe = function(t) {
      var e = this, i = { next: t };
      return this._observers.push(i), {
        unsubscribe: function() {
          e._observers = e._observers.filter(function(s) {
            return s !== i;
          });
        }
      };
    }, n.prototype._installResolutionListener = function() {
      if (this._resolutionMediaQueryList !== null)
        throw new Error("Resolution listener is already installed");
      var t = this._window.devicePixelRatio;
      this._resolutionMediaQueryList = this._window.matchMedia("all and (resolution: ".concat(t, "dppx)")), this._resolutionMediaQueryList.addListener(this._resolutionListener);
    }, n.prototype._uninstallResolutionListener = function() {
      this._resolutionMediaQueryList !== null && (this._resolutionMediaQueryList.removeListener(this._resolutionListener), this._resolutionMediaQueryList = null);
    }, n.prototype._reinstallResolutionListener = function() {
      this._uninstallResolutionListener(), this._installResolutionListener();
    }, n.prototype._onResolutionChanged = function() {
      var t = this;
      this._observers.forEach(function(e) {
        return e.next(t._window.devicePixelRatio);
      }), this._reinstallResolutionListener();
    }, n;
  }()
);
function qs(n) {
  return new Us(n);
}
var Js = (
  /** @class */
  function() {
    function n(t, e, i) {
      var s;
      this._canvasElement = null, this._bitmapSizeChangedListeners = [], this._suggestedBitmapSize = null, this._suggestedBitmapSizeChangedListeners = [], this._devicePixelRatioObservable = null, this._canvasElementResizeObserver = null, this._canvasElement = t, this._canvasElementClientSize = P({
        width: this._canvasElement.clientWidth,
        height: this._canvasElement.clientHeight
      }), this._transformBitmapSize = e ?? function(r) {
        return r;
      }, this._allowResizeObserver = (s = i == null ? void 0 : i.allowResizeObserver) !== null && s !== void 0 ? s : !0, this._chooseAndInitObserver();
    }
    return n.prototype.dispose = function() {
      var t, e;
      if (this._canvasElement === null)
        throw new Error("Object is disposed");
      (t = this._canvasElementResizeObserver) === null || t === void 0 || t.disconnect(), this._canvasElementResizeObserver = null, (e = this._devicePixelRatioObservable) === null || e === void 0 || e.dispose(), this._devicePixelRatioObservable = null, this._suggestedBitmapSizeChangedListeners.length = 0, this._bitmapSizeChangedListeners.length = 0, this._canvasElement = null;
    }, Object.defineProperty(n.prototype, "canvasElement", {
      get: function() {
        if (this._canvasElement === null)
          throw new Error("Object is disposed");
        return this._canvasElement;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "canvasElementClientSize", {
      get: function() {
        return this._canvasElementClientSize;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "bitmapSize", {
      get: function() {
        return P({
          width: this.canvasElement.width,
          height: this.canvasElement.height
        });
      },
      enumerable: !1,
      configurable: !0
    }), n.prototype.resizeCanvasElement = function(t) {
      this._canvasElementClientSize = P(t), this.canvasElement.style.width = "".concat(this._canvasElementClientSize.width, "px"), this.canvasElement.style.height = "".concat(this._canvasElementClientSize.height, "px"), this._invalidateBitmapSize();
    }, n.prototype.subscribeBitmapSizeChanged = function(t) {
      this._bitmapSizeChangedListeners.push(t);
    }, n.prototype.unsubscribeBitmapSizeChanged = function(t) {
      this._bitmapSizeChangedListeners = this._bitmapSizeChangedListeners.filter(function(e) {
        return e !== t;
      });
    }, Object.defineProperty(n.prototype, "suggestedBitmapSize", {
      get: function() {
        return this._suggestedBitmapSize;
      },
      enumerable: !1,
      configurable: !0
    }), n.prototype.subscribeSuggestedBitmapSizeChanged = function(t) {
      this._suggestedBitmapSizeChangedListeners.push(t);
    }, n.prototype.unsubscribeSuggestedBitmapSizeChanged = function(t) {
      this._suggestedBitmapSizeChangedListeners = this._suggestedBitmapSizeChangedListeners.filter(function(e) {
        return e !== t;
      });
    }, n.prototype.applySuggestedBitmapSize = function() {
      if (this._suggestedBitmapSize !== null) {
        var t = this._suggestedBitmapSize;
        this._suggestedBitmapSize = null, this._resizeBitmap(t), this._emitSuggestedBitmapSizeChanged(t, this._suggestedBitmapSize);
      }
    }, n.prototype._resizeBitmap = function(t) {
      var e = this.bitmapSize;
      ft(e, t) || (this.canvasElement.width = t.width, this.canvasElement.height = t.height, this._emitBitmapSizeChanged(e, t));
    }, n.prototype._emitBitmapSizeChanged = function(t, e) {
      var i = this;
      this._bitmapSizeChangedListeners.forEach(function(s) {
        return s.call(i, t, e);
      });
    }, n.prototype._suggestNewBitmapSize = function(t) {
      var e = this._suggestedBitmapSize, i = P(this._transformBitmapSize(t, this._canvasElementClientSize)), s = ft(this.bitmapSize, i) ? null : i;
      e === null && s === null || e !== null && s !== null && ft(e, s) || (this._suggestedBitmapSize = s, this._emitSuggestedBitmapSizeChanged(e, s));
    }, n.prototype._emitSuggestedBitmapSizeChanged = function(t, e) {
      var i = this;
      this._suggestedBitmapSizeChangedListeners.forEach(function(s) {
        return s.call(i, t, e);
      });
    }, n.prototype._chooseAndInitObserver = function() {
      var t = this;
      if (!this._allowResizeObserver) {
        this._initDevicePixelRatioObservable();
        return;
      }
      Qs().then(function(e) {
        return e ? t._initResizeObserver() : t._initDevicePixelRatioObservable();
      });
    }, n.prototype._initDevicePixelRatioObservable = function() {
      var t = this;
      if (this._canvasElement !== null) {
        var e = Je(this._canvasElement);
        if (e === null)
          throw new Error("No window is associated with the canvas");
        this._devicePixelRatioObservable = qs(e), this._devicePixelRatioObservable.subscribe(function() {
          return t._invalidateBitmapSize();
        }), this._invalidateBitmapSize();
      }
    }, n.prototype._invalidateBitmapSize = function() {
      var t, e;
      if (this._canvasElement !== null) {
        var i = Je(this._canvasElement);
        if (i !== null) {
          var s = (e = (t = this._devicePixelRatioObservable) === null || t === void 0 ? void 0 : t.value) !== null && e !== void 0 ? e : i.devicePixelRatio, r = this._canvasElement.getClientRects(), h = (
            // eslint-disable-next-line no-negated-condition
            r[0] !== void 0 ? Ys(r[0], s) : P({
              width: this._canvasElementClientSize.width * s,
              height: this._canvasElementClientSize.height * s
            })
          );
          this._suggestNewBitmapSize(h);
        }
      }
    }, n.prototype._initResizeObserver = function() {
      var t = this;
      this._canvasElement !== null && (this._canvasElementResizeObserver = new ResizeObserver(function(e) {
        var i = e.find(function(h) {
          return h.target === t._canvasElement;
        });
        if (!(!i || !i.devicePixelContentBoxSize || !i.devicePixelContentBoxSize[0])) {
          var s = i.devicePixelContentBoxSize[0], r = P({
            width: s.inlineSize,
            height: s.blockSize
          });
          t._suggestNewBitmapSize(r);
        }
      }), this._canvasElementResizeObserver.observe(this._canvasElement, { box: "device-pixel-content-box" }));
    }, n;
  }()
);
function Gs(n, t) {
  return new Js(n, t.transform, t.options);
}
function Je(n) {
  return n.ownerDocument.defaultView;
}
function Qs() {
  return new Promise(function(n) {
    var t = new ResizeObserver(function(e) {
      n(e.every(function(i) {
        return "devicePixelContentBoxSize" in i;
      })), t.disconnect();
    });
    t.observe(document.body, { box: "device-pixel-content-box" });
  }).catch(function() {
    return !1;
  });
}
function Ys(n, t) {
  return P({
    width: Math.round(n.left * t + n.width * t) - Math.round(n.left * t),
    height: Math.round(n.top * t + n.height * t) - Math.round(n.top * t)
  });
}
var Zs = (
  /** @class */
  function() {
    function n(t, e, i) {
      if (e.width === 0 || e.height === 0)
        throw new TypeError("Rendering target could only be created on a media with positive width and height");
      if (this._mediaSize = e, i.width === 0 || i.height === 0)
        throw new TypeError("Rendering target could only be created using a bitmap with positive integer width and height");
      this._bitmapSize = i, this._context = t;
    }
    return n.prototype.useMediaCoordinateSpace = function(t) {
      try {
        return this._context.save(), this._context.setTransform(1, 0, 0, 1, 0, 0), this._context.scale(this._horizontalPixelRatio, this._verticalPixelRatio), t({
          context: this._context,
          mediaSize: this._mediaSize
        });
      } finally {
        this._context.restore();
      }
    }, n.prototype.useBitmapCoordinateSpace = function(t) {
      try {
        return this._context.save(), this._context.setTransform(1, 0, 0, 1, 0, 0), t({
          context: this._context,
          mediaSize: this._mediaSize,
          bitmapSize: this._bitmapSize,
          horizontalPixelRatio: this._horizontalPixelRatio,
          verticalPixelRatio: this._verticalPixelRatio
        });
      } finally {
        this._context.restore();
      }
    }, Object.defineProperty(n.prototype, "_horizontalPixelRatio", {
      get: function() {
        return this._bitmapSize.width / this._mediaSize.width;
      },
      enumerable: !1,
      configurable: !0
    }), Object.defineProperty(n.prototype, "_verticalPixelRatio", {
      get: function() {
        return this._bitmapSize.height / this._mediaSize.height;
      },
      enumerable: !1,
      configurable: !0
    }), n;
  }()
);
function mt(n, t) {
  var e = n.canvasElementClientSize;
  if (e.width === 0 || e.height === 0)
    return null;
  var i = n.bitmapSize;
  if (i.width === 0 || i.height === 0)
    return null;
  var s = n.canvasElement.getContext("2d", t);
  return s === null ? null : new Zs(s, e, i);
}
/*!
 * @license
 * TradingView Lightweight Charts™ v4.2.3
 * Copyright (c) 2025 TradingView, Inc.
 * Licensed under Apache License 2.0 https://www.apache.org/licenses/LICENSE-2.0
 */
const tn = { upColor: "#26a69a", downColor: "#ef5350", wickVisible: !0, borderVisible: !0, borderColor: "#378658", borderUpColor: "#26a69a", borderDownColor: "#ef5350", wickColor: "#737375", wickUpColor: "#26a69a", wickDownColor: "#ef5350" }, en = { upColor: "#26a69a", downColor: "#ef5350", openVisible: !0, thinBars: !0 }, sn = { color: "#2196f3", lineStyle: 0, lineWidth: 3, lineType: 0, lineVisible: !0, crosshairMarkerVisible: !0, crosshairMarkerRadius: 4, crosshairMarkerBorderColor: "", crosshairMarkerBorderWidth: 2, crosshairMarkerBackgroundColor: "", lastPriceAnimation: 0, pointMarkersVisible: !1 }, nn = { topColor: "rgba( 46, 220, 135, 0.4)", bottomColor: "rgba( 40, 221, 100, 0)", invertFilledArea: !1, lineColor: "#33D778", lineStyle: 0, lineWidth: 3, lineType: 0, lineVisible: !0, crosshairMarkerVisible: !0, crosshairMarkerRadius: 4, crosshairMarkerBorderColor: "", crosshairMarkerBorderWidth: 2, crosshairMarkerBackgroundColor: "", lastPriceAnimation: 0, pointMarkersVisible: !1 }, rn = { baseValue: { type: "price", price: 0 }, topFillColor1: "rgba(38, 166, 154, 0.28)", topFillColor2: "rgba(38, 166, 154, 0.05)", topLineColor: "rgba(38, 166, 154, 1)", bottomFillColor1: "rgba(239, 83, 80, 0.05)", bottomFillColor2: "rgba(239, 83, 80, 0.28)", bottomLineColor: "rgba(239, 83, 80, 1)", lineWidth: 3, lineStyle: 0, lineType: 0, lineVisible: !0, crosshairMarkerVisible: !0, crosshairMarkerRadius: 4, crosshairMarkerBorderColor: "", crosshairMarkerBorderWidth: 2, crosshairMarkerBackgroundColor: "", lastPriceAnimation: 0, pointMarkersVisible: !1 }, hn = { color: "#26a69a", base: 0 }, Qi = { color: "#2196f3" }, Yi = { title: "", visible: !0, lastValueVisible: !0, priceLineVisible: !0, priceLineSource: 0, priceLineWidth: 1, priceLineColor: "", priceLineStyle: 2, baseLineVisible: !0, baseLineWidth: 1, baseLineColor: "#B2B5BE", baseLineStyle: 0, priceFormat: { type: "price", precision: 2, minMove: 0.01 } };
var Ge, Qe;
function pt(n, t) {
  const e = { 0: [], 1: [n.lineWidth, n.lineWidth], 2: [2 * n.lineWidth, 2 * n.lineWidth], 3: [6 * n.lineWidth, 6 * n.lineWidth], 4: [n.lineWidth, 4 * n.lineWidth] }[t];
  n.setLineDash(e);
}
function Zi(n, t, e, i) {
  n.beginPath();
  const s = n.lineWidth % 2 ? 0.5 : 0;
  n.moveTo(e, t + s), n.lineTo(i, t + s), n.stroke();
}
function ct(n, t) {
  if (!n) throw new Error("Assertion failed" + (t ? ": " + t : ""));
}
function B(n) {
  if (n === void 0) throw new Error("Value is undefined");
  return n;
}
function w(n) {
  if (n === null) throw new Error("Value is null");
  return n;
}
function yt(n) {
  return w(B(n));
}
(function(n) {
  n[n.Simple = 0] = "Simple", n[n.WithSteps = 1] = "WithSteps", n[n.Curved = 2] = "Curved";
})(Ge || (Ge = {})), function(n) {
  n[n.Solid = 0] = "Solid", n[n.Dotted = 1] = "Dotted", n[n.Dashed = 2] = "Dashed", n[n.LargeDashed = 3] = "LargeDashed", n[n.SparseDotted = 4] = "SparseDotted";
}(Qe || (Qe = {}));
const Ye = { khaki: "#f0e68c", azure: "#f0ffff", aliceblue: "#f0f8ff", ghostwhite: "#f8f8ff", gold: "#ffd700", goldenrod: "#daa520", gainsboro: "#dcdcdc", gray: "#808080", green: "#008000", honeydew: "#f0fff0", floralwhite: "#fffaf0", lightblue: "#add8e6", lightcoral: "#f08080", lemonchiffon: "#fffacd", hotpink: "#ff69b4", lightyellow: "#ffffe0", greenyellow: "#adff2f", lightgoldenrodyellow: "#fafad2", limegreen: "#32cd32", linen: "#faf0e6", lightcyan: "#e0ffff", magenta: "#f0f", maroon: "#800000", olive: "#808000", orange: "#ffa500", oldlace: "#fdf5e6", mediumblue: "#0000cd", transparent: "#0000", lime: "#0f0", lightpink: "#ffb6c1", mistyrose: "#ffe4e1", moccasin: "#ffe4b5", midnightblue: "#191970", orchid: "#da70d6", mediumorchid: "#ba55d3", mediumturquoise: "#48d1cc", orangered: "#ff4500", royalblue: "#4169e1", powderblue: "#b0e0e6", red: "#f00", coral: "#ff7f50", turquoise: "#40e0d0", white: "#fff", whitesmoke: "#f5f5f5", wheat: "#f5deb3", teal: "#008080", steelblue: "#4682b4", bisque: "#ffe4c4", aquamarine: "#7fffd4", aqua: "#0ff", sienna: "#a0522d", silver: "#c0c0c0", springgreen: "#00ff7f", antiquewhite: "#faebd7", burlywood: "#deb887", brown: "#a52a2a", beige: "#f5f5dc", chocolate: "#d2691e", chartreuse: "#7fff00", cornflowerblue: "#6495ed", cornsilk: "#fff8dc", crimson: "#dc143c", cadetblue: "#5f9ea0", tomato: "#ff6347", fuchsia: "#f0f", blue: "#00f", salmon: "#fa8072", blanchedalmond: "#ffebcd", slateblue: "#6a5acd", slategray: "#708090", thistle: "#d8bfd8", tan: "#d2b48c", cyan: "#0ff", darkblue: "#00008b", darkcyan: "#008b8b", darkgoldenrod: "#b8860b", darkgray: "#a9a9a9", blueviolet: "#8a2be2", black: "#000", darkmagenta: "#8b008b", darkslateblue: "#483d8b", darkkhaki: "#bdb76b", darkorchid: "#9932cc", darkorange: "#ff8c00", darkgreen: "#006400", darkred: "#8b0000", dodgerblue: "#1e90ff", darkslategray: "#2f4f4f", dimgray: "#696969", deepskyblue: "#00bfff", firebrick: "#b22222", forestgreen: "#228b22", indigo: "#4b0082", ivory: "#fffff0", lavenderblush: "#fff0f5", feldspar: "#d19275", indianred: "#cd5c5c", lightgreen: "#90ee90", lightgrey: "#d3d3d3", lightskyblue: "#87cefa", lightslategray: "#789", lightslateblue: "#8470ff", snow: "#fffafa", lightseagreen: "#20b2aa", lightsalmon: "#ffa07a", darksalmon: "#e9967a", darkviolet: "#9400d3", mediumpurple: "#9370d8", mediumaquamarine: "#66cdaa", skyblue: "#87ceeb", lavender: "#e6e6fa", lightsteelblue: "#b0c4de", mediumvioletred: "#c71585", mintcream: "#f5fffa", navajowhite: "#ffdead", navy: "#000080", olivedrab: "#6b8e23", palevioletred: "#d87093", violetred: "#d02090", yellow: "#ff0", yellowgreen: "#9acd32", lawngreen: "#7cfc00", pink: "#ffc0cb", paleturquoise: "#afeeee", palegoldenrod: "#eee8aa", darkolivegreen: "#556b2f", darkseagreen: "#8fbc8f", darkturquoise: "#00ced1", peachpuff: "#ffdab9", deeppink: "#ff1493", violet: "#ee82ee", palegreen: "#98fb98", mediumseagreen: "#3cb371", peru: "#cd853f", saddlebrown: "#8b4513", sandybrown: "#f4a460", rosybrown: "#bc8f8f", purple: "#800080", seagreen: "#2e8b57", seashell: "#fff5ee", papayawhip: "#ffefd5", mediumslateblue: "#7b68ee", plum: "#dda0dd", mediumspringgreen: "#00fa9a" };
function A(n) {
  return n < 0 ? 0 : n > 255 ? 255 : Math.round(n) || 0;
}
function ts(n) {
  return n <= 0 || n > 1 ? Math.min(Math.max(n, 0), 1) : Math.round(1e4 * n) / 1e4;
}
const on = /^#([0-9a-f])([0-9a-f])([0-9a-f])([0-9a-f])?$/i, ln = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})?$/i, cn = /^rgb\(\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*\)$/, an = /^rgba\(\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*,\s*(-?\d{1,10})\s*,\s*(-?\d*\.?\d+)\s*\)$/;
function Pt(n) {
  (n = n.toLowerCase()) in Ye && (n = Ye[n]);
  {
    const t = an.exec(n) || cn.exec(n);
    if (t) return [A(parseInt(t[1], 10)), A(parseInt(t[2], 10)), A(parseInt(t[3], 10)), ts(t.length < 5 ? 1 : parseFloat(t[4]))];
  }
  {
    const t = ln.exec(n);
    if (t) return [A(parseInt(t[1], 16)), A(parseInt(t[2], 16)), A(parseInt(t[3], 16)), 1];
  }
  {
    const t = on.exec(n);
    if (t) return [A(17 * parseInt(t[1], 16)), A(17 * parseInt(t[2], 16)), A(17 * parseInt(t[3], 16)), 1];
  }
  throw new Error(`Cannot parse color: ${n}`);
}
function es(n) {
  return 0.199 * n[0] + 0.687 * n[1] + 0.114 * n[2];
}
function ee(n) {
  const t = Pt(n);
  return { t: `rgb(${t[0]}, ${t[1]}, ${t[2]})`, i: es(t) > 160 ? "black" : "white" };
}
class V {
  constructor() {
    this.h = [];
  }
  l(t, e, i) {
    const s = { o: t, _: e, u: i === !0 };
    this.h.push(s);
  }
  v(t) {
    const e = this.h.findIndex((i) => t === i.o);
    e > -1 && this.h.splice(e, 1);
  }
  p(t) {
    this.h = this.h.filter((e) => e._ !== t);
  }
  m(t, e, i) {
    const s = [...this.h];
    this.h = this.h.filter((r) => !r.u), s.forEach((r) => r.o(t, e, i));
  }
  M() {
    return this.h.length > 0;
  }
  S() {
    this.h = [];
  }
}
function U(n, ...t) {
  for (const e of t) for (const i in e) e[i] !== void 0 && Object.prototype.hasOwnProperty.call(e, i) && !["__proto__", "constructor", "prototype"].includes(i) && (typeof e[i] != "object" || n[i] === void 0 || Array.isArray(e[i]) ? n[i] = e[i] : U(n[i], e[i]));
  return n;
}
function Y(n) {
  return typeof n == "number" && isFinite(n);
}
function $t(n) {
  return typeof n == "number" && n % 1 == 0;
}
function Wt(n) {
  return typeof n == "string";
}
function Bt(n) {
  return typeof n == "boolean";
}
function tt(n) {
  const t = n;
  if (!t || typeof t != "object") return t;
  let e, i, s;
  for (i in e = Array.isArray(t) ? [] : {}, t) t.hasOwnProperty(i) && (s = t[i], e[i] = s && typeof s == "object" ? tt(s) : s);
  return e;
}
function un(n) {
  return n !== null;
}
function Vt(n) {
  return n === null ? void 0 : n;
}
const $e = "-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif";
function _t(n, t, e) {
  return t === void 0 && (t = $e), `${e = e !== void 0 ? `${e} ` : ""}${n}px ${t}`;
}
class dn {
  constructor(t) {
    this.k = { C: 1, T: 5, P: NaN, R: "", D: "", V: "", O: "", B: 0, A: 0, I: 0, L: 0, N: 0 }, this.F = t;
  }
  W() {
    const t = this.k, e = this.j(), i = this.H();
    return t.P === e && t.D === i || (t.P = e, t.D = i, t.R = _t(e, i), t.L = 2.5 / 12 * e, t.B = t.L, t.A = e / 12 * t.T, t.I = e / 12 * t.T, t.N = 0), t.V = this.$(), t.O = this.U(), this.k;
  }
  $() {
    return this.F.W().layout.textColor;
  }
  U() {
    return this.F.q();
  }
  j() {
    return this.F.W().layout.fontSize;
  }
  H() {
    return this.F.W().layout.fontFamily;
  }
}
class Ve {
  constructor() {
    this.Y = [];
  }
  Z(t) {
    this.Y = t;
  }
  X(t, e, i) {
    this.Y.forEach((s) => {
      s.X(t, e, i);
    });
  }
}
class q {
  X(t, e, i) {
    t.useBitmapCoordinateSpace((s) => this.K(s, e, i));
  }
}
class fn extends q {
  constructor() {
    super(...arguments), this.G = null;
  }
  J(t) {
    this.G = t;
  }
  K({ context: t, horizontalPixelRatio: e, verticalPixelRatio: i }) {
    if (this.G === null || this.G.tt === null) return;
    const s = this.G.tt, r = this.G, h = Math.max(1, Math.floor(e)) % 2 / 2, o = (l) => {
      t.beginPath();
      for (let c = s.to - 1; c >= s.from; --c) {
        const a = r.it[c], u = Math.round(a.nt * e) + h, d = a.st * i, p = l * i + h;
        t.moveTo(u, d), t.arc(u, d, p, 0, 2 * Math.PI);
      }
      t.fill();
    };
    r.et > 0 && (t.fillStyle = r.rt, o(r.ht + r.et)), t.fillStyle = r.lt, o(r.ht);
  }
}
function mn() {
  return { it: [{ nt: 0, st: 0, ot: 0, _t: 0 }], lt: "", rt: "", ht: 0, et: 0, tt: null };
}
const pn = { from: 0, to: 1 };
class vn {
  constructor(t, e) {
    this.ut = new Ve(), this.ct = [], this.dt = [], this.ft = !0, this.F = t, this.vt = e, this.ut.Z(this.ct);
  }
  bt(t) {
    const e = this.F.wt();
    e.length !== this.ct.length && (this.dt = e.map(mn), this.ct = this.dt.map((i) => {
      const s = new fn();
      return s.J(i), s;
    }), this.ut.Z(this.ct)), this.ft = !0;
  }
  gt() {
    return this.ft && (this.Mt(), this.ft = !1), this.ut;
  }
  Mt() {
    const t = this.vt.W().mode === 2, e = this.F.wt(), i = this.vt.xt(), s = this.F.St();
    e.forEach((r, h) => {
      var o;
      const l = this.dt[h], c = r.kt(i);
      if (t || c === null || !r.yt()) return void (l.tt = null);
      const a = w(r.Ct());
      l.lt = c.Tt, l.ht = c.ht, l.et = c.Pt, l.it[0]._t = c._t, l.it[0].st = r.Dt().Rt(c._t, a.Vt), l.rt = (o = c.Ot) !== null && o !== void 0 ? o : this.F.Bt(l.it[0].st / r.Dt().At()), l.it[0].ot = i, l.it[0].nt = s.It(i), l.tt = pn;
    });
  }
}
class gn extends q {
  constructor(t) {
    super(), this.zt = t;
  }
  K({ context: t, bitmapSize: e, horizontalPixelRatio: i, verticalPixelRatio: s }) {
    if (this.zt === null) return;
    const r = this.zt.Lt.yt, h = this.zt.Et.yt;
    if (!r && !h) return;
    const o = Math.round(this.zt.nt * i), l = Math.round(this.zt.st * s);
    t.lineCap = "butt", r && o >= 0 && (t.lineWidth = Math.floor(this.zt.Lt.et * i), t.strokeStyle = this.zt.Lt.V, t.fillStyle = this.zt.Lt.V, pt(t, this.zt.Lt.Nt), function(c, a, u, d) {
      c.beginPath();
      const p = c.lineWidth % 2 ? 0.5 : 0;
      c.moveTo(a + p, u), c.lineTo(a + p, d), c.stroke();
    }(t, o, 0, e.height)), h && l >= 0 && (t.lineWidth = Math.floor(this.zt.Et.et * s), t.strokeStyle = this.zt.Et.V, t.fillStyle = this.zt.Et.V, pt(t, this.zt.Et.Nt), Zi(t, l, 0, e.width));
  }
}
class bn {
  constructor(t) {
    this.ft = !0, this.Ft = { Lt: { et: 1, Nt: 0, V: "", yt: !1 }, Et: { et: 1, Nt: 0, V: "", yt: !1 }, nt: 0, st: 0 }, this.Wt = new gn(this.Ft), this.jt = t;
  }
  bt() {
    this.ft = !0;
  }
  gt() {
    return this.ft && (this.Mt(), this.ft = !1), this.Wt;
  }
  Mt() {
    const t = this.jt.yt(), e = w(this.jt.Ht()), i = e.$t().W().crosshair, s = this.Ft;
    if (i.mode === 2) return s.Et.yt = !1, void (s.Lt.yt = !1);
    s.Et.yt = t && this.jt.Ut(e), s.Lt.yt = t && this.jt.qt(), s.Et.et = i.horzLine.width, s.Et.Nt = i.horzLine.style, s.Et.V = i.horzLine.color, s.Lt.et = i.vertLine.width, s.Lt.Nt = i.vertLine.style, s.Lt.V = i.vertLine.color, s.nt = this.jt.Yt(), s.st = this.jt.Zt();
  }
}
function wn(n, t, e, i, s, r) {
  n.fillRect(t + r, e, i - 2 * r, r), n.fillRect(t + r, e + s - r, i - 2 * r, r), n.fillRect(t, e, r, s), n.fillRect(t + i - r, e, r, s);
}
function ie(n, t, e, i, s, r) {
  n.save(), n.globalCompositeOperation = "copy", n.fillStyle = r, n.fillRect(t, e, i, s), n.restore();
}
function Ze(n, t, e, i, s, r) {
  n.beginPath(), n.roundRect ? n.roundRect(t, e, i, s, r) : (n.lineTo(t + i - r[1], e), r[1] !== 0 && n.arcTo(t + i, e, t + i, e + r[1], r[1]), n.lineTo(t + i, e + s - r[2]), r[2] !== 0 && n.arcTo(t + i, e + s, t + i - r[2], e + s, r[2]), n.lineTo(t + r[3], e + s), r[3] !== 0 && n.arcTo(t, e + s, t, e + s - r[3], r[3]), n.lineTo(t, e + r[0]), r[0] !== 0 && n.arcTo(t, e, t + r[0], e, r[0]));
}
function ti(n, t, e, i, s, r, h = 0, o = [0, 0, 0, 0], l = "") {
  if (n.save(), !h || !l || l === r) return Ze(n, t, e, i, s, o), n.fillStyle = r, n.fill(), void n.restore();
  const c = h / 2;
  var a;
  Ze(n, t + c, e + c, i - h, s - h, (a = -c, o.map((u) => u === 0 ? u : u + a))), r !== "transparent" && (n.fillStyle = r, n.fill()), l !== "transparent" && (n.lineWidth = h, n.strokeStyle = l, n.closePath(), n.stroke()), n.restore();
}
function is(n, t, e, i, s, r, h) {
  n.save(), n.globalCompositeOperation = "copy";
  const o = n.createLinearGradient(0, 0, 0, s);
  o.addColorStop(0, r), o.addColorStop(1, h), n.fillStyle = o, n.fillRect(t, e, i, s), n.restore();
}
class ei {
  constructor(t, e) {
    this.J(t, e);
  }
  J(t, e) {
    this.zt = t, this.Xt = e;
  }
  At(t, e) {
    return this.zt.yt ? t.P + t.L + t.B : 0;
  }
  X(t, e, i, s) {
    if (!this.zt.yt || this.zt.Kt.length === 0) return;
    const r = this.zt.V, h = this.Xt.t, o = t.useBitmapCoordinateSpace((l) => {
      const c = l.context;
      c.font = e.R;
      const a = this.Gt(l, e, i, s), u = a.Jt;
      return a.Qt ? ti(c, u.ti, u.ii, u.ni, u.si, h, u.ei, [u.ht, 0, 0, u.ht], h) : ti(c, u.ri, u.ii, u.ni, u.si, h, u.ei, [0, u.ht, u.ht, 0], h), this.zt.hi && (c.fillStyle = r, c.fillRect(u.ri, u.li, u.ai - u.ri, u.oi)), this.zt._i && (c.fillStyle = e.O, c.fillRect(a.Qt ? u.ui - u.ei : 0, u.ii, u.ei, u.ci - u.ii)), a;
    });
    t.useMediaCoordinateSpace(({ context: l }) => {
      const c = o.di;
      l.font = e.R, l.textAlign = o.Qt ? "right" : "left", l.textBaseline = "middle", l.fillStyle = r, l.fillText(this.zt.Kt, c.fi, (c.ii + c.ci) / 2 + c.pi);
    });
  }
  Gt(t, e, i, s) {
    var r;
    const { context: h, bitmapSize: o, mediaSize: l, horizontalPixelRatio: c, verticalPixelRatio: a } = t, u = this.zt.hi || !this.zt.mi ? e.T : 0, d = this.zt.bi ? e.C : 0, p = e.L + this.Xt.wi, f = e.B + this.Xt.gi, v = e.A, g = e.I, y = this.zt.Kt, x = e.P, _ = i.Mi(h, y), S = Math.ceil(i.xi(h, y)), E = x + p + f, z = e.C + v + g + S + u, T = Math.max(1, Math.floor(a));
    let N = Math.round(E * a);
    N % 2 != T % 2 && (N += 1);
    const W = d > 0 ? Math.max(1, Math.floor(d * c)) : 0, R = Math.round(z * c), J = Math.round(u * c), $ = (r = this.Xt.Si) !== null && r !== void 0 ? r : this.Xt.ki, j = Math.round($ * a) - Math.floor(0.5 * a), G = Math.floor(j + T / 2 - N / 2), st = G + N, K = s === "right", wt = K ? l.width - d : d, k = K ? o.width - W : W;
    let H, nt, Nt;
    return K ? (H = k - R, nt = k - J, Nt = wt - u - v - d) : (H = k + R, nt = k + J, Nt = wt + u + v), { Qt: K, Jt: { ii: G, li: j, ci: st, ni: R, si: N, ht: 2 * c, ei: W, ti: H, ri: k, ai: nt, oi: T, ui: o.width }, di: { ii: G / a, ci: st / a, fi: Nt, pi: _ } };
  }
}
class se {
  constructor(t) {
    this.yi = { ki: 0, t: "#000", gi: 0, wi: 0 }, this.Ci = { Kt: "", yt: !1, hi: !0, mi: !1, Ot: "", V: "#FFF", _i: !1, bi: !1 }, this.Ti = { Kt: "", yt: !1, hi: !1, mi: !0, Ot: "", V: "#FFF", _i: !0, bi: !0 }, this.ft = !0, this.Pi = new (t || ei)(this.Ci, this.yi), this.Ri = new (t || ei)(this.Ti, this.yi);
  }
  Kt() {
    return this.Di(), this.Ci.Kt;
  }
  ki() {
    return this.Di(), this.yi.ki;
  }
  bt() {
    this.ft = !0;
  }
  At(t, e = !1) {
    return Math.max(this.Pi.At(t, e), this.Ri.At(t, e));
  }
  Vi() {
    return this.yi.Si || 0;
  }
  Oi(t) {
    this.yi.Si = t;
  }
  Bi() {
    return this.Di(), this.Ci.yt || this.Ti.yt;
  }
  Ai() {
    return this.Di(), this.Ci.yt;
  }
  gt(t) {
    return this.Di(), this.Ci.hi = this.Ci.hi && t.W().ticksVisible, this.Ti.hi = this.Ti.hi && t.W().ticksVisible, this.Pi.J(this.Ci, this.yi), this.Ri.J(this.Ti, this.yi), this.Pi;
  }
  Ii() {
    return this.Di(), this.Pi.J(this.Ci, this.yi), this.Ri.J(this.Ti, this.yi), this.Ri;
  }
  Di() {
    this.ft && (this.Ci.hi = !0, this.Ti.hi = !1, this.zi(this.Ci, this.Ti, this.yi));
  }
}
class xn extends se {
  constructor(t, e, i) {
    super(), this.jt = t, this.Li = e, this.Ei = i;
  }
  zi(t, e, i) {
    if (t.yt = !1, this.jt.W().mode === 2) return;
    const s = this.jt.W().horzLine;
    if (!s.labelVisible) return;
    const r = this.Li.Ct();
    if (!this.jt.yt() || this.Li.Ni() || r === null) return;
    const h = ee(s.labelBackgroundColor);
    i.t = h.t, t.V = h.i;
    const o = 2 / 12 * this.Li.P();
    i.wi = o, i.gi = o;
    const l = this.Ei(this.Li);
    i.ki = l.ki, t.Kt = this.Li.Fi(l._t, r), t.yt = !0;
  }
}
const yn = /[1-9]/g;
class ss {
  constructor() {
    this.zt = null;
  }
  J(t) {
    this.zt = t;
  }
  X(t, e) {
    if (this.zt === null || this.zt.yt === !1 || this.zt.Kt.length === 0) return;
    const i = t.useMediaCoordinateSpace(({ context: d }) => (d.font = e.R, Math.round(e.Wi.xi(d, w(this.zt).Kt, yn))));
    if (i <= 0) return;
    const s = e.ji, r = i + 2 * s, h = r / 2, o = this.zt.Hi;
    let l = this.zt.ki, c = Math.floor(l - h) + 0.5;
    c < 0 ? (l += Math.abs(0 - c), c = Math.floor(l - h) + 0.5) : c + r > o && (l -= Math.abs(o - (c + r)), c = Math.floor(l - h) + 0.5);
    const a = c + r, u = Math.ceil(0 + e.C + e.T + e.L + e.P + e.B);
    t.useBitmapCoordinateSpace(({ context: d, horizontalPixelRatio: p, verticalPixelRatio: f }) => {
      const v = w(this.zt);
      d.fillStyle = v.t;
      const g = Math.round(c * p), y = Math.round(0 * f), x = Math.round(a * p), _ = Math.round(u * f), S = Math.round(2 * p);
      if (d.beginPath(), d.moveTo(g, y), d.lineTo(g, _ - S), d.arcTo(g, _, g + S, _, S), d.lineTo(x - S, _), d.arcTo(x, _, x, _ - S, S), d.lineTo(x, y), d.fill(), v.hi) {
        const E = Math.round(v.ki * p), z = y, T = Math.round((z + e.T) * f);
        d.fillStyle = v.V;
        const N = Math.max(1, Math.floor(p)), W = Math.floor(0.5 * p);
        d.fillRect(E - W, z, N, T - z);
      }
    }), t.useMediaCoordinateSpace(({ context: d }) => {
      const p = w(this.zt), f = 0 + e.C + e.T + e.L + e.P / 2;
      d.font = e.R, d.textAlign = "left", d.textBaseline = "middle", d.fillStyle = p.V;
      const v = e.Wi.Mi(d, "Apr0");
      d.translate(c + s, f + v), d.fillText(p.Kt, 0, 0);
    });
  }
}
class Sn {
  constructor(t, e, i) {
    this.ft = !0, this.Wt = new ss(), this.Ft = { yt: !1, t: "#4c525e", V: "white", Kt: "", Hi: 0, ki: NaN, hi: !0 }, this.vt = t, this.$i = e, this.Ei = i;
  }
  bt() {
    this.ft = !0;
  }
  gt() {
    return this.ft && (this.Mt(), this.ft = !1), this.Wt.J(this.Ft), this.Wt;
  }
  Mt() {
    const t = this.Ft;
    if (t.yt = !1, this.vt.W().mode === 2) return;
    const e = this.vt.W().vertLine;
    if (!e.labelVisible) return;
    const i = this.$i.St();
    if (i.Ni()) return;
    t.Hi = i.Hi();
    const s = this.Ei();
    if (s === null) return;
    t.ki = s.ki;
    const r = i.Ui(this.vt.xt());
    t.Kt = i.qi(w(r)), t.yt = !0;
    const h = ee(e.labelBackgroundColor);
    t.t = h.t, t.V = h.i, t.hi = i.W().ticksVisible;
  }
}
class Re {
  constructor() {
    this.Yi = null, this.Zi = 0;
  }
  Xi() {
    return this.Zi;
  }
  Ki(t) {
    this.Zi = t;
  }
  Dt() {
    return this.Yi;
  }
  Gi(t) {
    this.Yi = t;
  }
  Ji(t) {
    return [];
  }
  Qi() {
    return [];
  }
  yt() {
    return !0;
  }
}
var ii;
(function(n) {
  n[n.Normal = 0] = "Normal", n[n.Magnet = 1] = "Magnet", n[n.Hidden = 2] = "Hidden";
})(ii || (ii = {}));
class Mn extends Re {
  constructor(t, e) {
    super(), this.tn = null, this.nn = NaN, this.sn = 0, this.en = !0, this.rn = /* @__PURE__ */ new Map(), this.hn = !1, this.ln = NaN, this.an = NaN, this._n = NaN, this.un = NaN, this.$i = t, this.cn = e, this.dn = new vn(t, this), this.fn = /* @__PURE__ */ ((s, r) => (h) => {
      const o = r(), l = s();
      if (h === w(this.tn).vn()) return { _t: l, ki: o };
      {
        const c = w(h.Ct());
        return { _t: h.pn(o, c), ki: o };
      }
    })(() => this.nn, () => this.an);
    const i = /* @__PURE__ */ ((s, r) => () => {
      const h = this.$i.St().mn(s()), o = r();
      return h && Number.isFinite(o) ? { ot: h, ki: o } : null;
    })(() => this.sn, () => this.Yt());
    this.bn = new Sn(this, t, i), this.wn = new bn(this);
  }
  W() {
    return this.cn;
  }
  gn(t, e) {
    this._n = t, this.un = e;
  }
  Mn() {
    this._n = NaN, this.un = NaN;
  }
  xn() {
    return this._n;
  }
  Sn() {
    return this.un;
  }
  kn(t, e, i) {
    this.hn || (this.hn = !0), this.en = !0, this.yn(t, e, i);
  }
  xt() {
    return this.sn;
  }
  Yt() {
    return this.ln;
  }
  Zt() {
    return this.an;
  }
  yt() {
    return this.en;
  }
  Cn() {
    this.en = !1, this.Tn(), this.nn = NaN, this.ln = NaN, this.an = NaN, this.tn = null, this.Mn();
  }
  Pn(t) {
    return this.tn !== null ? [this.wn, this.dn] : [];
  }
  Ut(t) {
    return t === this.tn && this.cn.horzLine.visible;
  }
  qt() {
    return this.cn.vertLine.visible;
  }
  Rn(t, e) {
    this.en && this.tn === t || this.rn.clear();
    const i = [];
    return this.tn === t && i.push(this.Dn(this.rn, e, this.fn)), i;
  }
  Qi() {
    return this.en ? [this.bn] : [];
  }
  Ht() {
    return this.tn;
  }
  Vn() {
    this.wn.bt(), this.rn.forEach((t) => t.bt()), this.bn.bt(), this.dn.bt();
  }
  On(t) {
    return t && !t.vn().Ni() ? t.vn() : null;
  }
  yn(t, e, i) {
    this.Bn(t, e, i) && this.Vn();
  }
  Bn(t, e, i) {
    const s = this.ln, r = this.an, h = this.nn, o = this.sn, l = this.tn, c = this.On(i);
    this.sn = t, this.ln = isNaN(t) ? NaN : this.$i.St().It(t), this.tn = i;
    const a = c !== null ? c.Ct() : null;
    return c !== null && a !== null ? (this.nn = e, this.an = c.Rt(e, a)) : (this.nn = NaN, this.an = NaN), s !== this.ln || r !== this.an || o !== this.sn || h !== this.nn || l !== this.tn;
  }
  Tn() {
    const t = this.$i.wt().map((i) => i.In().An()).filter(un), e = t.length === 0 ? null : Math.max(...t);
    this.sn = e !== null ? e : NaN;
  }
  Dn(t, e, i) {
    let s = t.get(e);
    return s === void 0 && (s = new xn(this, e, i), t.set(e, s)), s;
  }
}
function ne(n) {
  return n === "left" || n === "right";
}
class O {
  constructor(t) {
    this.zn = /* @__PURE__ */ new Map(), this.Ln = [], this.En = t;
  }
  Nn(t, e) {
    const i = function(s, r) {
      return s === void 0 ? r : { Fn: Math.max(s.Fn, r.Fn), Wn: s.Wn || r.Wn };
    }(this.zn.get(t), e);
    this.zn.set(t, i);
  }
  jn() {
    return this.En;
  }
  Hn(t) {
    const e = this.zn.get(t);
    return e === void 0 ? { Fn: this.En } : { Fn: Math.max(this.En, e.Fn), Wn: e.Wn };
  }
  $n() {
    this.Un(), this.Ln = [{ qn: 0 }];
  }
  Yn(t) {
    this.Un(), this.Ln = [{ qn: 1, Vt: t }];
  }
  Zn(t) {
    this.Xn(), this.Ln.push({ qn: 5, Vt: t });
  }
  Un() {
    this.Xn(), this.Ln.push({ qn: 6 });
  }
  Kn() {
    this.Un(), this.Ln = [{ qn: 4 }];
  }
  Gn(t) {
    this.Un(), this.Ln.push({ qn: 2, Vt: t });
  }
  Jn(t) {
    this.Un(), this.Ln.push({ qn: 3, Vt: t });
  }
  Qn() {
    return this.Ln;
  }
  ts(t) {
    for (const e of t.Ln) this.ns(e);
    this.En = Math.max(this.En, t.En), t.zn.forEach((e, i) => {
      this.Nn(i, e);
    });
  }
  static ss() {
    return new O(2);
  }
  static es() {
    return new O(3);
  }
  ns(t) {
    switch (t.qn) {
      case 0:
        this.$n();
        break;
      case 1:
        this.Yn(t.Vt);
        break;
      case 2:
        this.Gn(t.Vt);
        break;
      case 3:
        this.Jn(t.Vt);
        break;
      case 4:
        this.Kn();
        break;
      case 5:
        this.Zn(t.Vt);
        break;
      case 6:
        this.Xn();
    }
  }
  Xn() {
    const t = this.Ln.findIndex((e) => e.qn === 5);
    t !== -1 && this.Ln.splice(t, 1);
  }
}
const si = ".";
function et(n, t) {
  if (!Y(n)) return "n/a";
  if (!$t(t)) throw new TypeError("invalid length");
  if (t < 0 || t > 16) throw new TypeError("invalid length");
  return t === 0 ? n.toString() : ("0000000000000000" + n.toString()).slice(-t);
}
class re {
  constructor(t, e) {
    if (e || (e = 1), Y(t) && $t(t) || (t = 100), t < 0) throw new TypeError("invalid base");
    this.Li = t, this.rs = e, this.hs();
  }
  format(t) {
    const e = t < 0 ? "−" : "";
    return t = Math.abs(t), e + this.ls(t);
  }
  hs() {
    if (this._s = 0, this.Li > 0 && this.rs > 0) {
      let t = this.Li;
      for (; t > 1; ) t /= 10, this._s++;
    }
  }
  ls(t) {
    const e = this.Li / this.rs;
    let i = Math.floor(t), s = "";
    const r = this._s !== void 0 ? this._s : NaN;
    if (e > 1) {
      let h = +(Math.round(t * e) - i * e).toFixed(this._s);
      h >= e && (h -= e, i += 1), s = si + et(+h.toFixed(this._s) * this.rs, r);
    } else i = Math.round(i * e) / e, r > 0 && (s = si + et(0, r));
    return i.toFixed(0) + s;
  }
}
class ns extends re {
  constructor(t = 100) {
    super(t);
  }
  format(t) {
    return `${super.format(t)}%`;
  }
}
class _n {
  constructor(t) {
    this.us = t;
  }
  format(t) {
    let e = "";
    return t < 0 && (e = "-", t = -t), t < 995 ? e + this.cs(t) : t < 999995 ? e + this.cs(t / 1e3) + "K" : t < 999999995 ? (t = 1e3 * Math.round(t / 1e3), e + this.cs(t / 1e6) + "M") : (t = 1e6 * Math.round(t / 1e6), e + this.cs(t / 1e9) + "B");
  }
  cs(t) {
    let e;
    const i = Math.pow(10, this.us);
    return e = (t = Math.round(t * i) / i) >= 1e-15 && t < 1 ? t.toFixed(this.us).replace(/\.?0+$/, "") : String(t), e.replace(/(\.[1-9]*)0+$/, (s, r) => r);
  }
}
function rs(n, t, e, i, s, r, h) {
  if (t.length === 0 || i.from >= t.length || i.to <= 0) return;
  const { context: o, horizontalPixelRatio: l, verticalPixelRatio: c } = n, a = t[i.from];
  let u = r(n, a), d = a;
  if (i.to - i.from < 2) {
    const p = s / 2;
    o.beginPath();
    const f = { nt: a.nt - p, st: a.st }, v = { nt: a.nt + p, st: a.st };
    o.moveTo(f.nt * l, f.st * c), o.lineTo(v.nt * l, v.st * c), h(n, u, f, v);
  } else {
    const p = (v, g) => {
      h(n, u, d, g), o.beginPath(), u = v, d = g;
    };
    let f = d;
    o.beginPath(), o.moveTo(a.nt * l, a.st * c);
    for (let v = i.from + 1; v < i.to; ++v) {
      f = t[v];
      const g = r(n, f);
      switch (e) {
        case 0:
          o.lineTo(f.nt * l, f.st * c);
          break;
        case 1:
          o.lineTo(f.nt * l, t[v - 1].st * c), g !== u && (p(g, f), o.lineTo(f.nt * l, t[v - 1].st * c)), o.lineTo(f.nt * l, f.st * c);
          break;
        case 2: {
          const [y, x] = Cn(t, v - 1, v);
          o.bezierCurveTo(y.nt * l, y.st * c, x.nt * l, x.st * c, f.nt * l, f.st * c);
          break;
        }
      }
      e !== 1 && g !== u && (p(g, f), o.moveTo(f.nt * l, f.st * c));
    }
    (d !== f || d === f && e === 1) && h(n, u, d, f);
  }
}
const ni = 6;
function oe(n, t) {
  return { nt: n.nt - t.nt, st: n.st - t.st };
}
function ri(n, t) {
  return { nt: n.nt / t, st: n.st / t };
}
function Cn(n, t, e) {
  const i = Math.max(0, t - 1), s = Math.min(n.length - 1, e + 1);
  var r, h;
  return [(r = n[t], h = ri(oe(n[e], n[i]), ni), { nt: r.nt + h.nt, st: r.st + h.st }), oe(n[e], ri(oe(n[s], n[t]), ni))];
}
function Nn(n, t, e, i, s) {
  const { context: r, horizontalPixelRatio: h, verticalPixelRatio: o } = t;
  r.lineTo(s.nt * h, n * o), r.lineTo(i.nt * h, n * o), r.closePath(), r.fillStyle = e, r.fill();
}
class hs extends q {
  constructor() {
    super(...arguments), this.G = null;
  }
  J(t) {
    this.G = t;
  }
  K(t) {
    var e;
    if (this.G === null) return;
    const { it: i, tt: s, ds: r, et: h, Nt: o, fs: l } = this.G, c = (e = this.G.vs) !== null && e !== void 0 ? e : this.G.ps ? 0 : t.mediaSize.height;
    if (s === null) return;
    const a = t.context;
    a.lineCap = "butt", a.lineJoin = "round", a.lineWidth = h, pt(a, o), a.lineWidth = 1, rs(t, i, l, s, r, this.bs.bind(this), Nn.bind(null, c));
  }
}
function Ne(n, t, e) {
  return Math.min(Math.max(n, t), e);
}
function It(n, t, e) {
  return t - n <= e;
}
function os(n) {
  const t = Math.ceil(n);
  return t % 2 == 0 ? t - 1 : t;
}
class Oe {
  ws(t, e) {
    const i = this.gs, { Ms: s, xs: r, Ss: h, ks: o, ys: l, vs: c } = e;
    if (this.Cs === void 0 || i === void 0 || i.Ms !== s || i.xs !== r || i.Ss !== h || i.ks !== o || i.vs !== c || i.ys !== l) {
      const a = t.context.createLinearGradient(0, 0, 0, l);
      if (a.addColorStop(0, s), c != null) {
        const u = Ne(c * t.verticalPixelRatio / l, 0, 1);
        a.addColorStop(u, r), a.addColorStop(u, h);
      }
      a.addColorStop(1, o), this.Cs = a, this.gs = e;
    }
    return this.Cs;
  }
}
class zn extends hs {
  constructor() {
    super(...arguments), this.Ts = new Oe();
  }
  bs(t, e) {
    return this.Ts.ws(t, { Ms: e.Ps, xs: "", Ss: "", ks: e.Rs, ys: t.bitmapSize.height });
  }
}
function En(n, t) {
  const e = n.context;
  e.strokeStyle = t, e.stroke();
}
class ls extends q {
  constructor() {
    super(...arguments), this.G = null;
  }
  J(t) {
    this.G = t;
  }
  K(t) {
    if (this.G === null) return;
    const { it: e, tt: i, ds: s, fs: r, et: h, Nt: o, Ds: l } = this.G;
    if (i === null) return;
    const c = t.context;
    c.lineCap = "butt", c.lineWidth = h * t.verticalPixelRatio, pt(c, o), c.lineJoin = "round";
    const a = this.Vs.bind(this);
    r !== void 0 && rs(t, e, r, i, s, a, En), l && function(u, d, p, f, v) {
      const { horizontalPixelRatio: g, verticalPixelRatio: y, context: x } = u;
      let _ = null;
      const S = Math.max(1, Math.floor(g)) % 2 / 2, E = p * y + S;
      for (let z = f.to - 1; z >= f.from; --z) {
        const T = d[z];
        if (T) {
          const N = v(u, T);
          N !== _ && (x.beginPath(), _ !== null && x.fill(), x.fillStyle = N, _ = N);
          const W = Math.round(T.nt * g) + S, R = T.st * y;
          x.moveTo(W, R), x.arc(W, R, E, 0, 2 * Math.PI);
        }
      }
      x.fill();
    }(t, e, l, i, a);
  }
}
class cs extends ls {
  Vs(t, e) {
    return e.lt;
  }
}
function as(n, t, e, i, s = 0, r = t.length) {
  let h = r - s;
  for (; 0 < h; ) {
    const o = h >> 1, l = s + o;
    i(t[l], e) === n ? (s = l + 1, h -= o + 1) : h = o;
  }
  return s;
}
const Dt = as.bind(null, !0), us = as.bind(null, !1);
function kn(n, t) {
  return n.ot < t;
}
function Ln(n, t) {
  return t < n.ot;
}
function ds(n, t, e) {
  const i = t.Os(), s = t.ui(), r = Dt(n, i, kn), h = us(n, s, Ln);
  if (!e) return { from: r, to: h };
  let o = r, l = h;
  return r > 0 && r < n.length && n[r].ot >= i && (o = r - 1), h > 0 && h < n.length && n[h - 1].ot <= s && (l = h + 1), { from: o, to: l };
}
class We {
  constructor(t, e, i) {
    this.Bs = !0, this.As = !0, this.Is = !0, this.zs = [], this.Ls = null, this.Es = t, this.Ns = e, this.Fs = i;
  }
  bt(t) {
    this.Bs = !0, t === "data" && (this.As = !0), t === "options" && (this.Is = !0);
  }
  gt() {
    return this.Es.yt() ? (this.Ws(), this.Ls === null ? null : this.js) : null;
  }
  Hs() {
    this.zs = this.zs.map((t) => Object.assign(Object.assign({}, t), this.Es.Us().$s(t.ot)));
  }
  qs() {
    this.Ls = null;
  }
  Ws() {
    this.As && (this.Ys(), this.As = !1), this.Is && (this.Hs(), this.Is = !1), this.Bs && (this.Zs(), this.Bs = !1);
  }
  Zs() {
    const t = this.Es.Dt(), e = this.Ns.St();
    if (this.qs(), e.Ni() || t.Ni()) return;
    const i = e.Xs();
    if (i === null || this.Es.In().Ks() === 0) return;
    const s = this.Es.Ct();
    s !== null && (this.Ls = ds(this.zs, i, this.Fs), this.Gs(t, e, s.Vt), this.Js());
  }
}
class he extends We {
  constructor(t, e) {
    super(t, e, !0);
  }
  Gs(t, e, i) {
    e.Qs(this.zs, Vt(this.Ls)), t.te(this.zs, i, Vt(this.Ls));
  }
  ie(t, e) {
    return { ot: t, _t: e, nt: NaN, st: NaN };
  }
  Ys() {
    const t = this.Es.Us();
    this.zs = this.Es.In().ne().map((e) => {
      const i = e.Vt[3];
      return this.se(e.ee, i, t);
    });
  }
}
class Tn extends he {
  constructor(t, e) {
    super(t, e), this.js = new Ve(), this.re = new zn(), this.he = new cs(), this.js.Z([this.re, this.he]);
  }
  se(t, e, i) {
    return Object.assign(Object.assign({}, this.ie(t, e)), i.$s(t));
  }
  Js() {
    const t = this.Es.W();
    this.re.J({ fs: t.lineType, it: this.zs, Nt: t.lineStyle, et: t.lineWidth, vs: null, ps: t.invertFilledArea, tt: this.Ls, ds: this.Ns.St().le() }), this.he.J({ fs: t.lineVisible ? t.lineType : void 0, it: this.zs, Nt: t.lineStyle, et: t.lineWidth, tt: this.Ls, ds: this.Ns.St().le(), Ds: t.pointMarkersVisible ? t.pointMarkersRadius || t.lineWidth / 2 + 2 : void 0 });
  }
}
class Pn extends q {
  constructor() {
    super(...arguments), this.zt = null, this.ae = 0, this.oe = 0;
  }
  J(t) {
    this.zt = t;
  }
  K({ context: t, horizontalPixelRatio: e, verticalPixelRatio: i }) {
    if (this.zt === null || this.zt.In.length === 0 || this.zt.tt === null) return;
    this.ae = this._e(e), this.ae >= 2 && Math.max(1, Math.floor(e)) % 2 != this.ae % 2 && this.ae--, this.oe = this.zt.ue ? Math.min(this.ae, Math.floor(e)) : this.ae;
    let s = null;
    const r = this.oe <= this.ae && this.zt.le >= Math.floor(1.5 * e);
    for (let h = this.zt.tt.from; h < this.zt.tt.to; ++h) {
      const o = this.zt.In[h];
      s !== o.ce && (t.fillStyle = o.ce, s = o.ce);
      const l = Math.floor(0.5 * this.oe), c = Math.round(o.nt * e), a = c - l, u = this.oe, d = a + u - 1, p = Math.min(o.de, o.fe), f = Math.max(o.de, o.fe), v = Math.round(p * i) - l, g = Math.round(f * i) + l, y = Math.max(g - v, this.oe);
      t.fillRect(a, v, u, y);
      const x = Math.ceil(1.5 * this.ae);
      if (r) {
        if (this.zt.ve) {
          const z = c - x;
          let T = Math.max(v, Math.round(o.pe * i) - l), N = T + u - 1;
          N > v + y - 1 && (N = v + y - 1, T = N - u + 1), t.fillRect(z, T, a - z, N - T + 1);
        }
        const _ = c + x;
        let S = Math.max(v, Math.round(o.me * i) - l), E = S + u - 1;
        E > v + y - 1 && (E = v + y - 1, S = E - u + 1), t.fillRect(d + 1, S, _ - d, E - S + 1);
      }
    }
  }
  _e(t) {
    const e = Math.floor(t);
    return Math.max(e, Math.floor(function(i, s) {
      return Math.floor(0.3 * i * s);
    }(w(this.zt).le, t)));
  }
}
class fs extends We {
  constructor(t, e) {
    super(t, e, !1);
  }
  Gs(t, e, i) {
    e.Qs(this.zs, Vt(this.Ls)), t.be(this.zs, i, Vt(this.Ls));
  }
  we(t, e, i) {
    return { ot: t, ge: e.Vt[0], Me: e.Vt[1], xe: e.Vt[2], Se: e.Vt[3], nt: NaN, pe: NaN, de: NaN, fe: NaN, me: NaN };
  }
  Ys() {
    const t = this.Es.Us();
    this.zs = this.Es.In().ne().map((e) => this.se(e.ee, e, t));
  }
}
class $n extends fs {
  constructor() {
    super(...arguments), this.js = new Pn();
  }
  se(t, e, i) {
    return Object.assign(Object.assign({}, this.we(t, e, i)), i.$s(t));
  }
  Js() {
    const t = this.Es.W();
    this.js.J({ In: this.zs, le: this.Ns.St().le(), ve: t.openVisible, ue: t.thinBars, tt: this.Ls });
  }
}
class Vn extends hs {
  constructor() {
    super(...arguments), this.Ts = new Oe();
  }
  bs(t, e) {
    const i = this.G;
    return this.Ts.ws(t, { Ms: e.ke, xs: e.ye, Ss: e.Ce, ks: e.Te, ys: t.bitmapSize.height, vs: i.vs });
  }
}
class Rn extends ls {
  constructor() {
    super(...arguments), this.Pe = new Oe();
  }
  Vs(t, e) {
    const i = this.G;
    return this.Pe.ws(t, { Ms: e.Re, xs: e.Re, Ss: e.De, ks: e.De, ys: t.bitmapSize.height, vs: i.vs });
  }
}
class On extends he {
  constructor(t, e) {
    super(t, e), this.js = new Ve(), this.Ve = new Vn(), this.Oe = new Rn(), this.js.Z([this.Ve, this.Oe]);
  }
  se(t, e, i) {
    return Object.assign(Object.assign({}, this.ie(t, e)), i.$s(t));
  }
  Js() {
    const t = this.Es.Ct();
    if (t === null) return;
    const e = this.Es.W(), i = this.Es.Dt().Rt(e.baseValue.price, t.Vt), s = this.Ns.St().le();
    this.Ve.J({ it: this.zs, et: e.lineWidth, Nt: e.lineStyle, fs: e.lineType, vs: i, ps: !1, tt: this.Ls, ds: s }), this.Oe.J({ it: this.zs, et: e.lineWidth, Nt: e.lineStyle, fs: e.lineVisible ? e.lineType : void 0, Ds: e.pointMarkersVisible ? e.pointMarkersRadius || e.lineWidth / 2 + 2 : void 0, vs: i, tt: this.Ls, ds: s });
  }
}
class Wn extends q {
  constructor() {
    super(...arguments), this.zt = null, this.ae = 0;
  }
  J(t) {
    this.zt = t;
  }
  K(t) {
    if (this.zt === null || this.zt.In.length === 0 || this.zt.tt === null) return;
    const { horizontalPixelRatio: e } = t;
    this.ae = function(r, h) {
      if (r >= 2.5 && r <= 4) return Math.floor(3 * h);
      const o = 1 - 0.2 * Math.atan(Math.max(4, r) - 4) / (0.5 * Math.PI), l = Math.floor(r * o * h), c = Math.floor(r * h), a = Math.min(l, c);
      return Math.max(Math.floor(h), a);
    }(this.zt.le, e), this.ae >= 2 && Math.floor(e) % 2 != this.ae % 2 && this.ae--;
    const i = this.zt.In;
    this.zt.Be && this.Ae(t, i, this.zt.tt), this.zt._i && this.Ie(t, i, this.zt.tt);
    const s = this.ze(e);
    (!this.zt._i || this.ae > 2 * s) && this.Le(t, i, this.zt.tt);
  }
  Ae(t, e, i) {
    if (this.zt === null) return;
    const { context: s, horizontalPixelRatio: r, verticalPixelRatio: h } = t;
    let o = "", l = Math.min(Math.floor(r), Math.floor(this.zt.le * r));
    l = Math.max(Math.floor(r), Math.min(l, this.ae));
    const c = Math.floor(0.5 * l);
    let a = null;
    for (let u = i.from; u < i.to; u++) {
      const d = e[u];
      d.Ee !== o && (s.fillStyle = d.Ee, o = d.Ee);
      const p = Math.round(Math.min(d.pe, d.me) * h), f = Math.round(Math.max(d.pe, d.me) * h), v = Math.round(d.de * h), g = Math.round(d.fe * h);
      let y = Math.round(r * d.nt) - c;
      const x = y + l - 1;
      a !== null && (y = Math.max(a + 1, y), y = Math.min(y, x));
      const _ = x - y + 1;
      s.fillRect(y, v, _, p - v), s.fillRect(y, f + 1, _, g - f), a = x;
    }
  }
  ze(t) {
    let e = Math.floor(1 * t);
    this.ae <= 2 * e && (e = Math.floor(0.5 * (this.ae - 1)));
    const i = Math.max(Math.floor(t), e);
    return this.ae <= 2 * i ? Math.max(Math.floor(t), Math.floor(1 * t)) : i;
  }
  Ie(t, e, i) {
    if (this.zt === null) return;
    const { context: s, horizontalPixelRatio: r, verticalPixelRatio: h } = t;
    let o = "";
    const l = this.ze(r);
    let c = null;
    for (let a = i.from; a < i.to; a++) {
      const u = e[a];
      u.Ne !== o && (s.fillStyle = u.Ne, o = u.Ne);
      let d = Math.round(u.nt * r) - Math.floor(0.5 * this.ae);
      const p = d + this.ae - 1, f = Math.round(Math.min(u.pe, u.me) * h), v = Math.round(Math.max(u.pe, u.me) * h);
      if (c !== null && (d = Math.max(c + 1, d), d = Math.min(d, p)), this.zt.le * r > 2 * l) wn(s, d, f, p - d + 1, v - f + 1, l);
      else {
        const g = p - d + 1;
        s.fillRect(d, f, g, v - f + 1);
      }
      c = p;
    }
  }
  Le(t, e, i) {
    if (this.zt === null) return;
    const { context: s, horizontalPixelRatio: r, verticalPixelRatio: h } = t;
    let o = "";
    const l = this.ze(r);
    for (let c = i.from; c < i.to; c++) {
      const a = e[c];
      let u = Math.round(Math.min(a.pe, a.me) * h), d = Math.round(Math.max(a.pe, a.me) * h), p = Math.round(a.nt * r) - Math.floor(0.5 * this.ae), f = p + this.ae - 1;
      if (a.ce !== o) {
        const v = a.ce;
        s.fillStyle = v, o = v;
      }
      this.zt._i && (p += l, u += l, f -= l, d -= l), u > d || s.fillRect(p, u, f - p + 1, d - u + 1);
    }
  }
}
class Dn extends fs {
  constructor() {
    super(...arguments), this.js = new Wn();
  }
  se(t, e, i) {
    return Object.assign(Object.assign({}, this.we(t, e, i)), i.$s(t));
  }
  Js() {
    const t = this.Es.W();
    this.js.J({ In: this.zs, le: this.Ns.St().le(), Be: t.wickVisible, _i: t.borderVisible, tt: this.Ls });
  }
}
class Bn {
  constructor(t, e) {
    this.Fe = t, this.Li = e;
  }
  X(t, e, i) {
    this.Fe.draw(t, this.Li, e, i);
  }
}
class le extends We {
  constructor(t, e, i) {
    super(t, e, !1), this.wn = i, this.js = new Bn(this.wn.renderer(), (s) => {
      const r = t.Ct();
      return r === null ? null : t.Dt().Rt(s, r.Vt);
    });
  }
  We(t) {
    return this.wn.priceValueBuilder(t);
  }
  je(t) {
    return this.wn.isWhitespace(t);
  }
  Ys() {
    const t = this.Es.Us();
    this.zs = this.Es.In().ne().map((e) => Object.assign(Object.assign({ ot: e.ee, nt: NaN }, t.$s(e.ee)), { He: e.$e }));
  }
  Gs(t, e) {
    e.Qs(this.zs, Vt(this.Ls));
  }
  Js() {
    this.wn.update({ bars: this.zs.map(In), barSpacing: this.Ns.St().le(), visibleRange: this.Ls }, this.Es.W());
  }
}
function In(n) {
  return { x: n.nt, time: n.ot, originalData: n.He, barColor: n.ce };
}
class Fn extends q {
  constructor() {
    super(...arguments), this.zt = null, this.Ue = [];
  }
  J(t) {
    this.zt = t, this.Ue = [];
  }
  K({ context: t, horizontalPixelRatio: e, verticalPixelRatio: i }) {
    if (this.zt === null || this.zt.it.length === 0 || this.zt.tt === null) return;
    this.Ue.length || this.qe(e);
    const s = Math.max(1, Math.floor(i)), r = Math.round(this.zt.Ye * i) - Math.floor(s / 2), h = r + s;
    for (let o = this.zt.tt.from; o < this.zt.tt.to; o++) {
      const l = this.zt.it[o], c = this.Ue[o - this.zt.tt.from], a = Math.round(l.st * i);
      let u, d;
      t.fillStyle = l.ce, a <= r ? (u = a, d = h) : (u = r, d = a - Math.floor(s / 2) + s), t.fillRect(c.Os, u, c.ui - c.Os + 1, d - u);
    }
  }
  qe(t) {
    if (this.zt === null || this.zt.it.length === 0 || this.zt.tt === null) return void (this.Ue = []);
    const e = Math.ceil(this.zt.le * t) <= 1 ? 0 : Math.max(1, Math.floor(t)), i = Math.round(this.zt.le * t) - e;
    this.Ue = new Array(this.zt.tt.to - this.zt.tt.from);
    for (let r = this.zt.tt.from; r < this.zt.tt.to; r++) {
      const h = this.zt.it[r], o = Math.round(h.nt * t);
      let l, c;
      if (i % 2) {
        const a = (i - 1) / 2;
        l = o - a, c = o + a;
      } else {
        const a = i / 2;
        l = o - a, c = o + a - 1;
      }
      this.Ue[r - this.zt.tt.from] = { Os: l, ui: c, Ze: o, Xe: h.nt * t, ot: h.ot };
    }
    for (let r = this.zt.tt.from + 1; r < this.zt.tt.to; r++) {
      const h = this.Ue[r - this.zt.tt.from], o = this.Ue[r - this.zt.tt.from - 1];
      h.ot === o.ot + 1 && h.Os - o.ui !== e + 1 && (o.Ze > o.Xe ? o.ui = h.Os - e - 1 : h.Os = o.ui + e + 1);
    }
    let s = Math.ceil(this.zt.le * t);
    for (let r = this.zt.tt.from; r < this.zt.tt.to; r++) {
      const h = this.Ue[r - this.zt.tt.from];
      h.ui < h.Os && (h.ui = h.Os);
      const o = h.ui - h.Os + 1;
      s = Math.min(o, s);
    }
    if (e > 0 && s < 4) for (let r = this.zt.tt.from; r < this.zt.tt.to; r++) {
      const h = this.Ue[r - this.zt.tt.from];
      h.ui - h.Os + 1 > s && (h.Ze > h.Xe ? h.ui -= 1 : h.Os += 1);
    }
  }
}
class jn extends he {
  constructor() {
    super(...arguments), this.js = new Fn();
  }
  se(t, e, i) {
    return Object.assign(Object.assign({}, this.ie(t, e)), i.$s(t));
  }
  Js() {
    const t = { it: this.zs, le: this.Ns.St().le(), tt: this.Ls, Ye: this.Es.Dt().Rt(this.Es.W().base, w(this.Es.Ct()).Vt) };
    this.js.J(t);
  }
}
class Kn extends he {
  constructor() {
    super(...arguments), this.js = new cs();
  }
  se(t, e, i) {
    return Object.assign(Object.assign({}, this.ie(t, e)), i.$s(t));
  }
  Js() {
    const t = this.Es.W(), e = { it: this.zs, Nt: t.lineStyle, fs: t.lineVisible ? t.lineType : void 0, et: t.lineWidth, Ds: t.pointMarkersVisible ? t.pointMarkersRadius || t.lineWidth / 2 + 2 : void 0, tt: this.Ls, ds: this.Ns.St().le() };
    this.js.J(e);
  }
}
const An = /[2-9]/g;
class Rt {
  constructor(t = 50) {
    this.Ke = 0, this.Ge = 1, this.Je = 1, this.Qe = {}, this.tr = /* @__PURE__ */ new Map(), this.ir = t;
  }
  nr() {
    this.Ke = 0, this.tr.clear(), this.Ge = 1, this.Je = 1, this.Qe = {};
  }
  xi(t, e, i) {
    return this.sr(t, e, i).width;
  }
  Mi(t, e, i) {
    const s = this.sr(t, e, i);
    return ((s.actualBoundingBoxAscent || 0) - (s.actualBoundingBoxDescent || 0)) / 2;
  }
  sr(t, e, i) {
    const s = i || An, r = String(e).replace(s, "0");
    if (this.tr.has(r)) return B(this.tr.get(r)).er;
    if (this.Ke === this.ir) {
      const o = this.Qe[this.Je];
      delete this.Qe[this.Je], this.tr.delete(o), this.Je++, this.Ke--;
    }
    t.save(), t.textBaseline = "middle";
    const h = t.measureText(r);
    return t.restore(), h.width === 0 && e.length || (this.tr.set(r, { er: h, rr: this.Ge }), this.Qe[this.Ge] = r, this.Ke++, this.Ge++), h;
  }
}
class Xn {
  constructor(t) {
    this.hr = null, this.k = null, this.lr = "right", this.ar = t;
  }
  _r(t, e, i) {
    this.hr = t, this.k = e, this.lr = i;
  }
  X(t) {
    this.k !== null && this.hr !== null && this.hr.X(t, this.k, this.ar, this.lr);
  }
}
class ms {
  constructor(t, e, i) {
    this.ur = t, this.ar = new Rt(50), this.cr = e, this.F = i, this.j = -1, this.Wt = new Xn(this.ar);
  }
  gt() {
    const t = this.F.dr(this.cr);
    if (t === null) return null;
    const e = t.vr(this.cr) ? t.pr() : this.cr.Dt();
    if (e === null) return null;
    const i = t.mr(e);
    if (i === "overlay") return null;
    const s = this.F.br();
    return s.P !== this.j && (this.j = s.P, this.ar.nr()), this.Wt._r(this.ur.Ii(), s, i), this.Wt;
  }
}
class Hn extends q {
  constructor() {
    super(...arguments), this.zt = null;
  }
  J(t) {
    this.zt = t;
  }
  wr(t, e) {
    var i;
    if (!(!((i = this.zt) === null || i === void 0) && i.yt)) return null;
    const { st: s, et: r, gr: h } = this.zt;
    return e >= s - r - 7 && e <= s + r + 7 ? { Mr: this.zt, gr: h } : null;
  }
  K({ context: t, bitmapSize: e, horizontalPixelRatio: i, verticalPixelRatio: s }) {
    if (this.zt === null || this.zt.yt === !1) return;
    const r = Math.round(this.zt.st * s);
    r < 0 || r > e.height || (t.lineCap = "butt", t.strokeStyle = this.zt.V, t.lineWidth = Math.floor(this.zt.et * i), pt(t, this.zt.Nt), Zi(t, r, 0, e.width));
  }
}
class De {
  constructor(t) {
    this.Sr = { st: 0, V: "rgba(0, 0, 0, 0)", et: 1, Nt: 0, yt: !1 }, this.kr = new Hn(), this.ft = !0, this.Es = t, this.Ns = t.$t(), this.kr.J(this.Sr);
  }
  bt() {
    this.ft = !0;
  }
  gt() {
    return this.Es.yt() ? (this.ft && (this.yr(), this.ft = !1), this.kr) : null;
  }
}
class Un extends De {
  constructor(t) {
    super(t);
  }
  yr() {
    this.Sr.yt = !1;
    const t = this.Es.Dt(), e = t.Cr().Cr;
    if (e !== 2 && e !== 3) return;
    const i = this.Es.W();
    if (!i.baseLineVisible || !this.Es.yt()) return;
    const s = this.Es.Ct();
    s !== null && (this.Sr.yt = !0, this.Sr.st = t.Rt(s.Vt, s.Vt), this.Sr.V = i.baseLineColor, this.Sr.et = i.baseLineWidth, this.Sr.Nt = i.baseLineStyle);
  }
}
class qn extends q {
  constructor() {
    super(...arguments), this.zt = null;
  }
  J(t) {
    this.zt = t;
  }
  $e() {
    return this.zt;
  }
  K({ context: t, horizontalPixelRatio: e, verticalPixelRatio: i }) {
    const s = this.zt;
    if (s === null) return;
    const r = Math.max(1, Math.floor(e)), h = r % 2 / 2, o = Math.round(s.Xe.x * e) + h, l = s.Xe.y * i;
    t.fillStyle = s.Tr, t.beginPath();
    const c = Math.max(2, 1.5 * s.Pr) * e;
    t.arc(o, l, c, 0, 2 * Math.PI, !1), t.fill(), t.fillStyle = s.Rr, t.beginPath(), t.arc(o, l, s.ht * e, 0, 2 * Math.PI, !1), t.fill(), t.lineWidth = r, t.strokeStyle = s.Dr, t.beginPath(), t.arc(o, l, s.ht * e + r / 2, 0, 2 * Math.PI, !1), t.stroke();
  }
}
const Jn = [{ Vr: 0, Or: 0.25, Br: 4, Ar: 10, Ir: 0.25, zr: 0, Lr: 0.4, Er: 0.8 }, { Vr: 0.25, Or: 0.525, Br: 10, Ar: 14, Ir: 0, zr: 0, Lr: 0.8, Er: 0 }, { Vr: 0.525, Or: 1, Br: 14, Ar: 14, Ir: 0, zr: 0, Lr: 0, Er: 0 }];
function hi(n, t, e, i) {
  return function(s, r) {
    if (s === "transparent") return s;
    const h = Pt(s), o = h[3];
    return `rgba(${h[0]}, ${h[1]}, ${h[2]}, ${r * o})`;
  }(n, e + (i - e) * t);
}
function oi(n, t) {
  const e = n % 2600 / 2600;
  let i;
  for (const l of Jn) if (e >= l.Vr && e <= l.Or) {
    i = l;
    break;
  }
  ct(i !== void 0, "Last price animation internal logic error");
  const s = (e - i.Vr) / (i.Or - i.Vr);
  return { Rr: hi(t, s, i.Ir, i.zr), Dr: hi(t, s, i.Lr, i.Er), ht: (r = s, h = i.Br, o = i.Ar, h + (o - h) * r) };
  var r, h, o;
}
class Gn {
  constructor(t) {
    this.Wt = new qn(), this.ft = !0, this.Nr = !0, this.Fr = performance.now(), this.Wr = this.Fr - 1, this.jr = t;
  }
  Hr() {
    this.Wr = this.Fr - 1, this.bt();
  }
  $r() {
    if (this.bt(), this.jr.W().lastPriceAnimation === 2) {
      const t = performance.now(), e = this.Wr - t;
      if (e > 0) return void (e < 650 && (this.Wr += 2600));
      this.Fr = t, this.Wr = t + 2600;
    }
  }
  bt() {
    this.ft = !0;
  }
  Ur() {
    this.Nr = !0;
  }
  yt() {
    return this.jr.W().lastPriceAnimation !== 0;
  }
  qr() {
    switch (this.jr.W().lastPriceAnimation) {
      case 0:
        return !1;
      case 1:
        return !0;
      case 2:
        return performance.now() <= this.Wr;
    }
  }
  gt() {
    return this.ft ? (this.Mt(), this.ft = !1, this.Nr = !1) : this.Nr && (this.Yr(), this.Nr = !1), this.Wt;
  }
  Mt() {
    this.Wt.J(null);
    const t = this.jr.$t().St(), e = t.Xs(), i = this.jr.Ct();
    if (e === null || i === null) return;
    const s = this.jr.Zr(!0);
    if (s.Xr || !e.Kr(s.ee)) return;
    const r = { x: t.It(s.ee), y: this.jr.Dt().Rt(s._t, i.Vt) }, h = s.V, o = this.jr.W().lineWidth, l = oi(this.Gr(), h);
    this.Wt.J({ Tr: h, Pr: o, Rr: l.Rr, Dr: l.Dr, ht: l.ht, Xe: r });
  }
  Yr() {
    const t = this.Wt.$e();
    if (t !== null) {
      const e = oi(this.Gr(), t.Tr);
      t.Rr = e.Rr, t.Dr = e.Dr, t.ht = e.ht;
    }
  }
  Gr() {
    return this.qr() ? performance.now() - this.Fr : 2599;
  }
}
function Et(n, t) {
  return os(Math.min(Math.max(n, 12), 30) * t);
}
function Ot(n, t) {
  switch (n) {
    case "arrowDown":
    case "arrowUp":
      return Et(t, 1);
    case "circle":
      return Et(t, 0.8);
    case "square":
      return Et(t, 0.7);
  }
}
function ps(n) {
  return function(t) {
    const e = Math.ceil(t);
    return e % 2 != 0 ? e - 1 : e;
  }(Et(n, 1));
}
function li(n) {
  return Math.max(Et(n, 0.1), 3);
}
function ci(n, t, e) {
  return t ? n : e ? Math.ceil(n / 2) : 0;
}
function vs(n, t, e, i, s) {
  const r = Ot("square", e), h = (r - 1) / 2, o = n - h, l = t - h;
  return i >= o && i <= o + r && s >= l && s <= l + r;
}
function ai(n, t, e, i) {
  const s = (Ot("arrowUp", i) - 1) / 2 * e.Jr, r = (os(i / 2) - 1) / 2 * e.Jr;
  t.beginPath(), n ? (t.moveTo(e.nt - s, e.st), t.lineTo(e.nt, e.st - s), t.lineTo(e.nt + s, e.st), t.lineTo(e.nt + r, e.st), t.lineTo(e.nt + r, e.st + s), t.lineTo(e.nt - r, e.st + s), t.lineTo(e.nt - r, e.st)) : (t.moveTo(e.nt - s, e.st), t.lineTo(e.nt, e.st + s), t.lineTo(e.nt + s, e.st), t.lineTo(e.nt + r, e.st), t.lineTo(e.nt + r, e.st - s), t.lineTo(e.nt - r, e.st - s), t.lineTo(e.nt - r, e.st)), t.fill();
}
function Qn(n, t, e, i, s, r) {
  return vs(t, e, i, s, r);
}
class Yn extends q {
  constructor() {
    super(...arguments), this.zt = null, this.ar = new Rt(), this.j = -1, this.H = "", this.Qr = "";
  }
  J(t) {
    this.zt = t;
  }
  _r(t, e) {
    this.j === t && this.H === e || (this.j = t, this.H = e, this.Qr = _t(t, e), this.ar.nr());
  }
  wr(t, e) {
    if (this.zt === null || this.zt.tt === null) return null;
    for (let i = this.zt.tt.from; i < this.zt.tt.to; i++) {
      const s = this.zt.it[i];
      if (tr(s, t, e)) return { Mr: s.th, gr: s.gr };
    }
    return null;
  }
  K({ context: t, horizontalPixelRatio: e, verticalPixelRatio: i }, s, r) {
    if (this.zt !== null && this.zt.tt !== null) {
      t.textBaseline = "middle", t.font = this.Qr;
      for (let h = this.zt.tt.from; h < this.zt.tt.to; h++) {
        const o = this.zt.it[h];
        o.Kt !== void 0 && (o.Kt.Hi = this.ar.xi(t, o.Kt.ih), o.Kt.At = this.j, o.Kt.nt = o.nt - o.Kt.Hi / 2), Zn(o, t, e, i);
      }
    }
  }
}
function Zn(n, t, e, i) {
  t.fillStyle = n.V, n.Kt !== void 0 && function(s, r, h, o, l, c) {
    s.save(), s.scale(l, c), s.fillText(r, h, o), s.restore();
  }(t, n.Kt.ih, n.Kt.nt, n.Kt.st, e, i), function(s, r, h) {
    if (s.Ks !== 0) {
      switch (s.nh) {
        case "arrowDown":
          return void ai(!1, r, h, s.Ks);
        case "arrowUp":
          return void ai(!0, r, h, s.Ks);
        case "circle":
          return void function(o, l, c) {
            const a = (Ot("circle", c) - 1) / 2;
            o.beginPath(), o.arc(l.nt, l.st, a * l.Jr, 0, 2 * Math.PI, !1), o.fill();
          }(r, h, s.Ks);
        case "square":
          return void function(o, l, c) {
            const a = Ot("square", c), u = (a - 1) * l.Jr / 2, d = l.nt - u, p = l.st - u;
            o.fillRect(d, p, a * l.Jr, a * l.Jr);
          }(r, h, s.Ks);
      }
      s.nh;
    }
  }(n, t, function(s, r, h) {
    const o = Math.max(1, Math.floor(r)) % 2 / 2;
    return { nt: Math.round(s.nt * r) + o, st: s.st * h, Jr: r };
  }(n, e, i));
}
function tr(n, t, e) {
  return !(n.Kt === void 0 || !function(i, s, r, h, o, l) {
    const c = h / 2;
    return o >= i && o <= i + r && l >= s - c && l <= s + c;
  }(n.Kt.nt, n.Kt.st, n.Kt.Hi, n.Kt.At, t, e)) || function(i, s, r) {
    if (i.Ks === 0) return !1;
    switch (i.nh) {
      case "arrowDown":
      case "arrowUp":
        return Qn(0, i.nt, i.st, i.Ks, s, r);
      case "circle":
        return function(h, o, l, c, a) {
          const u = 2 + Ot("circle", l) / 2, d = h - c, p = o - a;
          return Math.sqrt(d * d + p * p) <= u;
        }(i.nt, i.st, i.Ks, s, r);
      case "square":
        return vs(i.nt, i.st, i.Ks, s, r);
    }
  }(n, t, e);
}
function er(n, t, e, i, s, r, h, o, l) {
  const c = Y(e) ? e : e.Se, a = Y(e) ? e : e.Me, u = Y(e) ? e : e.xe, d = Y(t.size) ? Math.max(t.size, 0) : 1, p = ps(o.le()) * d, f = p / 2;
  switch (n.Ks = p, t.position) {
    case "inBar":
      return n.st = h.Rt(c, l), void (n.Kt !== void 0 && (n.Kt.st = n.st + f + r + 0.6 * s));
    case "aboveBar":
      return n.st = h.Rt(a, l) - f - i.sh, n.Kt !== void 0 && (n.Kt.st = n.st - f - 0.6 * s, i.sh += 1.2 * s), void (i.sh += p + r);
    case "belowBar":
      return n.st = h.Rt(u, l) + f + i.eh, n.Kt !== void 0 && (n.Kt.st = n.st + f + r + 0.6 * s, i.eh += 1.2 * s), void (i.eh += p + r);
  }
  t.position;
}
class ir {
  constructor(t, e) {
    this.ft = !0, this.rh = !0, this.hh = !0, this.ah = null, this.oh = null, this.Wt = new Yn(), this.jr = t, this.$i = e, this.zt = { it: [], tt: null };
  }
  bt(t) {
    this.ft = !0, this.hh = !0, t === "data" && (this.rh = !0, this.oh = null);
  }
  gt(t) {
    if (!this.jr.yt()) return null;
    this.ft && this._h();
    const e = this.$i.W().layout;
    return this.Wt._r(e.fontSize, e.fontFamily), this.Wt.J(this.zt), this.Wt;
  }
  uh() {
    if (this.hh) {
      if (this.jr.dh().length > 0) {
        const t = this.$i.St().le(), e = li(t), i = 1.5 * ps(t) + 2 * e, s = this.fh();
        this.ah = { above: ci(i, s.aboveBar, s.inBar), below: ci(i, s.belowBar, s.inBar) };
      } else this.ah = null;
      this.hh = !1;
    }
    return this.ah;
  }
  fh() {
    return this.oh === null && (this.oh = this.jr.dh().reduce((t, e) => (t[e.position] || (t[e.position] = !0), t), { inBar: !1, aboveBar: !1, belowBar: !1 })), this.oh;
  }
  _h() {
    const t = this.jr.Dt(), e = this.$i.St(), i = this.jr.dh();
    this.rh && (this.zt.it = i.map((a) => ({ ot: a.time, nt: 0, st: 0, Ks: 0, nh: a.shape, V: a.color, th: a.th, gr: a.id, Kt: void 0 })), this.rh = !1);
    const s = this.$i.W().layout;
    this.zt.tt = null;
    const r = e.Xs();
    if (r === null) return;
    const h = this.jr.Ct();
    if (h === null || this.zt.it.length === 0) return;
    let o = NaN;
    const l = li(e.le()), c = { sh: l, eh: l };
    this.zt.tt = ds(this.zt.it, r, !0);
    for (let a = this.zt.tt.from; a < this.zt.tt.to; a++) {
      const u = i[a];
      u.time !== o && (c.sh = l, c.eh = l, o = u.time);
      const d = this.zt.it[a];
      d.nt = e.It(u.time), u.text !== void 0 && u.text.length > 0 && (d.Kt = { ih: u.text, nt: 0, st: 0, Hi: 0, At: 0 });
      const p = this.jr.ph(u.time);
      p !== null && er(d, u, p, c, s.fontSize, l, t, e, h.Vt);
    }
    this.ft = !1;
  }
}
class sr extends De {
  constructor(t) {
    super(t);
  }
  yr() {
    const t = this.Sr;
    t.yt = !1;
    const e = this.Es.W();
    if (!e.priceLineVisible || !this.Es.yt()) return;
    const i = this.Es.Zr(e.priceLineSource === 0);
    i.Xr || (t.yt = !0, t.st = i.ki, t.V = this.Es.mh(i.V), t.et = e.priceLineWidth, t.Nt = e.priceLineStyle);
  }
}
class nr extends se {
  constructor(t) {
    super(), this.jt = t;
  }
  zi(t, e, i) {
    t.yt = !1, e.yt = !1;
    const s = this.jt;
    if (!s.yt()) return;
    const r = s.W(), h = r.lastValueVisible, o = s.bh() !== "", l = r.seriesLastValueMode === 0, c = s.Zr(!1);
    if (c.Xr) return;
    h && (t.Kt = this.wh(c, h, l), t.yt = t.Kt.length !== 0), (o || l) && (e.Kt = this.gh(c, h, o, l), e.yt = e.Kt.length > 0);
    const a = s.mh(c.V), u = ee(a);
    i.t = u.t, i.ki = c.ki, e.Ot = s.$t().Bt(c.ki / s.Dt().At()), t.Ot = a, t.V = u.i, e.V = u.i;
  }
  gh(t, e, i, s) {
    let r = "";
    const h = this.jt.bh();
    return i && h.length !== 0 && (r += `${h} `), e && s && (r += this.jt.Dt().Mh() ? t.xh : t.Sh), r.trim();
  }
  wh(t, e, i) {
    return e ? i ? this.jt.Dt().Mh() ? t.Sh : t.xh : t.Kt : "";
  }
}
function ui(n, t, e, i) {
  const s = Number.isFinite(t), r = Number.isFinite(e);
  return s && r ? n(t, e) : s || r ? s ? t : e : i;
}
class I {
  constructor(t, e) {
    this.kh = t, this.yh = e;
  }
  Ch(t) {
    return t !== null && this.kh === t.kh && this.yh === t.yh;
  }
  Th() {
    return new I(this.kh, this.yh);
  }
  Ph() {
    return this.kh;
  }
  Rh() {
    return this.yh;
  }
  Dh() {
    return this.yh - this.kh;
  }
  Ni() {
    return this.yh === this.kh || Number.isNaN(this.yh) || Number.isNaN(this.kh);
  }
  ts(t) {
    return t === null ? this : new I(ui(Math.min, this.Ph(), t.Ph(), -1 / 0), ui(Math.max, this.Rh(), t.Rh(), 1 / 0));
  }
  Vh(t) {
    if (!Y(t) || this.yh - this.kh === 0) return;
    const e = 0.5 * (this.yh + this.kh);
    let i = this.yh - e, s = this.kh - e;
    i *= t, s *= t, this.yh = e + i, this.kh = e + s;
  }
  Oh(t) {
    Y(t) && (this.yh += t, this.kh += t);
  }
  Bh() {
    return { minValue: this.kh, maxValue: this.yh };
  }
  static Ah(t) {
    return t === null ? null : new I(t.minValue, t.maxValue);
  }
}
class Yt {
  constructor(t, e) {
    this.Ih = t, this.zh = e || null;
  }
  Lh() {
    return this.Ih;
  }
  Eh() {
    return this.zh;
  }
  Bh() {
    return this.Ih === null ? null : { priceRange: this.Ih.Bh(), margins: this.zh || void 0 };
  }
  static Ah(t) {
    return t === null ? null : new Yt(I.Ah(t.priceRange), t.margins);
  }
}
class rr extends De {
  constructor(t, e) {
    super(t), this.Nh = e;
  }
  yr() {
    const t = this.Sr;
    t.yt = !1;
    const e = this.Nh.W();
    if (!this.Es.yt() || !e.lineVisible) return;
    const i = this.Nh.Fh();
    i !== null && (t.yt = !0, t.st = i, t.V = e.color, t.et = e.lineWidth, t.Nt = e.lineStyle, t.gr = this.Nh.W().id);
  }
}
class hr extends se {
  constructor(t, e) {
    super(), this.jr = t, this.Nh = e;
  }
  zi(t, e, i) {
    t.yt = !1, e.yt = !1;
    const s = this.Nh.W(), r = s.axisLabelVisible, h = s.title !== "", o = this.jr;
    if (!r || !o.yt()) return;
    const l = this.Nh.Fh();
    if (l === null) return;
    h && (e.Kt = s.title, e.yt = !0), e.Ot = o.$t().Bt(l / o.Dt().At()), t.Kt = this.Wh(s.price), t.yt = !0;
    const c = ee(s.axisLabelColor || s.color);
    i.t = c.t;
    const a = s.axisLabelTextColor || c.i;
    t.V = a, e.V = a, i.ki = l;
  }
  Wh(t) {
    const e = this.jr.Ct();
    return e === null ? "" : this.jr.Dt().Fi(t, e.Vt);
  }
}
class or {
  constructor(t, e) {
    this.jr = t, this.cn = e, this.jh = new rr(t, this), this.ur = new hr(t, this), this.Hh = new ms(this.ur, t, t.$t());
  }
  $h(t) {
    U(this.cn, t), this.bt(), this.jr.$t().Uh();
  }
  W() {
    return this.cn;
  }
  qh() {
    return this.jh;
  }
  Yh() {
    return this.Hh;
  }
  Zh() {
    return this.ur;
  }
  bt() {
    this.jh.bt(), this.ur.bt();
  }
  Fh() {
    const t = this.jr, e = t.Dt();
    if (t.$t().St().Ni() || e.Ni()) return null;
    const i = t.Ct();
    return i === null ? null : e.Rt(this.cn.price, i.Vt);
  }
}
class lr extends Re {
  constructor(t) {
    super(), this.$i = t;
  }
  $t() {
    return this.$i;
  }
}
const cr = { Bar: (n, t, e, i) => {
  var s;
  const r = t.upColor, h = t.downColor, o = w(n(e, i)), l = yt(o.Vt[0]) <= yt(o.Vt[3]);
  return { ce: (s = o.V) !== null && s !== void 0 ? s : l ? r : h };
}, Candlestick: (n, t, e, i) => {
  var s, r, h;
  const o = t.upColor, l = t.downColor, c = t.borderUpColor, a = t.borderDownColor, u = t.wickUpColor, d = t.wickDownColor, p = w(n(e, i)), f = yt(p.Vt[0]) <= yt(p.Vt[3]);
  return { ce: (s = p.V) !== null && s !== void 0 ? s : f ? o : l, Ne: (r = p.Ot) !== null && r !== void 0 ? r : f ? c : a, Ee: (h = p.Xh) !== null && h !== void 0 ? h : f ? u : d };
}, Custom: (n, t, e, i) => {
  var s;
  return { ce: (s = w(n(e, i)).V) !== null && s !== void 0 ? s : t.color };
}, Area: (n, t, e, i) => {
  var s, r, h, o;
  const l = w(n(e, i));
  return { ce: (s = l.lt) !== null && s !== void 0 ? s : t.lineColor, lt: (r = l.lt) !== null && r !== void 0 ? r : t.lineColor, Ps: (h = l.Ps) !== null && h !== void 0 ? h : t.topColor, Rs: (o = l.Rs) !== null && o !== void 0 ? o : t.bottomColor };
}, Baseline: (n, t, e, i) => {
  var s, r, h, o, l, c;
  const a = w(n(e, i));
  return { ce: a.Vt[3] >= t.baseValue.price ? t.topLineColor : t.bottomLineColor, Re: (s = a.Re) !== null && s !== void 0 ? s : t.topLineColor, De: (r = a.De) !== null && r !== void 0 ? r : t.bottomLineColor, ke: (h = a.ke) !== null && h !== void 0 ? h : t.topFillColor1, ye: (o = a.ye) !== null && o !== void 0 ? o : t.topFillColor2, Ce: (l = a.Ce) !== null && l !== void 0 ? l : t.bottomFillColor1, Te: (c = a.Te) !== null && c !== void 0 ? c : t.bottomFillColor2 };
}, Line: (n, t, e, i) => {
  var s, r;
  const h = w(n(e, i));
  return { ce: (s = h.V) !== null && s !== void 0 ? s : t.color, lt: (r = h.V) !== null && r !== void 0 ? r : t.color };
}, Histogram: (n, t, e, i) => {
  var s;
  return { ce: (s = w(n(e, i)).V) !== null && s !== void 0 ? s : t.color };
} };
class ar {
  constructor(t) {
    this.Kh = (e, i) => i !== void 0 ? i.Vt : this.jr.In().Gh(e), this.jr = t, this.Jh = cr[t.Qh()];
  }
  $s(t, e) {
    return this.Jh(this.Kh, this.jr.W(), t, e);
  }
}
var di;
(function(n) {
  n[n.NearestLeft = -1] = "NearestLeft", n[n.None = 0] = "None", n[n.NearestRight = 1] = "NearestRight";
})(di || (di = {}));
const ot = 30;
class ur {
  constructor() {
    this.tl = [], this.il = /* @__PURE__ */ new Map(), this.nl = /* @__PURE__ */ new Map();
  }
  sl() {
    return this.Ks() > 0 ? this.tl[this.tl.length - 1] : null;
  }
  el() {
    return this.Ks() > 0 ? this.rl(0) : null;
  }
  An() {
    return this.Ks() > 0 ? this.rl(this.tl.length - 1) : null;
  }
  Ks() {
    return this.tl.length;
  }
  Ni() {
    return this.Ks() === 0;
  }
  Kr(t) {
    return this.hl(t, 0) !== null;
  }
  Gh(t) {
    return this.ll(t);
  }
  ll(t, e = 0) {
    const i = this.hl(t, e);
    return i === null ? null : Object.assign(Object.assign({}, this.al(i)), { ee: this.rl(i) });
  }
  ne() {
    return this.tl;
  }
  ol(t, e, i) {
    if (this.Ni()) return null;
    let s = null;
    for (const r of i)
      s = Ft(s, this._l(t, e, r));
    return s;
  }
  J(t) {
    this.nl.clear(), this.il.clear(), this.tl = t;
  }
  rl(t) {
    return this.tl[t].ee;
  }
  al(t) {
    return this.tl[t];
  }
  hl(t, e) {
    const i = this.ul(t);
    if (i === null && e !== 0) switch (e) {
      case -1:
        return this.cl(t);
      case 1:
        return this.dl(t);
      default:
        throw new TypeError("Unknown search mode");
    }
    return i;
  }
  cl(t) {
    let e = this.fl(t);
    return e > 0 && (e -= 1), e !== this.tl.length && this.rl(e) < t ? e : null;
  }
  dl(t) {
    const e = this.vl(t);
    return e !== this.tl.length && t < this.rl(e) ? e : null;
  }
  ul(t) {
    const e = this.fl(t);
    return e === this.tl.length || t < this.tl[e].ee ? null : e;
  }
  fl(t) {
    return Dt(this.tl, t, (e, i) => e.ee < i);
  }
  vl(t) {
    return us(this.tl, t, (e, i) => e.ee > i);
  }
  pl(t, e, i) {
    let s = null;
    for (let r = t; r < e; r++) {
      const h = this.tl[r].Vt[i];
      Number.isNaN(h) || (s === null ? s = { ml: h, bl: h } : (h < s.ml && (s.ml = h), h > s.bl && (s.bl = h)));
    }
    return s;
  }
  _l(t, e, i) {
    if (this.Ni()) return null;
    let s = null;
    const r = w(this.el()), h = w(this.An()), o = Math.max(t, r), l = Math.min(e, h), c = Math.ceil(o / ot) * ot, a = Math.max(c, Math.floor(l / ot) * ot);
    {
      const d = this.fl(o), p = this.vl(Math.min(l, c, e));
      s = Ft(s, this.pl(d, p, i));
    }
    let u = this.il.get(i);
    u === void 0 && (u = /* @__PURE__ */ new Map(), this.il.set(i, u));
    for (let d = Math.max(c + 1, o); d < a; d += ot) {
      const p = Math.floor(d / ot);
      let f = u.get(p);
      if (f === void 0) {
        const v = this.fl(p * ot), g = this.vl((p + 1) * ot - 1);
        f = this.pl(v, g, i), u.set(p, f);
      }
      s = Ft(s, f);
    }
    {
      const d = this.fl(a), p = this.vl(l);
      s = Ft(s, this.pl(d, p, i));
    }
    return s;
  }
}
function Ft(n, t) {
  return n === null ? t : t === null ? n : { ml: Math.min(n.ml, t.ml), bl: Math.max(n.bl, t.bl) };
}
class dr {
  constructor(t) {
    this.wl = t;
  }
  X(t, e, i) {
    this.wl.draw(t);
  }
  gl(t, e, i) {
    var s, r;
    (r = (s = this.wl).drawBackground) === null || r === void 0 || r.call(s, t);
  }
}
class ce {
  constructor(t) {
    this.tr = null, this.wn = t;
  }
  gt() {
    var t;
    const e = this.wn.renderer();
    if (e === null) return null;
    if (((t = this.tr) === null || t === void 0 ? void 0 : t.Ml) === e) return this.tr.xl;
    const i = new dr(e);
    return this.tr = { Ml: e, xl: i }, i;
  }
  Sl() {
    var t, e, i;
    return (i = (e = (t = this.wn).zOrder) === null || e === void 0 ? void 0 : e.call(t)) !== null && i !== void 0 ? i : "normal";
  }
}
function gs(n) {
  var t, e, i, s, r;
  return { Kt: n.text(), ki: n.coordinate(), Si: (t = n.fixedCoordinate) === null || t === void 0 ? void 0 : t.call(n), V: n.textColor(), t: n.backColor(), yt: (i = (e = n.visible) === null || e === void 0 ? void 0 : e.call(n)) === null || i === void 0 || i, hi: (r = (s = n.tickVisible) === null || s === void 0 ? void 0 : s.call(n)) === null || r === void 0 || r };
}
class fr {
  constructor(t, e) {
    this.Wt = new ss(), this.kl = t, this.yl = e;
  }
  gt() {
    return this.Wt.J(Object.assign({ Hi: this.yl.Hi() }, gs(this.kl))), this.Wt;
  }
}
class mr extends se {
  constructor(t, e) {
    super(), this.kl = t, this.Li = e;
  }
  zi(t, e, i) {
    const s = gs(this.kl);
    i.t = s.t, t.V = s.V;
    const r = 2 / 12 * this.Li.P();
    i.wi = r, i.gi = r, i.ki = s.ki, i.Si = s.Si, t.Kt = s.Kt, t.yt = s.yt, t.hi = s.hi;
  }
}
class pr {
  constructor(t, e) {
    this.Cl = null, this.Tl = null, this.Pl = null, this.Rl = null, this.Dl = null, this.Vl = t, this.jr = e;
  }
  Ol() {
    return this.Vl;
  }
  Vn() {
    var t, e;
    (e = (t = this.Vl).updateAllViews) === null || e === void 0 || e.call(t);
  }
  Pn() {
    var t, e, i, s;
    const r = (i = (e = (t = this.Vl).paneViews) === null || e === void 0 ? void 0 : e.call(t)) !== null && i !== void 0 ? i : [];
    if (((s = this.Cl) === null || s === void 0 ? void 0 : s.Ml) === r) return this.Cl.xl;
    const h = r.map((o) => new ce(o));
    return this.Cl = { Ml: r, xl: h }, h;
  }
  Qi() {
    var t, e, i, s;
    const r = (i = (e = (t = this.Vl).timeAxisViews) === null || e === void 0 ? void 0 : e.call(t)) !== null && i !== void 0 ? i : [];
    if (((s = this.Tl) === null || s === void 0 ? void 0 : s.Ml) === r) return this.Tl.xl;
    const h = this.jr.$t().St(), o = r.map((l) => new fr(l, h));
    return this.Tl = { Ml: r, xl: o }, o;
  }
  Rn() {
    var t, e, i, s;
    const r = (i = (e = (t = this.Vl).priceAxisViews) === null || e === void 0 ? void 0 : e.call(t)) !== null && i !== void 0 ? i : [];
    if (((s = this.Pl) === null || s === void 0 ? void 0 : s.Ml) === r) return this.Pl.xl;
    const h = this.jr.Dt(), o = r.map((l) => new mr(l, h));
    return this.Pl = { Ml: r, xl: o }, o;
  }
  Bl() {
    var t, e, i, s;
    const r = (i = (e = (t = this.Vl).priceAxisPaneViews) === null || e === void 0 ? void 0 : e.call(t)) !== null && i !== void 0 ? i : [];
    if (((s = this.Rl) === null || s === void 0 ? void 0 : s.Ml) === r) return this.Rl.xl;
    const h = r.map((o) => new ce(o));
    return this.Rl = { Ml: r, xl: h }, h;
  }
  Al() {
    var t, e, i, s;
    const r = (i = (e = (t = this.Vl).timeAxisPaneViews) === null || e === void 0 ? void 0 : e.call(t)) !== null && i !== void 0 ? i : [];
    if (((s = this.Dl) === null || s === void 0 ? void 0 : s.Ml) === r) return this.Dl.xl;
    const h = r.map((o) => new ce(o));
    return this.Dl = { Ml: r, xl: h }, h;
  }
  Il(t, e) {
    var i, s, r;
    return (r = (s = (i = this.Vl).autoscaleInfo) === null || s === void 0 ? void 0 : s.call(i, t, e)) !== null && r !== void 0 ? r : null;
  }
  wr(t, e) {
    var i, s, r;
    return (r = (s = (i = this.Vl).hitTest) === null || s === void 0 ? void 0 : s.call(i, t, e)) !== null && r !== void 0 ? r : null;
  }
}
function ae(n, t, e, i) {
  n.forEach((s) => {
    t(s).forEach((r) => {
      r.Sl() === e && i.push(r);
    });
  });
}
function ue(n) {
  return n.Pn();
}
function vr(n) {
  return n.Bl();
}
function gr(n) {
  return n.Al();
}
class Be extends lr {
  constructor(t, e, i, s, r) {
    super(t), this.zt = new ur(), this.jh = new sr(this), this.zl = [], this.Ll = new Un(this), this.El = null, this.Nl = null, this.Fl = [], this.Wl = [], this.jl = null, this.Hl = [], this.cn = e, this.$l = i;
    const h = new nr(this);
    this.rn = [h], this.Hh = new ms(h, this, t), i !== "Area" && i !== "Line" && i !== "Baseline" || (this.El = new Gn(this)), this.Ul(), this.ql(r);
  }
  S() {
    this.jl !== null && clearTimeout(this.jl);
  }
  mh(t) {
    return this.cn.priceLineColor || t;
  }
  Zr(t) {
    const e = { Xr: !0 }, i = this.Dt();
    if (this.$t().St().Ni() || i.Ni() || this.zt.Ni()) return e;
    const s = this.$t().St().Xs(), r = this.Ct();
    if (s === null || r === null) return e;
    let h, o;
    if (t) {
      const u = this.zt.sl();
      if (u === null) return e;
      h = u, o = u.ee;
    } else {
      const u = this.zt.ll(s.ui(), -1);
      if (u === null || (h = this.zt.Gh(u.ee), h === null)) return e;
      o = u.ee;
    }
    const l = h.Vt[3], c = this.Us().$s(o, { Vt: h }), a = i.Rt(l, r.Vt);
    return { Xr: !1, _t: l, Kt: i.Fi(l, r.Vt), xh: i.Yl(l), Sh: i.Zl(l, r.Vt), V: c.ce, ki: a, ee: o };
  }
  Us() {
    return this.Nl !== null || (this.Nl = new ar(this)), this.Nl;
  }
  W() {
    return this.cn;
  }
  $h(t) {
    const e = t.priceScaleId;
    e !== void 0 && e !== this.cn.priceScaleId && this.$t().Xl(this, e), U(this.cn, t), t.priceFormat !== void 0 && (this.Ul(), this.$t().Kl()), this.$t().Gl(this), this.$t().Jl(), this.wn.bt("options");
  }
  J(t, e) {
    this.zt.J(t), this.Ql(), this.wn.bt("data"), this.dn.bt("data"), this.El !== null && (e && e.ta ? this.El.$r() : t.length === 0 && this.El.Hr());
    const i = this.$t().dr(this);
    this.$t().ia(i), this.$t().Gl(this), this.$t().Jl(), this.$t().Uh();
  }
  na(t) {
    this.Fl = t, this.Ql();
    const e = this.$t().dr(this);
    this.dn.bt("data"), this.$t().ia(e), this.$t().Gl(this), this.$t().Jl(), this.$t().Uh();
  }
  sa() {
    return this.Fl;
  }
  dh() {
    return this.Wl;
  }
  ea(t) {
    const e = new or(this, t);
    return this.zl.push(e), this.$t().Gl(this), e;
  }
  ra(t) {
    const e = this.zl.indexOf(t);
    e !== -1 && this.zl.splice(e, 1), this.$t().Gl(this);
  }
  Qh() {
    return this.$l;
  }
  Ct() {
    const t = this.ha();
    return t === null ? null : { Vt: t.Vt[3], la: t.ot };
  }
  ha() {
    const t = this.$t().St().Xs();
    if (t === null) return null;
    const e = t.Os();
    return this.zt.ll(e, 1);
  }
  In() {
    return this.zt;
  }
  ph(t) {
    const e = this.zt.Gh(t);
    return e === null ? null : this.$l === "Bar" || this.$l === "Candlestick" || this.$l === "Custom" ? { ge: e.Vt[0], Me: e.Vt[1], xe: e.Vt[2], Se: e.Vt[3] } : e.Vt[3];
  }
  aa(t) {
    const e = [];
    ae(this.Hl, ue, "top", e);
    const i = this.El;
    return i !== null && i.yt() && (this.jl === null && i.qr() && (this.jl = setTimeout(() => {
      this.jl = null, this.$t().oa();
    }, 0)), i.Ur(), e.unshift(i)), e;
  }
  Pn() {
    const t = [];
    this._a() || t.push(this.Ll), t.push(this.wn, this.jh, this.dn);
    const e = this.zl.map((i) => i.qh());
    return t.push(...e), ae(this.Hl, ue, "normal", t), t;
  }
  ua() {
    return this.ca(ue, "bottom");
  }
  da(t) {
    return this.ca(vr, t);
  }
  fa(t) {
    return this.ca(gr, t);
  }
  va(t, e) {
    return this.Hl.map((i) => i.wr(t, e)).filter((i) => i !== null);
  }
  Ji(t) {
    return [this.Hh, ...this.zl.map((e) => e.Yh())];
  }
  Rn(t, e) {
    if (e !== this.Yi && !this._a()) return [];
    const i = [...this.rn];
    for (const s of this.zl) i.push(s.Zh());
    return this.Hl.forEach((s) => {
      i.push(...s.Rn());
    }), i;
  }
  Qi() {
    const t = [];
    return this.Hl.forEach((e) => {
      t.push(...e.Qi());
    }), t;
  }
  Il(t, e) {
    if (this.cn.autoscaleInfoProvider !== void 0) {
      const i = this.cn.autoscaleInfoProvider(() => {
        const s = this.pa(t, e);
        return s === null ? null : s.Bh();
      });
      return Yt.Ah(i);
    }
    return this.pa(t, e);
  }
  ma() {
    return this.cn.priceFormat.minMove;
  }
  ba() {
    return this.wa;
  }
  Vn() {
    var t;
    this.wn.bt(), this.dn.bt();
    for (const e of this.rn) e.bt();
    for (const e of this.zl) e.bt();
    this.jh.bt(), this.Ll.bt(), (t = this.El) === null || t === void 0 || t.bt(), this.Hl.forEach((e) => e.Vn());
  }
  Dt() {
    return w(super.Dt());
  }
  kt(t) {
    if (!((this.$l === "Line" || this.$l === "Area" || this.$l === "Baseline") && this.cn.crosshairMarkerVisible)) return null;
    const e = this.zt.Gh(t);
    return e === null ? null : { _t: e.Vt[3], ht: this.ga(), Ot: this.Ma(), Pt: this.xa(), Tt: this.Sa(t) };
  }
  bh() {
    return this.cn.title;
  }
  yt() {
    return this.cn.visible;
  }
  ka(t) {
    this.Hl.push(new pr(t, this));
  }
  ya(t) {
    this.Hl = this.Hl.filter((e) => e.Ol() !== t);
  }
  Ca() {
    if (this.wn instanceof le) return (t) => this.wn.We(t);
  }
  Ta() {
    if (this.wn instanceof le) return (t) => this.wn.je(t);
  }
  _a() {
    return !ne(this.Dt().Pa());
  }
  pa(t, e) {
    if (!$t(t) || !$t(e) || this.zt.Ni()) return null;
    const i = this.$l === "Line" || this.$l === "Area" || this.$l === "Baseline" || this.$l === "Histogram" ? [3] : [2, 1], s = this.zt.ol(t, e, i);
    let r = s !== null ? new I(s.ml, s.bl) : null;
    if (this.Qh() === "Histogram") {
      const o = this.cn.base, l = new I(o, o);
      r = r !== null ? r.ts(l) : l;
    }
    let h = this.dn.uh();
    return this.Hl.forEach((o) => {
      const l = o.Il(t, e);
      if (l != null && l.priceRange) {
        const p = new I(l.priceRange.minValue, l.priceRange.maxValue);
        r = r !== null ? r.ts(p) : p;
      }
      var c, a, u, d;
      l != null && l.margins && (c = h, a = l.margins, h = { above: Math.max((u = c == null ? void 0 : c.above) !== null && u !== void 0 ? u : 0, a.above), below: Math.max((d = c == null ? void 0 : c.below) !== null && d !== void 0 ? d : 0, a.below) });
    }), new Yt(r, h);
  }
  ga() {
    switch (this.$l) {
      case "Line":
      case "Area":
      case "Baseline":
        return this.cn.crosshairMarkerRadius;
    }
    return 0;
  }
  Ma() {
    switch (this.$l) {
      case "Line":
      case "Area":
      case "Baseline": {
        const t = this.cn.crosshairMarkerBorderColor;
        if (t.length !== 0) return t;
      }
    }
    return null;
  }
  xa() {
    switch (this.$l) {
      case "Line":
      case "Area":
      case "Baseline":
        return this.cn.crosshairMarkerBorderWidth;
    }
    return 0;
  }
  Sa(t) {
    switch (this.$l) {
      case "Line":
      case "Area":
      case "Baseline": {
        const e = this.cn.crosshairMarkerBackgroundColor;
        if (e.length !== 0) return e;
      }
    }
    return this.Us().$s(t).ce;
  }
  Ul() {
    switch (this.cn.priceFormat.type) {
      case "custom":
        this.wa = { format: this.cn.priceFormat.formatter };
        break;
      case "volume":
        this.wa = new _n(this.cn.priceFormat.precision);
        break;
      case "percent":
        this.wa = new ns(this.cn.priceFormat.precision);
        break;
      default: {
        const t = Math.pow(10, this.cn.priceFormat.precision);
        this.wa = new re(t, this.cn.priceFormat.minMove * t);
      }
    }
    this.Yi !== null && this.Yi.Ra();
  }
  Ql() {
    const t = this.$t().St();
    if (!t.Da() || this.zt.Ni()) return void (this.Wl = []);
    const e = w(this.zt.el());
    this.Wl = this.Fl.map((i, s) => {
      const r = w(t.Va(i.time, !0)), h = r < e ? 1 : -1;
      return { time: w(this.zt.ll(r, h)).ee, position: i.position, shape: i.shape, color: i.color, id: i.id, th: s, text: i.text, size: i.size, originalTime: i.originalTime };
    });
  }
  ql(t) {
    switch (this.dn = new ir(this, this.$t()), this.$l) {
      case "Bar":
        this.wn = new $n(this, this.$t());
        break;
      case "Candlestick":
        this.wn = new Dn(this, this.$t());
        break;
      case "Line":
        this.wn = new Kn(this, this.$t());
        break;
      case "Custom":
        this.wn = new le(this, this.$t(), B(t));
        break;
      case "Area":
        this.wn = new Tn(this, this.$t());
        break;
      case "Baseline":
        this.wn = new On(this, this.$t());
        break;
      case "Histogram":
        this.wn = new jn(this, this.$t());
        break;
      default:
        throw Error("Unknown chart style assigned: " + this.$l);
    }
  }
  ca(t, e) {
    const i = [];
    return ae(this.Hl, t, e, i), i;
  }
}
class br {
  constructor(t) {
    this.cn = t;
  }
  Oa(t, e, i) {
    let s = t;
    if (this.cn.mode === 0) return s;
    const r = i.vn(), h = r.Ct();
    if (h === null) return s;
    const o = r.Rt(t, h), l = i.Ba().filter((a) => a instanceof Be).reduce((a, u) => {
      if (i.vr(u) || !u.yt()) return a;
      const d = u.Dt(), p = u.In();
      if (d.Ni() || !p.Kr(e)) return a;
      const f = p.Gh(e);
      if (f === null) return a;
      const v = yt(u.Ct());
      return a.concat([d.Rt(f.Vt[3], v.Vt)]);
    }, []);
    if (l.length === 0) return s;
    l.sort((a, u) => Math.abs(a - o) - Math.abs(u - o));
    const c = l[0];
    return s = r.pn(c, h), s;
  }
}
class wr extends q {
  constructor() {
    super(...arguments), this.zt = null;
  }
  J(t) {
    this.zt = t;
  }
  K({ context: t, bitmapSize: e, horizontalPixelRatio: i, verticalPixelRatio: s }) {
    if (this.zt === null) return;
    const r = Math.max(1, Math.floor(i));
    t.lineWidth = r, function(h, o) {
      h.save(), h.lineWidth % 2 && h.translate(0.5, 0.5), o(), h.restore();
    }(t, () => {
      const h = w(this.zt);
      if (h.Aa) {
        t.strokeStyle = h.Ia, pt(t, h.za), t.beginPath();
        for (const o of h.La) {
          const l = Math.round(o.Ea * i);
          t.moveTo(l, -r), t.lineTo(l, e.height + r);
        }
        t.stroke();
      }
      if (h.Na) {
        t.strokeStyle = h.Fa, pt(t, h.Wa), t.beginPath();
        for (const o of h.ja) {
          const l = Math.round(o.Ea * s);
          t.moveTo(-r, l), t.lineTo(e.width + r, l);
        }
        t.stroke();
      }
    });
  }
}
class xr {
  constructor(t) {
    this.Wt = new wr(), this.ft = !0, this.tn = t;
  }
  bt() {
    this.ft = !0;
  }
  gt() {
    if (this.ft) {
      const t = this.tn.$t().W().grid, e = { Na: t.horzLines.visible, Aa: t.vertLines.visible, Fa: t.horzLines.color, Ia: t.vertLines.color, Wa: t.horzLines.style, za: t.vertLines.style, ja: this.tn.vn().Ha(), La: (this.tn.$t().St().Ha() || []).map((i) => ({ Ea: i.coord })) };
      this.Wt.J(e), this.ft = !1;
    }
    return this.Wt;
  }
}
class yr {
  constructor(t) {
    this.wn = new xr(t);
  }
  qh() {
    return this.wn;
  }
}
const de = { $a: 4, Ua: 1e-4 };
function St(n, t) {
  const e = 100 * (n - t) / t;
  return t < 0 ? -e : e;
}
function Sr(n, t) {
  const e = St(n.Ph(), t), i = St(n.Rh(), t);
  return new I(e, i);
}
function kt(n, t) {
  const e = 100 * (n - t) / t + 100;
  return t < 0 ? -e : e;
}
function Mr(n, t) {
  const e = kt(n.Ph(), t), i = kt(n.Rh(), t);
  return new I(e, i);
}
function Zt(n, t) {
  const e = Math.abs(n);
  if (e < 1e-15) return 0;
  const i = Math.log10(e + t.Ua) + t.$a;
  return n < 0 ? -i : i;
}
function Lt(n, t) {
  const e = Math.abs(n);
  if (e < 1e-15) return 0;
  const i = Math.pow(10, e - t.$a) - t.Ua;
  return n < 0 ? -i : i;
}
function zt(n, t) {
  if (n === null) return null;
  const e = Zt(n.Ph(), t), i = Zt(n.Rh(), t);
  return new I(e, i);
}
function jt(n, t) {
  if (n === null) return null;
  const e = Lt(n.Ph(), t), i = Lt(n.Rh(), t);
  return new I(e, i);
}
function fe(n) {
  if (n === null) return de;
  const t = Math.abs(n.Rh() - n.Ph());
  if (t >= 1 || t < 1e-15) return de;
  const e = Math.ceil(Math.abs(Math.log10(t))), i = de.$a + e;
  return { $a: i, Ua: 1 / Math.pow(10, i) };
}
class me {
  constructor(t, e) {
    if (this.qa = t, this.Ya = e, function(i) {
      if (i < 0) return !1;
      for (let s = i; s > 1; s /= 10) if (s % 10 != 0) return !1;
      return !0;
    }(this.qa)) this.Za = [2, 2.5, 2];
    else {
      this.Za = [];
      for (let i = this.qa; i !== 1; ) {
        if (i % 2 == 0) this.Za.push(2), i /= 2;
        else {
          if (i % 5 != 0) throw new Error("unexpected base");
          this.Za.push(2, 2.5), i /= 5;
        }
        if (this.Za.length > 100) throw new Error("something wrong with base");
      }
    }
  }
  Xa(t, e, i) {
    const s = this.qa === 0 ? 0 : 1 / this.qa;
    let r = Math.pow(10, Math.max(0, Math.ceil(Math.log10(t - e)))), h = 0, o = this.Ya[0];
    for (; ; ) {
      const u = It(r, s, 1e-14) && r > s + 1e-14, d = It(r, i * o, 1e-14), p = It(r, 1, 1e-14);
      if (!(u && d && p)) break;
      r /= o, o = this.Ya[++h % this.Ya.length];
    }
    if (r <= s + 1e-14 && (r = s), r = Math.max(1, r), this.Za.length > 0 && (l = r, c = 1, a = 1e-14, Math.abs(l - c) < a)) for (h = 0, o = this.Za[0]; It(r, i * o, 1e-14) && r > s + 1e-14; ) r /= o, o = this.Za[++h % this.Za.length];
    var l, c, a;
    return r;
  }
}
class fi {
  constructor(t, e, i, s) {
    this.Ka = [], this.Li = t, this.qa = e, this.Ga = i, this.Ja = s;
  }
  Xa(t, e) {
    if (t < e) throw new Error("high < low");
    const i = this.Li.At(), s = (t - e) * this.Qa() / i, r = new me(this.qa, [2, 2.5, 2]), h = new me(this.qa, [2, 2, 2.5]), o = new me(this.qa, [2.5, 2, 2]), l = [];
    return l.push(r.Xa(t, e, s), h.Xa(t, e, s), o.Xa(t, e, s)), function(c) {
      if (c.length < 1) throw Error("array is empty");
      let a = c[0];
      for (let u = 1; u < c.length; ++u) c[u] < a && (a = c[u]);
      return a;
    }(l);
  }
  io() {
    const t = this.Li, e = t.Ct();
    if (e === null) return void (this.Ka = []);
    const i = t.At(), s = this.Ga(i - 1, e), r = this.Ga(0, e), h = this.Li.W().entireTextOnly ? this.no() / 2 : 0, o = h, l = i - 1 - h, c = Math.max(s, r), a = Math.min(s, r);
    if (c === a) return void (this.Ka = []);
    let u = this.Xa(c, a), d = c % u;
    d += d < 0 ? u : 0;
    const p = c >= a ? 1 : -1;
    let f = null, v = 0;
    for (let g = c - d; g > a; g -= u) {
      const y = this.Ja(g, e, !0);
      f !== null && Math.abs(y - f) < this.Qa() || y < o || y > l || (v < this.Ka.length ? (this.Ka[v].Ea = y, this.Ka[v].so = t.eo(g)) : this.Ka.push({ Ea: y, so: t.eo(g) }), v++, f = y, t.ro() && (u = this.Xa(g * p, a)));
    }
    this.Ka.length = v;
  }
  Ha() {
    return this.Ka;
  }
  no() {
    return this.Li.P();
  }
  Qa() {
    return Math.ceil(2.5 * this.no());
  }
}
function bs(n) {
  return n.slice().sort((t, e) => w(t.Xi()) - w(e.Xi()));
}
var mi;
(function(n) {
  n[n.Normal = 0] = "Normal", n[n.Logarithmic = 1] = "Logarithmic", n[n.Percentage = 2] = "Percentage", n[n.IndexedTo100 = 3] = "IndexedTo100";
})(mi || (mi = {}));
const pi = new ns(), vi = new re(100, 1);
class _r {
  constructor(t, e, i, s) {
    this.ho = 0, this.lo = null, this.Ih = null, this.ao = null, this.oo = { _o: !1, uo: null }, this.co = 0, this.do = 0, this.fo = new V(), this.vo = new V(), this.po = [], this.mo = null, this.bo = null, this.wo = null, this.Mo = null, this.wa = vi, this.xo = fe(null), this.So = t, this.cn = e, this.ko = i, this.yo = s, this.Co = new fi(this, 100, this.To.bind(this), this.Po.bind(this));
  }
  Pa() {
    return this.So;
  }
  W() {
    return this.cn;
  }
  $h(t) {
    if (U(this.cn, t), this.Ra(), t.mode !== void 0 && this.Ro({ Cr: t.mode }), t.scaleMargins !== void 0) {
      const e = B(t.scaleMargins.top), i = B(t.scaleMargins.bottom);
      if (e < 0 || e > 1) throw new Error(`Invalid top margin - expect value between 0 and 1, given=${e}`);
      if (i < 0 || i > 1) throw new Error(`Invalid bottom margin - expect value between 0 and 1, given=${i}`);
      if (e + i > 1) throw new Error(`Invalid margins - sum of margins must be less than 1, given=${e + i}`);
      this.Do(), this.bo = null;
    }
  }
  Vo() {
    return this.cn.autoScale;
  }
  ro() {
    return this.cn.mode === 1;
  }
  Mh() {
    return this.cn.mode === 2;
  }
  Oo() {
    return this.cn.mode === 3;
  }
  Cr() {
    return { Wn: this.cn.autoScale, Bo: this.cn.invertScale, Cr: this.cn.mode };
  }
  Ro(t) {
    const e = this.Cr();
    let i = null;
    t.Wn !== void 0 && (this.cn.autoScale = t.Wn), t.Cr !== void 0 && (this.cn.mode = t.Cr, t.Cr !== 2 && t.Cr !== 3 || (this.cn.autoScale = !0), this.oo._o = !1), e.Cr === 1 && t.Cr !== e.Cr && (function(r, h) {
      if (r === null) return !1;
      const o = Lt(r.Ph(), h), l = Lt(r.Rh(), h);
      return isFinite(o) && isFinite(l);
    }(this.Ih, this.xo) ? (i = jt(this.Ih, this.xo), i !== null && this.Ao(i)) : this.cn.autoScale = !0), t.Cr === 1 && t.Cr !== e.Cr && (i = zt(this.Ih, this.xo), i !== null && this.Ao(i));
    const s = e.Cr !== this.cn.mode;
    s && (e.Cr === 2 || this.Mh()) && this.Ra(), s && (e.Cr === 3 || this.Oo()) && this.Ra(), t.Bo !== void 0 && e.Bo !== t.Bo && (this.cn.invertScale = t.Bo, this.Io()), this.vo.m(e, this.Cr());
  }
  zo() {
    return this.vo;
  }
  P() {
    return this.ko.fontSize;
  }
  At() {
    return this.ho;
  }
  Lo(t) {
    this.ho !== t && (this.ho = t, this.Do(), this.bo = null);
  }
  Eo() {
    if (this.lo) return this.lo;
    const t = this.At() - this.No() - this.Fo();
    return this.lo = t, t;
  }
  Lh() {
    return this.Wo(), this.Ih;
  }
  Ao(t, e) {
    const i = this.Ih;
    (e || i === null && t !== null || i !== null && !i.Ch(t)) && (this.bo = null, this.Ih = t);
  }
  Ni() {
    return this.Wo(), this.ho === 0 || !this.Ih || this.Ih.Ni();
  }
  jo(t) {
    return this.Bo() ? t : this.At() - 1 - t;
  }
  Rt(t, e) {
    return this.Mh() ? t = St(t, e) : this.Oo() && (t = kt(t, e)), this.Po(t, e);
  }
  te(t, e, i) {
    this.Wo();
    const s = this.Fo(), r = w(this.Lh()), h = r.Ph(), o = r.Rh(), l = this.Eo() - 1, c = this.Bo(), a = l / (o - h), u = i === void 0 ? 0 : i.from, d = i === void 0 ? t.length : i.to, p = this.Ho();
    for (let f = u; f < d; f++) {
      const v = t[f], g = v._t;
      if (isNaN(g)) continue;
      let y = g;
      p !== null && (y = p(v._t, e));
      const x = s + a * (y - h), _ = c ? x : this.ho - 1 - x;
      v.st = _;
    }
  }
  be(t, e, i) {
    this.Wo();
    const s = this.Fo(), r = w(this.Lh()), h = r.Ph(), o = r.Rh(), l = this.Eo() - 1, c = this.Bo(), a = l / (o - h), u = i === void 0 ? 0 : i.from, d = i === void 0 ? t.length : i.to, p = this.Ho();
    for (let f = u; f < d; f++) {
      const v = t[f];
      let g = v.ge, y = v.Me, x = v.xe, _ = v.Se;
      p !== null && (g = p(v.ge, e), y = p(v.Me, e), x = p(v.xe, e), _ = p(v.Se, e));
      let S = s + a * (g - h), E = c ? S : this.ho - 1 - S;
      v.pe = E, S = s + a * (y - h), E = c ? S : this.ho - 1 - S, v.de = E, S = s + a * (x - h), E = c ? S : this.ho - 1 - S, v.fe = E, S = s + a * (_ - h), E = c ? S : this.ho - 1 - S, v.me = E;
    }
  }
  pn(t, e) {
    const i = this.To(t, e);
    return this.$o(i, e);
  }
  $o(t, e) {
    let i = t;
    return this.Mh() ? i = function(s, r) {
      return r < 0 && (s = -s), s / 100 * r + r;
    }(i, e) : this.Oo() && (i = function(s, r) {
      return s -= 100, r < 0 && (s = -s), s / 100 * r + r;
    }(i, e)), i;
  }
  Ba() {
    return this.po;
  }
  Uo() {
    if (this.mo) return this.mo;
    let t = [];
    for (let e = 0; e < this.po.length; e++) {
      const i = this.po[e];
      i.Xi() === null && i.Ki(e + 1), t.push(i);
    }
    return t = bs(t), this.mo = t, this.mo;
  }
  qo(t) {
    this.po.indexOf(t) === -1 && (this.po.push(t), this.Ra(), this.Yo());
  }
  Zo(t) {
    const e = this.po.indexOf(t);
    if (e === -1) throw new Error("source is not attached to scale");
    this.po.splice(e, 1), this.po.length === 0 && (this.Ro({ Wn: !0 }), this.Ao(null)), this.Ra(), this.Yo();
  }
  Ct() {
    let t = null;
    for (const e of this.po) {
      const i = e.Ct();
      i !== null && (t === null || i.la < t.la) && (t = i);
    }
    return t === null ? null : t.Vt;
  }
  Bo() {
    return this.cn.invertScale;
  }
  Ha() {
    const t = this.Ct() === null;
    if (this.bo !== null && (t || this.bo.Xo === t)) return this.bo.Ha;
    this.Co.io();
    const e = this.Co.Ha();
    return this.bo = { Ha: e, Xo: t }, this.fo.m(), e;
  }
  Ko() {
    return this.fo;
  }
  Go(t) {
    this.Mh() || this.Oo() || this.wo === null && this.ao === null && (this.Ni() || (this.wo = this.ho - t, this.ao = w(this.Lh()).Th()));
  }
  Jo(t) {
    if (this.Mh() || this.Oo() || this.wo === null) return;
    this.Ro({ Wn: !1 }), (t = this.ho - t) < 0 && (t = 0);
    let e = (this.wo + 0.2 * (this.ho - 1)) / (t + 0.2 * (this.ho - 1));
    const i = w(this.ao).Th();
    e = Math.max(e, 0.1), i.Vh(e), this.Ao(i);
  }
  Qo() {
    this.Mh() || this.Oo() || (this.wo = null, this.ao = null);
  }
  t_(t) {
    this.Vo() || this.Mo === null && this.ao === null && (this.Ni() || (this.Mo = t, this.ao = w(this.Lh()).Th()));
  }
  i_(t) {
    if (this.Vo() || this.Mo === null) return;
    const e = w(this.Lh()).Dh() / (this.Eo() - 1);
    let i = t - this.Mo;
    this.Bo() && (i *= -1);
    const s = i * e, r = w(this.ao).Th();
    r.Oh(s), this.Ao(r, !0), this.bo = null;
  }
  n_() {
    this.Vo() || this.Mo !== null && (this.Mo = null, this.ao = null);
  }
  ba() {
    return this.wa || this.Ra(), this.wa;
  }
  Fi(t, e) {
    switch (this.cn.mode) {
      case 2:
        return this.s_(St(t, e));
      case 3:
        return this.ba().format(kt(t, e));
      default:
        return this.Wh(t);
    }
  }
  eo(t) {
    switch (this.cn.mode) {
      case 2:
        return this.s_(t);
      case 3:
        return this.ba().format(t);
      default:
        return this.Wh(t);
    }
  }
  Yl(t) {
    return this.Wh(t, w(this.e_()).ba());
  }
  Zl(t, e) {
    return t = St(t, e), this.s_(t, pi);
  }
  r_() {
    return this.po;
  }
  h_(t) {
    this.oo = { uo: t, _o: !1 };
  }
  Vn() {
    this.po.forEach((t) => t.Vn());
  }
  Ra() {
    this.bo = null;
    const t = this.e_();
    let e = 100;
    t !== null && (e = Math.round(1 / t.ma())), this.wa = vi, this.Mh() ? (this.wa = pi, e = 100) : this.Oo() ? (this.wa = new re(100, 1), e = 100) : t !== null && (this.wa = t.ba()), this.Co = new fi(this, e, this.To.bind(this), this.Po.bind(this)), this.Co.io();
  }
  Yo() {
    this.mo = null;
  }
  e_() {
    return this.po[0] || null;
  }
  No() {
    return this.Bo() ? this.cn.scaleMargins.bottom * this.At() + this.do : this.cn.scaleMargins.top * this.At() + this.co;
  }
  Fo() {
    return this.Bo() ? this.cn.scaleMargins.top * this.At() + this.co : this.cn.scaleMargins.bottom * this.At() + this.do;
  }
  Wo() {
    this.oo._o || (this.oo._o = !0, this.l_());
  }
  Do() {
    this.lo = null;
  }
  Po(t, e) {
    if (this.Wo(), this.Ni()) return 0;
    t = this.ro() && t ? Zt(t, this.xo) : t;
    const i = w(this.Lh()), s = this.Fo() + (this.Eo() - 1) * (t - i.Ph()) / i.Dh();
    return this.jo(s);
  }
  To(t, e) {
    if (this.Wo(), this.Ni()) return 0;
    const i = this.jo(t), s = w(this.Lh()), r = s.Ph() + s.Dh() * ((i - this.Fo()) / (this.Eo() - 1));
    return this.ro() ? Lt(r, this.xo) : r;
  }
  Io() {
    this.bo = null, this.Co.io();
  }
  l_() {
    const t = this.oo.uo;
    if (t === null) return;
    let e = null;
    const i = this.r_();
    let s = 0, r = 0;
    for (const l of i) {
      if (!l.yt()) continue;
      const c = l.Ct();
      if (c === null) continue;
      const a = l.Il(t.Os(), t.ui());
      let u = a && a.Lh();
      if (u !== null) {
        switch (this.cn.mode) {
          case 1:
            u = zt(u, this.xo);
            break;
          case 2:
            u = Sr(u, c.Vt);
            break;
          case 3:
            u = Mr(u, c.Vt);
        }
        if (e = e === null ? u : e.ts(w(u)), a !== null) {
          const d = a.Eh();
          d !== null && (s = Math.max(s, d.above), r = Math.max(r, d.below));
        }
      }
    }
    if (s === this.co && r === this.do || (this.co = s, this.do = r, this.bo = null, this.Do()), e !== null) {
      if (e.Ph() === e.Rh()) {
        const l = this.e_(), c = 5 * (l === null || this.Mh() || this.Oo() ? 1 : l.ma());
        this.ro() && (e = jt(e, this.xo)), e = new I(e.Ph() - c, e.Rh() + c), this.ro() && (e = zt(e, this.xo));
      }
      if (this.ro()) {
        const l = jt(e, this.xo), c = fe(l);
        if (h = c, o = this.xo, h.$a !== o.$a || h.Ua !== o.Ua) {
          const a = this.ao !== null ? jt(this.ao, this.xo) : null;
          this.xo = c, e = zt(l, c), a !== null && (this.ao = zt(a, c));
        }
      }
      this.Ao(e);
    } else this.Ih === null && (this.Ao(new I(-0.5, 0.5)), this.xo = fe(null));
    var h, o;
    this.oo._o = !0;
  }
  Ho() {
    return this.Mh() ? St : this.Oo() ? kt : this.ro() ? (t) => Zt(t, this.xo) : null;
  }
  a_(t, e, i) {
    return e === void 0 ? (i === void 0 && (i = this.ba()), i.format(t)) : e(t);
  }
  Wh(t, e) {
    return this.a_(t, this.yo.priceFormatter, e);
  }
  s_(t, e) {
    return this.a_(t, this.yo.percentageFormatter, e);
  }
}
class Cr {
  constructor(t, e) {
    this.po = [], this.o_ = /* @__PURE__ */ new Map(), this.ho = 0, this.__ = 0, this.u_ = 1e3, this.mo = null, this.c_ = new V(), this.yl = t, this.$i = e, this.d_ = new yr(this);
    const i = e.W();
    this.f_ = this.v_("left", i.leftPriceScale), this.p_ = this.v_("right", i.rightPriceScale), this.f_.zo().l(this.m_.bind(this, this.f_), this), this.p_.zo().l(this.m_.bind(this, this.p_), this), this.b_(i);
  }
  b_(t) {
    if (t.leftPriceScale && this.f_.$h(t.leftPriceScale), t.rightPriceScale && this.p_.$h(t.rightPriceScale), t.localization && (this.f_.Ra(), this.p_.Ra()), t.overlayPriceScales) {
      const e = Array.from(this.o_.values());
      for (const i of e) {
        const s = w(i[0].Dt());
        s.$h(t.overlayPriceScales), t.localization && s.Ra();
      }
    }
  }
  w_(t) {
    switch (t) {
      case "left":
        return this.f_;
      case "right":
        return this.p_;
    }
    return this.o_.has(t) ? B(this.o_.get(t))[0].Dt() : null;
  }
  S() {
    this.$t().g_().p(this), this.f_.zo().p(this), this.p_.zo().p(this), this.po.forEach((t) => {
      t.S && t.S();
    }), this.c_.m();
  }
  M_() {
    return this.u_;
  }
  x_(t) {
    this.u_ = t;
  }
  $t() {
    return this.$i;
  }
  Hi() {
    return this.__;
  }
  At() {
    return this.ho;
  }
  S_(t) {
    this.__ = t, this.k_();
  }
  Lo(t) {
    this.ho = t, this.f_.Lo(t), this.p_.Lo(t), this.po.forEach((e) => {
      if (this.vr(e)) {
        const i = e.Dt();
        i !== null && i.Lo(t);
      }
    }), this.k_();
  }
  Ba() {
    return this.po;
  }
  vr(t) {
    const e = t.Dt();
    return e === null || this.f_ !== e && this.p_ !== e;
  }
  qo(t, e, i) {
    const s = i !== void 0 ? i : this.C_().y_ + 1;
    this.T_(t, e, s);
  }
  Zo(t) {
    const e = this.po.indexOf(t);
    ct(e !== -1, "removeDataSource: invalid data source"), this.po.splice(e, 1);
    const i = w(t.Dt()).Pa();
    if (this.o_.has(i)) {
      const r = B(this.o_.get(i)), h = r.indexOf(t);
      h !== -1 && (r.splice(h, 1), r.length === 0 && this.o_.delete(i));
    }
    const s = t.Dt();
    s && s.Ba().indexOf(t) >= 0 && s.Zo(t), s !== null && (s.Yo(), this.P_(s)), this.mo = null;
  }
  mr(t) {
    return t === this.f_ ? "left" : t === this.p_ ? "right" : "overlay";
  }
  R_() {
    return this.f_;
  }
  D_() {
    return this.p_;
  }
  V_(t, e) {
    t.Go(e);
  }
  O_(t, e) {
    t.Jo(e), this.k_();
  }
  B_(t) {
    t.Qo();
  }
  A_(t, e) {
    t.t_(e);
  }
  I_(t, e) {
    t.i_(e), this.k_();
  }
  z_(t) {
    t.n_();
  }
  k_() {
    this.po.forEach((t) => {
      t.Vn();
    });
  }
  vn() {
    let t = null;
    return this.$i.W().rightPriceScale.visible && this.p_.Ba().length !== 0 ? t = this.p_ : this.$i.W().leftPriceScale.visible && this.f_.Ba().length !== 0 ? t = this.f_ : this.po.length !== 0 && (t = this.po[0].Dt()), t === null && (t = this.p_), t;
  }
  pr() {
    let t = null;
    return this.$i.W().rightPriceScale.visible ? t = this.p_ : this.$i.W().leftPriceScale.visible && (t = this.f_), t;
  }
  P_(t) {
    t !== null && t.Vo() && this.L_(t);
  }
  E_(t) {
    const e = this.yl.Xs();
    t.Ro({ Wn: !0 }), e !== null && t.h_(e), this.k_();
  }
  N_() {
    this.L_(this.f_), this.L_(this.p_);
  }
  F_() {
    this.P_(this.f_), this.P_(this.p_), this.po.forEach((t) => {
      this.vr(t) && this.P_(t.Dt());
    }), this.k_(), this.$i.Uh();
  }
  Uo() {
    return this.mo === null && (this.mo = bs(this.po)), this.mo;
  }
  W_() {
    return this.c_;
  }
  j_() {
    return this.d_;
  }
  L_(t) {
    const e = t.r_();
    if (e && e.length > 0 && !this.yl.Ni()) {
      const i = this.yl.Xs();
      i !== null && t.h_(i);
    }
    t.Vn();
  }
  C_() {
    const t = this.Uo();
    if (t.length === 0) return { H_: 0, y_: 0 };
    let e = 0, i = 0;
    for (let s = 0; s < t.length; s++) {
      const r = t[s].Xi();
      r !== null && (r < e && (e = r), r > i && (i = r));
    }
    return { H_: e, y_: i };
  }
  T_(t, e, i) {
    let s = this.w_(e);
    if (s === null && (s = this.v_(e, this.$i.W().overlayPriceScales)), this.po.push(t), !ne(e)) {
      const r = this.o_.get(e) || [];
      r.push(t), this.o_.set(e, r);
    }
    s.qo(t), t.Gi(s), t.Ki(i), this.P_(s), this.mo = null;
  }
  m_(t, e, i) {
    e.Cr !== i.Cr && this.L_(t);
  }
  v_(t, e) {
    const i = Object.assign({ visible: !0, autoScale: !0 }, tt(e)), s = new _r(t, i, this.$i.W().layout, this.$i.W().localization);
    return s.Lo(this.At()), s;
  }
}
class Nr {
  constructor(t, e, i = 50) {
    this.Ke = 0, this.Ge = 1, this.Je = 1, this.tr = /* @__PURE__ */ new Map(), this.Qe = /* @__PURE__ */ new Map(), this.U_ = t, this.q_ = e, this.ir = i;
  }
  Y_(t) {
    const e = t.time, i = this.q_.cacheKey(e), s = this.tr.get(i);
    if (s !== void 0) return s.Z_;
    if (this.Ke === this.ir) {
      const h = this.Qe.get(this.Je);
      this.Qe.delete(this.Je), this.tr.delete(B(h)), this.Je++, this.Ke--;
    }
    const r = this.U_(t);
    return this.tr.set(i, { Z_: r, rr: this.Ge }), this.Qe.set(this.Ge, i), this.Ke++, this.Ge++, r;
  }
}
class Tt {
  constructor(t, e) {
    ct(t <= e, "right should be >= left"), this.X_ = t, this.K_ = e;
  }
  Os() {
    return this.X_;
  }
  ui() {
    return this.K_;
  }
  G_() {
    return this.K_ - this.X_ + 1;
  }
  Kr(t) {
    return this.X_ <= t && t <= this.K_;
  }
  Ch(t) {
    return this.X_ === t.Os() && this.K_ === t.ui();
  }
}
function gi(n, t) {
  return n === null || t === null ? n === t : n.Ch(t);
}
class zr {
  constructor() {
    this.J_ = /* @__PURE__ */ new Map(), this.tr = null, this.Q_ = !1;
  }
  tu(t) {
    this.Q_ = t, this.tr = null;
  }
  iu(t, e) {
    this.nu(e), this.tr = null;
    for (let i = e; i < t.length; ++i) {
      const s = t[i];
      let r = this.J_.get(s.timeWeight);
      r === void 0 && (r = [], this.J_.set(s.timeWeight, r)), r.push({ index: i, time: s.time, weight: s.timeWeight, originalTime: s.originalTime });
    }
  }
  su(t, e) {
    const i = Math.ceil(e / t);
    return this.tr !== null && this.tr.eu === i || (this.tr = { Ha: this.ru(i), eu: i }), this.tr.Ha;
  }
  nu(t) {
    if (t === 0) return void this.J_.clear();
    const e = [];
    this.J_.forEach((i, s) => {
      t <= i[0].index ? e.push(s) : i.splice(Dt(i, t, (r) => r.index < t), 1 / 0);
    });
    for (const i of e) this.J_.delete(i);
  }
  ru(t) {
    let e = [];
    for (const i of Array.from(this.J_.keys()).sort((s, r) => r - s)) {
      if (!this.J_.get(i)) continue;
      const s = e;
      e = [];
      const r = s.length;
      let h = 0;
      const o = B(this.J_.get(i)), l = o.length;
      let c = 1 / 0, a = -1 / 0;
      for (let u = 0; u < l; u++) {
        const d = o[u], p = d.index;
        for (; h < r; ) {
          const f = s[h], v = f.index;
          if (!(v < p)) {
            c = v;
            break;
          }
          h++, e.push(f), a = v, c = 1 / 0;
        }
        if (c - p >= t && p - a >= t) e.push(d), a = p;
        else if (this.Q_) return s;
      }
      for (; h < r; h++) e.push(s[h]);
    }
    return e;
  }
}
class Mt {
  constructor(t) {
    this.hu = t;
  }
  lu() {
    return this.hu === null ? null : new Tt(Math.floor(this.hu.Os()), Math.ceil(this.hu.ui()));
  }
  au() {
    return this.hu;
  }
  static ou() {
    return new Mt(null);
  }
}
function Er(n, t) {
  return n.weight > t.weight ? n : t;
}
class kr {
  constructor(t, e, i, s) {
    this.__ = 0, this._u = null, this.uu = [], this.Mo = null, this.wo = null, this.cu = new zr(), this.du = /* @__PURE__ */ new Map(), this.fu = Mt.ou(), this.vu = !0, this.pu = new V(), this.mu = new V(), this.bu = new V(), this.wu = null, this.gu = null, this.Mu = [], this.cn = e, this.yo = i, this.xu = e.rightOffset, this.Su = e.barSpacing, this.$i = t, this.q_ = s, this.ku(), this.cu.tu(e.uniformDistribution);
  }
  W() {
    return this.cn;
  }
  yu(t) {
    U(this.yo, t), this.Cu(), this.ku();
  }
  $h(t, e) {
    var i;
    U(this.cn, t), this.cn.fixLeftEdge && this.Tu(), this.cn.fixRightEdge && this.Pu(), t.barSpacing !== void 0 && this.$i.Gn(t.barSpacing), t.rightOffset !== void 0 && this.$i.Jn(t.rightOffset), t.minBarSpacing !== void 0 && this.$i.Gn((i = t.barSpacing) !== null && i !== void 0 ? i : this.Su), this.Cu(), this.ku(), this.bu.m();
  }
  mn(t) {
    var e, i;
    return (i = (e = this.uu[t]) === null || e === void 0 ? void 0 : e.time) !== null && i !== void 0 ? i : null;
  }
  Ui(t) {
    var e;
    return (e = this.uu[t]) !== null && e !== void 0 ? e : null;
  }
  Va(t, e) {
    if (this.uu.length < 1) return null;
    if (this.q_.key(t) > this.q_.key(this.uu[this.uu.length - 1].time)) return e ? this.uu.length - 1 : null;
    const i = Dt(this.uu, this.q_.key(t), (s, r) => this.q_.key(s.time) < r);
    return this.q_.key(t) < this.q_.key(this.uu[i].time) ? e ? i : null : i;
  }
  Ni() {
    return this.__ === 0 || this.uu.length === 0 || this._u === null;
  }
  Da() {
    return this.uu.length > 0;
  }
  Xs() {
    return this.Ru(), this.fu.lu();
  }
  Du() {
    return this.Ru(), this.fu.au();
  }
  Vu() {
    const t = this.Xs();
    if (t === null) return null;
    const e = { from: t.Os(), to: t.ui() };
    return this.Ou(e);
  }
  Ou(t) {
    const e = Math.round(t.from), i = Math.round(t.to), s = w(this.Bu()), r = w(this.Au());
    return { from: w(this.Ui(Math.max(s, e))), to: w(this.Ui(Math.min(r, i))) };
  }
  Iu(t) {
    return { from: w(this.Va(t.from, !0)), to: w(this.Va(t.to, !0)) };
  }
  Hi() {
    return this.__;
  }
  S_(t) {
    if (!isFinite(t) || t <= 0 || this.__ === t) return;
    const e = this.Du(), i = this.__;
    if (this.__ = t, this.vu = !0, this.cn.lockVisibleTimeRangeOnResize && i !== 0) {
      const s = this.Su * t / i;
      this.Su = s;
    }
    if (this.cn.fixLeftEdge && e !== null && e.Os() <= 0) {
      const s = i - t;
      this.xu -= Math.round(s / this.Su) + 1, this.vu = !0;
    }
    this.zu(), this.Lu();
  }
  It(t) {
    if (this.Ni() || !$t(t)) return 0;
    const e = this.Eu() + this.xu - t;
    return this.__ - (e + 0.5) * this.Su - 1;
  }
  Qs(t, e) {
    const i = this.Eu(), s = e === void 0 ? 0 : e.from, r = e === void 0 ? t.length : e.to;
    for (let h = s; h < r; h++) {
      const o = t[h].ot, l = i + this.xu - o, c = this.__ - (l + 0.5) * this.Su - 1;
      t[h].nt = c;
    }
  }
  Nu(t) {
    return Math.ceil(this.Fu(t));
  }
  Jn(t) {
    this.vu = !0, this.xu = t, this.Lu(), this.$i.Wu(), this.$i.Uh();
  }
  le() {
    return this.Su;
  }
  Gn(t) {
    this.ju(t), this.Lu(), this.$i.Wu(), this.$i.Uh();
  }
  Hu() {
    return this.xu;
  }
  Ha() {
    if (this.Ni()) return null;
    if (this.gu !== null) return this.gu;
    const t = this.Su, e = 5 * (this.$i.W().layout.fontSize + 4) / 8 * (this.cn.tickMarkMaxCharacterLength || 8), i = Math.round(e / t), s = w(this.Xs()), r = Math.max(s.Os(), s.Os() - i), h = Math.max(s.ui(), s.ui() - i), o = this.cu.su(t, e), l = this.Bu() + i, c = this.Au() - i, a = this.$u(), u = this.cn.fixLeftEdge || a, d = this.cn.fixRightEdge || a;
    let p = 0;
    for (const f of o) {
      if (!(r <= f.index && f.index <= h)) continue;
      let v;
      p < this.Mu.length ? (v = this.Mu[p], v.coord = this.It(f.index), v.label = this.Uu(f), v.weight = f.weight) : (v = { needAlignCoordinate: !1, coord: this.It(f.index), label: this.Uu(f), weight: f.weight }, this.Mu.push(v)), this.Su > e / 2 && !a ? v.needAlignCoordinate = !1 : v.needAlignCoordinate = u && f.index <= l || d && f.index >= c, p++;
    }
    return this.Mu.length = p, this.gu = this.Mu, this.Mu;
  }
  qu() {
    this.vu = !0, this.Gn(this.cn.barSpacing), this.Jn(this.cn.rightOffset);
  }
  Yu(t) {
    this.vu = !0, this._u = t, this.Lu(), this.Tu();
  }
  Zu(t, e) {
    const i = this.Fu(t), s = this.le(), r = s + e * (s / 10);
    this.Gn(r), this.cn.rightBarStaysOnScroll || this.Jn(this.Hu() + (i - this.Fu(t)));
  }
  Go(t) {
    this.Mo && this.n_(), this.wo === null && this.wu === null && (this.Ni() || (this.wo = t, this.Xu()));
  }
  Jo(t) {
    if (this.wu === null) return;
    const e = Ne(this.__ - t, 0, this.__), i = Ne(this.__ - w(this.wo), 0, this.__);
    e !== 0 && i !== 0 && this.Gn(this.wu.le * e / i);
  }
  Qo() {
    this.wo !== null && (this.wo = null, this.Ku());
  }
  t_(t) {
    this.Mo === null && this.wu === null && (this.Ni() || (this.Mo = t, this.Xu()));
  }
  i_(t) {
    if (this.Mo === null) return;
    const e = (this.Mo - t) / this.le();
    this.xu = w(this.wu).Hu + e, this.vu = !0, this.Lu();
  }
  n_() {
    this.Mo !== null && (this.Mo = null, this.Ku());
  }
  Gu() {
    this.Ju(this.cn.rightOffset);
  }
  Ju(t, e = 400) {
    if (!isFinite(t)) throw new RangeError("offset is required and must be finite number");
    if (!isFinite(e) || e <= 0) throw new RangeError("animationDuration (optional) must be finite positive number");
    const i = this.xu, s = performance.now();
    this.$i.Zn({ Qu: (r) => (r - s) / e >= 1, tc: (r) => {
      const h = (r - s) / e;
      return h >= 1 ? t : i + (t - i) * h;
    } });
  }
  bt(t, e) {
    this.vu = !0, this.uu = t, this.cu.iu(t, e), this.Lu();
  }
  nc() {
    return this.pu;
  }
  sc() {
    return this.mu;
  }
  ec() {
    return this.bu;
  }
  Eu() {
    return this._u || 0;
  }
  rc(t) {
    const e = t.G_();
    this.ju(this.__ / e), this.xu = t.ui() - this.Eu(), this.Lu(), this.vu = !0, this.$i.Wu(), this.$i.Uh();
  }
  hc() {
    const t = this.Bu(), e = this.Au();
    t !== null && e !== null && this.rc(new Tt(t, e + this.cn.rightOffset));
  }
  lc(t) {
    const e = new Tt(t.from, t.to);
    this.rc(e);
  }
  qi(t) {
    return this.yo.timeFormatter !== void 0 ? this.yo.timeFormatter(t.originalTime) : this.q_.formatHorzItem(t.time);
  }
  $u() {
    const { handleScroll: t, handleScale: e } = this.$i.W();
    return !(t.horzTouchDrag || t.mouseWheel || t.pressedMouseMove || t.vertTouchDrag || e.axisDoubleClickReset.time || e.axisPressedMouseMove.time || e.mouseWheel || e.pinch);
  }
  Bu() {
    return this.uu.length === 0 ? null : 0;
  }
  Au() {
    return this.uu.length === 0 ? null : this.uu.length - 1;
  }
  ac(t) {
    return (this.__ - 1 - t) / this.Su;
  }
  Fu(t) {
    const e = this.ac(t), i = this.Eu() + this.xu - e;
    return Math.round(1e6 * i) / 1e6;
  }
  ju(t) {
    const e = this.Su;
    this.Su = t, this.zu(), e !== this.Su && (this.vu = !0, this.oc());
  }
  Ru() {
    if (!this.vu) return;
    if (this.vu = !1, this.Ni()) return void this._c(Mt.ou());
    const t = this.Eu(), e = this.__ / this.Su, i = this.xu + t, s = new Tt(i - e + 1, i);
    this._c(new Mt(s));
  }
  zu() {
    const t = this.uc();
    if (this.Su < t && (this.Su = t, this.vu = !0), this.__ !== 0) {
      const e = 0.5 * this.__;
      this.Su > e && (this.Su = e, this.vu = !0);
    }
  }
  uc() {
    return this.cn.fixLeftEdge && this.cn.fixRightEdge && this.uu.length !== 0 ? this.__ / this.uu.length : this.cn.minBarSpacing;
  }
  Lu() {
    const t = this.cc();
    t !== null && this.xu < t && (this.xu = t, this.vu = !0);
    const e = this.dc();
    this.xu > e && (this.xu = e, this.vu = !0);
  }
  cc() {
    const t = this.Bu(), e = this._u;
    return t === null || e === null ? null : t - e - 1 + (this.cn.fixLeftEdge ? this.__ / this.Su : Math.min(2, this.uu.length));
  }
  dc() {
    return this.cn.fixRightEdge ? 0 : this.__ / this.Su - Math.min(2, this.uu.length);
  }
  Xu() {
    this.wu = { le: this.le(), Hu: this.Hu() };
  }
  Ku() {
    this.wu = null;
  }
  Uu(t) {
    let e = this.du.get(t.weight);
    return e === void 0 && (e = new Nr((i) => this.fc(i), this.q_), this.du.set(t.weight, e)), e.Y_(t);
  }
  fc(t) {
    return this.q_.formatTickmark(t, this.yo);
  }
  _c(t) {
    const e = this.fu;
    this.fu = t, gi(e.lu(), this.fu.lu()) || this.pu.m(), gi(e.au(), this.fu.au()) || this.mu.m(), this.oc();
  }
  oc() {
    this.gu = null;
  }
  Cu() {
    this.oc(), this.du.clear();
  }
  ku() {
    this.q_.updateFormatter(this.yo);
  }
  Tu() {
    if (!this.cn.fixLeftEdge) return;
    const t = this.Bu();
    if (t === null) return;
    const e = this.Xs();
    if (e === null) return;
    const i = e.Os() - t;
    if (i < 0) {
      const s = this.xu - i - 1;
      this.Jn(s);
    }
    this.zu();
  }
  Pu() {
    this.Lu(), this.zu();
  }
}
class Lr {
  X(t, e, i) {
    t.useMediaCoordinateSpace((s) => this.K(s, e, i));
  }
  gl(t, e, i) {
    t.useMediaCoordinateSpace((s) => this.vc(s, e, i));
  }
  vc(t, e, i) {
  }
}
class Tr extends Lr {
  constructor(t) {
    super(), this.mc = /* @__PURE__ */ new Map(), this.zt = t;
  }
  K(t) {
  }
  vc(t) {
    if (!this.zt.yt) return;
    const { context: e, mediaSize: i } = t;
    let s = 0;
    for (const h of this.zt.bc) {
      if (h.Kt.length === 0) continue;
      e.font = h.R;
      const o = this.wc(e, h.Kt);
      o > i.width ? h.Zu = i.width / o : h.Zu = 1, s += h.gc * h.Zu;
    }
    let r = 0;
    switch (this.zt.Mc) {
      case "top":
        r = 0;
        break;
      case "center":
        r = Math.max((i.height - s) / 2, 0);
        break;
      case "bottom":
        r = Math.max(i.height - s, 0);
    }
    e.fillStyle = this.zt.V;
    for (const h of this.zt.bc) {
      e.save();
      let o = 0;
      switch (this.zt.xc) {
        case "left":
          e.textAlign = "left", o = h.gc / 2;
          break;
        case "center":
          e.textAlign = "center", o = i.width / 2;
          break;
        case "right":
          e.textAlign = "right", o = i.width - 1 - h.gc / 2;
      }
      e.translate(o, r), e.textBaseline = "top", e.font = h.R, e.scale(h.Zu, h.Zu), e.fillText(h.Kt, 0, h.Sc), e.restore(), r += h.gc * h.Zu;
    }
  }
  wc(t, e) {
    const i = this.kc(t.font);
    let s = i.get(e);
    return s === void 0 && (s = t.measureText(e).width, i.set(e, s)), s;
  }
  kc(t) {
    let e = this.mc.get(t);
    return e === void 0 && (e = /* @__PURE__ */ new Map(), this.mc.set(t, e)), e;
  }
}
class Pr {
  constructor(t) {
    this.ft = !0, this.Ft = { yt: !1, V: "", bc: [], Mc: "center", xc: "center" }, this.Wt = new Tr(this.Ft), this.jt = t;
  }
  bt() {
    this.ft = !0;
  }
  gt() {
    return this.ft && (this.Mt(), this.ft = !1), this.Wt;
  }
  Mt() {
    const t = this.jt.W(), e = this.Ft;
    e.yt = t.visible, e.yt && (e.V = t.color, e.xc = t.horzAlign, e.Mc = t.vertAlign, e.bc = [{ Kt: t.text, R: _t(t.fontSize, t.fontFamily, t.fontStyle), gc: 1.2 * t.fontSize, Sc: 0, Zu: 0 }]);
  }
}
class $r extends Re {
  constructor(t, e) {
    super(), this.cn = e, this.wn = new Pr(this);
  }
  Rn() {
    return [];
  }
  Pn() {
    return [this.wn];
  }
  W() {
    return this.cn;
  }
  Vn() {
    this.wn.bt();
  }
}
var bi, wi, xi, ze, yi;
(function(n) {
  n[n.OnTouchEnd = 0] = "OnTouchEnd", n[n.OnNextTap = 1] = "OnNextTap";
})(bi || (bi = {}));
class Vr {
  constructor(t, e, i) {
    this.yc = [], this.Cc = [], this.__ = 0, this.Tc = null, this.Pc = new V(), this.Rc = new V(), this.Dc = null, this.Vc = t, this.cn = e, this.q_ = i, this.Oc = new dn(this), this.yl = new kr(this, e.timeScale, this.cn.localization, i), this.vt = new Mn(this, e.crosshair), this.Bc = new br(e.crosshair), this.Ac = new $r(this, e.watermark), this.Ic(), this.yc[0].x_(2e3), this.zc = this.Lc(0), this.Ec = this.Lc(1);
  }
  Kl() {
    this.Nc(O.es());
  }
  Uh() {
    this.Nc(O.ss());
  }
  oa() {
    this.Nc(new O(1));
  }
  Gl(t) {
    const e = this.Fc(t);
    this.Nc(e);
  }
  Wc() {
    return this.Tc;
  }
  jc(t) {
    const e = this.Tc;
    this.Tc = t, e !== null && this.Gl(e.Hc), t !== null && this.Gl(t.Hc);
  }
  W() {
    return this.cn;
  }
  $h(t) {
    U(this.cn, t), this.yc.forEach((e) => e.b_(t)), t.timeScale !== void 0 && this.yl.$h(t.timeScale), t.localization !== void 0 && this.yl.yu(t.localization), (t.leftPriceScale || t.rightPriceScale) && this.Pc.m(), this.zc = this.Lc(0), this.Ec = this.Lc(1), this.Kl();
  }
  $c(t, e) {
    if (t === "left") return void this.$h({ leftPriceScale: e });
    if (t === "right") return void this.$h({ rightPriceScale: e });
    const i = this.Uc(t);
    i !== null && (i.Dt.$h(e), this.Pc.m());
  }
  Uc(t) {
    for (const e of this.yc) {
      const i = e.w_(t);
      if (i !== null) return { Ht: e, Dt: i };
    }
    return null;
  }
  St() {
    return this.yl;
  }
  qc() {
    return this.yc;
  }
  Yc() {
    return this.Ac;
  }
  Zc() {
    return this.vt;
  }
  Xc() {
    return this.Rc;
  }
  Kc(t, e) {
    t.Lo(e), this.Wu();
  }
  S_(t) {
    this.__ = t, this.yl.S_(this.__), this.yc.forEach((e) => e.S_(t)), this.Wu();
  }
  Ic(t) {
    const e = new Cr(this.yl, this);
    t !== void 0 ? this.yc.splice(t, 0, e) : this.yc.push(e);
    const i = t === void 0 ? this.yc.length - 1 : t, s = O.es();
    return s.Nn(i, { Fn: 0, Wn: !0 }), this.Nc(s), e;
  }
  V_(t, e, i) {
    t.V_(e, i);
  }
  O_(t, e, i) {
    t.O_(e, i), this.Jl(), this.Nc(this.Gc(t, 2));
  }
  B_(t, e) {
    t.B_(e), this.Nc(this.Gc(t, 2));
  }
  A_(t, e, i) {
    e.Vo() || t.A_(e, i);
  }
  I_(t, e, i) {
    e.Vo() || (t.I_(e, i), this.Jl(), this.Nc(this.Gc(t, 2)));
  }
  z_(t, e) {
    e.Vo() || (t.z_(e), this.Nc(this.Gc(t, 2)));
  }
  E_(t, e) {
    t.E_(e), this.Nc(this.Gc(t, 2));
  }
  Jc(t) {
    this.yl.Go(t);
  }
  Qc(t, e) {
    const i = this.St();
    if (i.Ni() || e === 0) return;
    const s = i.Hi();
    t = Math.max(1, Math.min(t, s)), i.Zu(t, e), this.Wu();
  }
  td(t) {
    this.nd(0), this.sd(t), this.ed();
  }
  rd(t) {
    this.yl.Jo(t), this.Wu();
  }
  hd() {
    this.yl.Qo(), this.Uh();
  }
  nd(t) {
    this.yl.t_(t);
  }
  sd(t) {
    this.yl.i_(t), this.Wu();
  }
  ed() {
    this.yl.n_(), this.Uh();
  }
  wt() {
    return this.Cc;
  }
  ld(t, e, i, s, r) {
    this.vt.gn(t, e);
    let h = NaN, o = this.yl.Nu(t);
    const l = this.yl.Xs();
    l !== null && (o = Math.min(Math.max(l.Os(), o), l.ui()));
    const c = s.vn(), a = c.Ct();
    a !== null && (h = c.pn(e, a)), h = this.Bc.Oa(h, o, s), this.vt.kn(o, h, s), this.oa(), r || this.Rc.m(this.vt.xt(), { x: t, y: e }, i);
  }
  ad(t, e, i) {
    const s = i.vn(), r = s.Ct(), h = s.Rt(t, w(r)), o = this.yl.Va(e, !0), l = this.yl.It(w(o));
    this.ld(l, h, null, i, !0);
  }
  od(t) {
    this.Zc().Cn(), this.oa(), t || this.Rc.m(null, null, null);
  }
  Jl() {
    const t = this.vt.Ht();
    if (t !== null) {
      const e = this.vt.xn(), i = this.vt.Sn();
      this.ld(e, i, null, t);
    }
    this.vt.Vn();
  }
  _d(t, e, i) {
    const s = this.yl.mn(0);
    e !== void 0 && i !== void 0 && this.yl.bt(e, i);
    const r = this.yl.mn(0), h = this.yl.Eu(), o = this.yl.Xs();
    if (o !== null && s !== null && r !== null) {
      const l = o.Kr(h), c = this.q_.key(s) > this.q_.key(r), a = t !== null && t > h && !c, u = this.yl.W().allowShiftVisibleRangeOnWhitespaceReplacement, d = l && (i !== void 0 || u) && this.yl.W().shiftVisibleRangeOnNewBar;
      if (a && !d) {
        const p = t - h;
        this.yl.Jn(this.yl.Hu() - p);
      }
    }
    this.yl.Yu(t);
  }
  ia(t) {
    t !== null && t.F_();
  }
  dr(t) {
    const e = this.yc.find((i) => i.Uo().includes(t));
    return e === void 0 ? null : e;
  }
  Wu() {
    this.Ac.Vn(), this.yc.forEach((t) => t.F_()), this.Jl();
  }
  S() {
    this.yc.forEach((t) => t.S()), this.yc.length = 0, this.cn.localization.priceFormatter = void 0, this.cn.localization.percentageFormatter = void 0, this.cn.localization.timeFormatter = void 0;
  }
  ud() {
    return this.Oc;
  }
  br() {
    return this.Oc.W();
  }
  g_() {
    return this.Pc;
  }
  dd(t, e, i) {
    const s = this.yc[0], r = this.fd(e, t, s, i);
    return this.Cc.push(r), this.Cc.length === 1 ? this.Kl() : this.Uh(), r;
  }
  vd(t) {
    const e = this.dr(t), i = this.Cc.indexOf(t);
    ct(i !== -1, "Series not found"), this.Cc.splice(i, 1), w(e).Zo(t), t.S && t.S();
  }
  Xl(t, e) {
    const i = w(this.dr(t));
    i.Zo(t);
    const s = this.Uc(e);
    if (s === null) {
      const r = t.Xi();
      i.qo(t, e, r);
    } else {
      const r = s.Ht === i ? t.Xi() : void 0;
      s.Ht.qo(t, e, r);
    }
  }
  hc() {
    const t = O.ss();
    t.$n(), this.Nc(t);
  }
  pd(t) {
    const e = O.ss();
    e.Yn(t), this.Nc(e);
  }
  Kn() {
    const t = O.ss();
    t.Kn(), this.Nc(t);
  }
  Gn(t) {
    const e = O.ss();
    e.Gn(t), this.Nc(e);
  }
  Jn(t) {
    const e = O.ss();
    e.Jn(t), this.Nc(e);
  }
  Zn(t) {
    const e = O.ss();
    e.Zn(t), this.Nc(e);
  }
  Un() {
    const t = O.ss();
    t.Un(), this.Nc(t);
  }
  md() {
    return this.cn.rightPriceScale.visible ? "right" : "left";
  }
  bd() {
    return this.Ec;
  }
  q() {
    return this.zc;
  }
  Bt(t) {
    const e = this.Ec, i = this.zc;
    if (e === i) return e;
    if (t = Math.max(0, Math.min(100, Math.round(100 * t))), this.Dc === null || this.Dc.Ps !== i || this.Dc.Rs !== e) this.Dc = { Ps: i, Rs: e, wd: /* @__PURE__ */ new Map() };
    else {
      const r = this.Dc.wd.get(t);
      if (r !== void 0) return r;
    }
    const s = function(r, h, o) {
      const [l, c, a, u] = Pt(r), [d, p, f, v] = Pt(h), g = [A(l + o * (d - l)), A(c + o * (p - c)), A(a + o * (f - a)), ts(u + o * (v - u))];
      return `rgba(${g[0]}, ${g[1]}, ${g[2]}, ${g[3]})`;
    }(i, e, t / 100);
    return this.Dc.wd.set(t, s), s;
  }
  Gc(t, e) {
    const i = new O(e);
    if (t !== null) {
      const s = this.yc.indexOf(t);
      i.Nn(s, { Fn: e });
    }
    return i;
  }
  Fc(t, e) {
    return e === void 0 && (e = 2), this.Gc(this.dr(t), e);
  }
  Nc(t) {
    this.Vc && this.Vc(t), this.yc.forEach((e) => e.j_().qh().bt());
  }
  fd(t, e, i, s) {
    const r = new Be(this, t, e, i, s), h = t.priceScaleId !== void 0 ? t.priceScaleId : this.md();
    return i.qo(r, h), ne(h) || r.$h(t), r;
  }
  Lc(t) {
    const e = this.cn.layout;
    return e.background.type === "gradient" ? t === 0 ? e.background.topColor : e.background.bottomColor : e.background.color;
  }
}
function Ee(n) {
  return !Y(n) && !Wt(n);
}
function ws(n) {
  return Y(n);
}
(function(n) {
  n[n.Disabled = 0] = "Disabled", n[n.Continuous = 1] = "Continuous", n[n.OnDataUpdate = 2] = "OnDataUpdate";
})(wi || (wi = {})), function(n) {
  n[n.LastBar = 0] = "LastBar", n[n.LastVisible = 1] = "LastVisible";
}(xi || (xi = {})), function(n) {
  n.Solid = "solid", n.VerticalGradient = "gradient";
}(ze || (ze = {})), function(n) {
  n[n.Year = 0] = "Year", n[n.Month = 1] = "Month", n[n.DayOfMonth = 2] = "DayOfMonth", n[n.Time = 3] = "Time", n[n.TimeWithSeconds = 4] = "TimeWithSeconds";
}(yi || (yi = {}));
const Si = (n) => n.getUTCFullYear();
function Rr(n, t, e) {
  return t.replace(/yyyy/g, ((i) => et(Si(i), 4))(n)).replace(/yy/g, ((i) => et(Si(i) % 100, 2))(n)).replace(/MMMM/g, ((i, s) => new Date(i.getUTCFullYear(), i.getUTCMonth(), 1).toLocaleString(s, { month: "long" }))(n, e)).replace(/MMM/g, ((i, s) => new Date(i.getUTCFullYear(), i.getUTCMonth(), 1).toLocaleString(s, { month: "short" }))(n, e)).replace(/MM/g, ((i) => et(((s) => s.getUTCMonth() + 1)(i), 2))(n)).replace(/dd/g, ((i) => et(((s) => s.getUTCDate())(i), 2))(n));
}
class xs {
  constructor(t = "yyyy-MM-dd", e = "default") {
    this.gd = t, this.Md = e;
  }
  Y_(t) {
    return Rr(t, this.gd, this.Md);
  }
}
class Or {
  constructor(t) {
    this.xd = t || "%h:%m:%s";
  }
  Y_(t) {
    return this.xd.replace("%h", et(t.getUTCHours(), 2)).replace("%m", et(t.getUTCMinutes(), 2)).replace("%s", et(t.getUTCSeconds(), 2));
  }
}
const Wr = { Sd: "yyyy-MM-dd", kd: "%h:%m:%s", yd: " ", Cd: "default" };
class Dr {
  constructor(t = {}) {
    const e = Object.assign(Object.assign({}, Wr), t);
    this.Td = new xs(e.Sd, e.Cd), this.Pd = new Or(e.kd), this.Rd = e.yd;
  }
  Y_(t) {
    return `${this.Td.Y_(t)}${this.Rd}${this.Pd.Y_(t)}`;
  }
}
function Kt(n) {
  return 60 * n * 60 * 1e3;
}
function pe(n) {
  return 60 * n * 1e3;
}
const At = [{ Dd: (Mi = 1, 1e3 * Mi), Vd: 10 }, { Dd: pe(1), Vd: 20 }, { Dd: pe(5), Vd: 21 }, { Dd: pe(30), Vd: 22 }, { Dd: Kt(1), Vd: 30 }, { Dd: Kt(3), Vd: 31 }, { Dd: Kt(6), Vd: 32 }, { Dd: Kt(12), Vd: 33 }];
var Mi;
function _i(n, t) {
  if (n.getUTCFullYear() !== t.getUTCFullYear()) return 70;
  if (n.getUTCMonth() !== t.getUTCMonth()) return 60;
  if (n.getUTCDate() !== t.getUTCDate()) return 50;
  for (let e = At.length - 1; e >= 0; --e) if (Math.floor(t.getTime() / At[e].Dd) !== Math.floor(n.getTime() / At[e].Dd)) return At[e].Vd;
  return 0;
}
function ve(n) {
  let t = n;
  if (Wt(n) && (t = Ie(n)), !Ee(t)) throw new Error("time must be of type BusinessDay");
  const e = new Date(Date.UTC(t.year, t.month - 1, t.day, 0, 0, 0, 0));
  return { Od: Math.round(e.getTime() / 1e3), Bd: t };
}
function Ci(n) {
  if (!ws(n)) throw new Error("time must be of type isUTCTimestamp");
  return { Od: n };
}
function Ie(n) {
  const t = new Date(n);
  if (isNaN(t.getTime())) throw new Error(`Invalid date string=${n}, expected format=yyyy-mm-dd`);
  return { day: t.getUTCDate(), month: t.getUTCMonth() + 1, year: t.getUTCFullYear() };
}
function Ni(n) {
  Wt(n.time) && (n.time = Ie(n.time));
}
class zi {
  options() {
    return this.cn;
  }
  setOptions(t) {
    this.cn = t, this.updateFormatter(t.localization);
  }
  preprocessData(t) {
    Array.isArray(t) ? function(e) {
      e.forEach(Ni);
    }(t) : Ni(t);
  }
  createConverterToInternalObj(t) {
    return w(function(e) {
      return e.length === 0 ? null : Ee(e[0].time) || Wt(e[0].time) ? ve : Ci;
    }(t));
  }
  key(t) {
    return typeof t == "object" && "Od" in t ? t.Od : this.key(this.convertHorzItemToInternal(t));
  }
  cacheKey(t) {
    const e = t;
    return e.Bd === void 0 ? new Date(1e3 * e.Od).getTime() : new Date(Date.UTC(e.Bd.year, e.Bd.month - 1, e.Bd.day)).getTime();
  }
  convertHorzItemToInternal(t) {
    return ws(e = t) ? Ci(e) : Ee(e) ? ve(e) : ve(Ie(e));
    var e;
  }
  updateFormatter(t) {
    if (!this.cn) return;
    const e = t.dateFormat;
    this.cn.timeScale.timeVisible ? this.Ad = new Dr({ Sd: e, kd: this.cn.timeScale.secondsVisible ? "%h:%m:%s" : "%h:%m", yd: "   ", Cd: t.locale }) : this.Ad = new xs(e, t.locale);
  }
  formatHorzItem(t) {
    const e = t;
    return this.Ad.Y_(new Date(1e3 * e.Od));
  }
  formatTickmark(t, e) {
    const i = function(r, h, o) {
      switch (r) {
        case 0:
        case 10:
          return h ? o ? 4 : 3 : 2;
        case 20:
        case 21:
        case 22:
        case 30:
        case 31:
        case 32:
        case 33:
          return h ? 3 : 2;
        case 50:
          return 2;
        case 60:
          return 1;
        case 70:
          return 0;
      }
    }(t.weight, this.cn.timeScale.timeVisible, this.cn.timeScale.secondsVisible), s = this.cn.timeScale;
    if (s.tickMarkFormatter !== void 0) {
      const r = s.tickMarkFormatter(t.originalTime, i, e.locale);
      if (r !== null) return r;
    }
    return function(r, h, o) {
      const l = {};
      switch (h) {
        case 0:
          l.year = "numeric";
          break;
        case 1:
          l.month = "short";
          break;
        case 2:
          l.day = "numeric";
          break;
        case 3:
          l.hour12 = !1, l.hour = "2-digit", l.minute = "2-digit";
          break;
        case 4:
          l.hour12 = !1, l.hour = "2-digit", l.minute = "2-digit", l.second = "2-digit";
      }
      const c = r.Bd === void 0 ? new Date(1e3 * r.Od) : new Date(Date.UTC(r.Bd.year, r.Bd.month - 1, r.Bd.day));
      return new Date(c.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate(), c.getUTCHours(), c.getUTCMinutes(), c.getUTCSeconds(), c.getUTCMilliseconds()).toLocaleString(o, l);
    }(t.time, i, e.locale);
  }
  maxTickMarkWeight(t) {
    let e = t.reduce(Er, t[0]).weight;
    return e > 30 && e < 50 && (e = 30), e;
  }
  fillWeightsForPoints(t, e) {
    (function(i, s = 0) {
      if (i.length === 0) return;
      let r = s === 0 ? null : i[s - 1].time.Od, h = r !== null ? new Date(1e3 * r) : null, o = 0;
      for (let l = s; l < i.length; ++l) {
        const c = i[l], a = new Date(1e3 * c.time.Od);
        h !== null && (c.timeWeight = _i(a, h)), o += c.time.Od - (r || c.time.Od), r = c.time.Od, h = a;
      }
      if (s === 0 && i.length > 1) {
        const l = Math.ceil(o / (i.length - 1)), c = new Date(1e3 * (i[0].time.Od - l));
        i[0].timeWeight = _i(new Date(1e3 * i[0].time.Od), c);
      }
    })(t, e);
  }
  static Id(t) {
    return U({ localization: { dateFormat: "dd MMM 'yy" } }, t ?? {});
  }
}
const Ct = typeof window < "u";
function Ei() {
  return !!Ct && window.navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
}
function ge() {
  return !!Ct && /iPhone|iPad|iPod/.test(window.navigator.platform);
}
function ke(n) {
  return n + n % 2;
}
function be(n, t) {
  return n.zd - t.zd;
}
function we(n, t, e) {
  const i = (n.zd - t.zd) / (n.ot - t.ot);
  return Math.sign(i) * Math.min(Math.abs(i), e);
}
class Br {
  constructor(t, e, i, s) {
    this.Ld = null, this.Ed = null, this.Nd = null, this.Fd = null, this.Wd = null, this.jd = 0, this.Hd = 0, this.$d = t, this.Ud = e, this.qd = i, this.rs = s;
  }
  Yd(t, e) {
    if (this.Ld !== null) {
      if (this.Ld.ot === e) return void (this.Ld.zd = t);
      if (Math.abs(this.Ld.zd - t) < this.rs) return;
    }
    this.Fd = this.Nd, this.Nd = this.Ed, this.Ed = this.Ld, this.Ld = { ot: e, zd: t };
  }
  Vr(t, e) {
    if (this.Ld === null || this.Ed === null || e - this.Ld.ot > 50) return;
    let i = 0;
    const s = we(this.Ld, this.Ed, this.Ud), r = be(this.Ld, this.Ed), h = [s], o = [r];
    if (i += r, this.Nd !== null) {
      const c = we(this.Ed, this.Nd, this.Ud);
      if (Math.sign(c) === Math.sign(s)) {
        const a = be(this.Ed, this.Nd);
        if (h.push(c), o.push(a), i += a, this.Fd !== null) {
          const u = we(this.Nd, this.Fd, this.Ud);
          if (Math.sign(u) === Math.sign(s)) {
            const d = be(this.Nd, this.Fd);
            h.push(u), o.push(d), i += d;
          }
        }
      }
    }
    let l = 0;
    for (let c = 0; c < h.length; ++c) l += o[c] / i * h[c];
    Math.abs(l) < this.$d || (this.Wd = { zd: t, ot: e }, this.Hd = l, this.jd = function(c, a) {
      const u = Math.log(a);
      return Math.log(1 * u / -c) / u;
    }(Math.abs(l), this.qd));
  }
  tc(t) {
    const e = w(this.Wd), i = t - e.ot;
    return e.zd + this.Hd * (Math.pow(this.qd, i) - 1) / Math.log(this.qd);
  }
  Qu(t) {
    return this.Wd === null || this.Zd(t) === this.jd;
  }
  Zd(t) {
    const e = t - w(this.Wd).ot;
    return Math.min(e, this.jd);
  }
}
class Ir {
  constructor(t, e) {
    this.Xd = void 0, this.Kd = void 0, this.Gd = void 0, this.en = !1, this.Jd = t, this.Qd = e, this.tf();
  }
  bt() {
    this.tf();
  }
  if() {
    this.Xd && this.Jd.removeChild(this.Xd), this.Kd && this.Jd.removeChild(this.Kd), this.Xd = void 0, this.Kd = void 0;
  }
  nf() {
    return this.en !== this.sf() || this.Gd !== this.ef();
  }
  ef() {
    return es(Pt(this.Qd.W().layout.textColor)) > 160 ? "dark" : "light";
  }
  sf() {
    return this.Qd.W().layout.attributionLogo;
  }
  rf() {
    const t = new URL(location.href);
    return t.hostname ? "&utm_source=" + t.hostname + t.pathname : "";
  }
  tf() {
    this.nf() && (this.if(), this.en = this.sf(), this.en && (this.Gd = this.ef(), this.Kd = document.createElement("style"), this.Kd.innerText = "a#tv-attr-logo{--fill:#131722;--stroke:#fff;position:absolute;left:10px;bottom:10px;height:19px;width:35px;margin:0;padding:0;border:0;z-index:3;}a#tv-attr-logo[data-dark]{--fill:#D1D4DC;--stroke:#131722;}", this.Xd = document.createElement("a"), this.Xd.href = `https://www.tradingview.com/?utm_medium=lwc-link&utm_campaign=lwc-chart${this.rf()}`, this.Xd.title = "Charting by TradingView", this.Xd.id = "tv-attr-logo", this.Xd.target = "_blank", this.Xd.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 35 19" width="35" height="19" fill="none"><g fill-rule="evenodd" clip-path="url(#a)" clip-rule="evenodd"><path fill="var(--stroke)" d="M2 0H0v10h6v9h21.4l.5-1.3 6-15 1-2.7H23.7l-.5 1.3-.2.6a5 5 0 0 0-7-.9V0H2Zm20 17h4l5.2-13 .8-2h-7l-1 2.5-.2.5-1.5 3.8-.3.7V17Zm-.8-10a3 3 0 0 0 .7-2.7A3 3 0 1 0 16.8 7h4.4ZM14 7V2H2v6h6v9h4V7h2Z"/><path fill="var(--fill)" d="M14 2H2v6h6v9h6V2Zm12 15h-7l6-15h7l-6 15Zm-7-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></g><defs><clipPath id="a"><path fill="var(--stroke)" d="M0 0h35v19H0z"/></clipPath></defs></svg>', this.Xd.toggleAttribute("data-dark", this.Gd === "dark"), this.Jd.appendChild(this.Kd), this.Jd.appendChild(this.Xd)));
  }
}
function vt(n, t) {
  const e = w(n.ownerDocument).createElement("canvas");
  n.appendChild(e);
  const i = Gs(e, { options: { allowResizeObserver: !1 }, transform: (s, r) => ({ width: Math.max(s.width, r.width), height: Math.max(s.height, r.height) }) });
  return i.resizeCanvasElement(t), i;
}
function gt(n) {
  var t;
  n.width = 1, n.height = 1, (t = n.getContext("2d")) === null || t === void 0 || t.clearRect(0, 0, 1, 1);
}
function Le(n, t, e, i) {
  n.gl && n.gl(t, e, i);
}
function Gt(n, t, e, i) {
  n.X(t, e, i);
}
function Te(n, t, e, i) {
  const s = n(e, i);
  for (const r of s) {
    const h = r.gt();
    h !== null && t(h);
  }
}
function Fr(n) {
  Ct && window.chrome !== void 0 && n.addEventListener("mousedown", (t) => {
    if (t.button === 1) return t.preventDefault(), !1;
  });
}
class Fe {
  constructor(t, e, i) {
    this.hf = 0, this.lf = null, this.af = { nt: Number.NEGATIVE_INFINITY, st: Number.POSITIVE_INFINITY }, this._f = 0, this.uf = null, this.cf = { nt: Number.NEGATIVE_INFINITY, st: Number.POSITIVE_INFINITY }, this.df = null, this.ff = !1, this.vf = null, this.pf = null, this.mf = !1, this.bf = !1, this.wf = !1, this.gf = null, this.Mf = null, this.xf = null, this.Sf = null, this.kf = null, this.yf = null, this.Cf = null, this.Tf = 0, this.Pf = !1, this.Rf = !1, this.Df = !1, this.Vf = 0, this.Of = null, this.Bf = !ge(), this.Af = (s) => {
      this.If(s);
    }, this.zf = (s) => {
      if (this.Lf(s)) {
        const r = this.Ef(s);
        if (++this._f, this.uf && this._f > 1) {
          const { Nf: h } = this.Ff(Q(s), this.cf);
          h < 30 && !this.wf && this.Wf(r, this.Hf.jf), this.$f();
        }
      } else {
        const r = this.Ef(s);
        if (++this.hf, this.lf && this.hf > 1) {
          const { Nf: h } = this.Ff(Q(s), this.af);
          h < 5 && !this.bf && this.Uf(r, this.Hf.qf), this.Yf();
        }
      }
    }, this.Zf = t, this.Hf = e, this.cn = i, this.Xf();
  }
  S() {
    this.gf !== null && (this.gf(), this.gf = null), this.Mf !== null && (this.Mf(), this.Mf = null), this.Sf !== null && (this.Sf(), this.Sf = null), this.kf !== null && (this.kf(), this.kf = null), this.yf !== null && (this.yf(), this.yf = null), this.xf !== null && (this.xf(), this.xf = null), this.Kf(), this.Yf();
  }
  Gf(t) {
    this.Sf && this.Sf();
    const e = this.Jf.bind(this);
    if (this.Sf = () => {
      this.Zf.removeEventListener("mousemove", e);
    }, this.Zf.addEventListener("mousemove", e), this.Lf(t)) return;
    const i = this.Ef(t);
    this.Uf(i, this.Hf.Qf), this.Bf = !0;
  }
  Yf() {
    this.lf !== null && clearTimeout(this.lf), this.hf = 0, this.lf = null, this.af = { nt: Number.NEGATIVE_INFINITY, st: Number.POSITIVE_INFINITY };
  }
  $f() {
    this.uf !== null && clearTimeout(this.uf), this._f = 0, this.uf = null, this.cf = { nt: Number.NEGATIVE_INFINITY, st: Number.POSITIVE_INFINITY };
  }
  Jf(t) {
    if (this.Df || this.pf !== null || this.Lf(t)) return;
    const e = this.Ef(t);
    this.Uf(e, this.Hf.tv), this.Bf = !0;
  }
  iv(t) {
    const e = xe(t.changedTouches, w(this.Of));
    if (e === null || (this.Vf = Xt(t), this.Cf !== null) || this.Rf) return;
    this.Pf = !0;
    const i = this.Ff(Q(e), w(this.pf)), { nv: s, sv: r, Nf: h } = i;
    if (this.mf || !(h < 5)) {
      if (!this.mf) {
        const o = 0.5 * s, l = r >= o && !this.cn.ev(), c = o > r && !this.cn.rv();
        l || c || (this.Rf = !0), this.mf = !0, this.wf = !0, this.Kf(), this.$f();
      }
      if (!this.Rf) {
        const o = this.Ef(t, e);
        this.Wf(o, this.Hf.hv), xt(t);
      }
    }
  }
  lv(t) {
    if (t.button !== 0) return;
    const e = this.Ff(Q(t), w(this.vf)), { Nf: i } = e;
    if (i >= 5 && (this.bf = !0, this.Yf()), this.bf) {
      const s = this.Ef(t);
      this.Uf(s, this.Hf.av);
    }
  }
  Ff(t, e) {
    const i = Math.abs(e.nt - t.nt), s = Math.abs(e.st - t.st);
    return { nv: i, sv: s, Nf: i + s };
  }
  ov(t) {
    let e = xe(t.changedTouches, w(this.Of));
    if (e === null && t.touches.length === 0 && (e = t.changedTouches[0]), e === null) return;
    this.Of = null, this.Vf = Xt(t), this.Kf(), this.pf = null, this.yf && (this.yf(), this.yf = null);
    const i = this.Ef(t, e);
    if (this.Wf(i, this.Hf._v), ++this._f, this.uf && this._f > 1) {
      const { Nf: s } = this.Ff(Q(e), this.cf);
      s < 30 && !this.wf && this.Wf(i, this.Hf.jf), this.$f();
    } else this.wf || (this.Wf(i, this.Hf.uv), this.Hf.uv && xt(t));
    this._f === 0 && xt(t), t.touches.length === 0 && this.ff && (this.ff = !1, xt(t));
  }
  If(t) {
    if (t.button !== 0) return;
    const e = this.Ef(t);
    if (this.vf = null, this.Df = !1, this.kf && (this.kf(), this.kf = null), Ei() && this.Zf.ownerDocument.documentElement.removeEventListener("mouseleave", this.Af), !this.Lf(t)) if (this.Uf(e, this.Hf.cv), ++this.hf, this.lf && this.hf > 1) {
      const { Nf: i } = this.Ff(Q(t), this.af);
      i < 5 && !this.bf && this.Uf(e, this.Hf.qf), this.Yf();
    } else this.bf || this.Uf(e, this.Hf.dv);
  }
  Kf() {
    this.df !== null && (clearTimeout(this.df), this.df = null);
  }
  fv(t) {
    if (this.Of !== null) return;
    const e = t.changedTouches[0];
    this.Of = e.identifier, this.Vf = Xt(t);
    const i = this.Zf.ownerDocument.documentElement;
    this.wf = !1, this.mf = !1, this.Rf = !1, this.pf = Q(e), this.yf && (this.yf(), this.yf = null);
    {
      const r = this.iv.bind(this), h = this.ov.bind(this);
      this.yf = () => {
        i.removeEventListener("touchmove", r), i.removeEventListener("touchend", h);
      }, i.addEventListener("touchmove", r, { passive: !1 }), i.addEventListener("touchend", h, { passive: !1 }), this.Kf(), this.df = setTimeout(this.vv.bind(this, t), 240);
    }
    const s = this.Ef(t, e);
    this.Wf(s, this.Hf.pv), this.uf || (this._f = 0, this.uf = setTimeout(this.$f.bind(this), 500), this.cf = Q(e));
  }
  mv(t) {
    if (t.button !== 0) return;
    const e = this.Zf.ownerDocument.documentElement;
    Ei() && e.addEventListener("mouseleave", this.Af), this.bf = !1, this.vf = Q(t), this.kf && (this.kf(), this.kf = null);
    {
      const s = this.lv.bind(this), r = this.If.bind(this);
      this.kf = () => {
        e.removeEventListener("mousemove", s), e.removeEventListener("mouseup", r);
      }, e.addEventListener("mousemove", s), e.addEventListener("mouseup", r);
    }
    if (this.Df = !0, this.Lf(t)) return;
    const i = this.Ef(t);
    this.Uf(i, this.Hf.bv), this.lf || (this.hf = 0, this.lf = setTimeout(this.Yf.bind(this), 500), this.af = Q(t));
  }
  Xf() {
    this.Zf.addEventListener("mouseenter", this.Gf.bind(this)), this.Zf.addEventListener("touchcancel", this.Kf.bind(this));
    {
      const t = this.Zf.ownerDocument, e = (i) => {
        this.Hf.wv && (i.composed && this.Zf.contains(i.composedPath()[0]) || i.target && this.Zf.contains(i.target) || this.Hf.wv());
      };
      this.Mf = () => {
        t.removeEventListener("touchstart", e);
      }, this.gf = () => {
        t.removeEventListener("mousedown", e);
      }, t.addEventListener("mousedown", e), t.addEventListener("touchstart", e, { passive: !0 });
    }
    ge() && (this.xf = () => {
      this.Zf.removeEventListener("dblclick", this.zf);
    }, this.Zf.addEventListener("dblclick", this.zf)), this.Zf.addEventListener("mouseleave", this.gv.bind(this)), this.Zf.addEventListener("touchstart", this.fv.bind(this), { passive: !0 }), Fr(this.Zf), this.Zf.addEventListener("mousedown", this.mv.bind(this)), this.Mv(), this.Zf.addEventListener("touchmove", () => {
    }, { passive: !1 });
  }
  Mv() {
    this.Hf.xv === void 0 && this.Hf.Sv === void 0 && this.Hf.kv === void 0 || (this.Zf.addEventListener("touchstart", (t) => this.yv(t.touches), { passive: !0 }), this.Zf.addEventListener("touchmove", (t) => {
      if (t.touches.length === 2 && this.Cf !== null && this.Hf.Sv !== void 0) {
        const e = ki(t.touches[0], t.touches[1]) / this.Tf;
        this.Hf.Sv(this.Cf, e), xt(t);
      }
    }, { passive: !1 }), this.Zf.addEventListener("touchend", (t) => {
      this.yv(t.touches);
    }));
  }
  yv(t) {
    t.length === 1 && (this.Pf = !1), t.length !== 2 || this.Pf || this.ff ? this.Cv() : this.Tv(t);
  }
  Tv(t) {
    const e = this.Zf.getBoundingClientRect() || { left: 0, top: 0 };
    this.Cf = { nt: (t[0].clientX - e.left + (t[1].clientX - e.left)) / 2, st: (t[0].clientY - e.top + (t[1].clientY - e.top)) / 2 }, this.Tf = ki(t[0], t[1]), this.Hf.xv !== void 0 && this.Hf.xv(), this.Kf();
  }
  Cv() {
    this.Cf !== null && (this.Cf = null, this.Hf.kv !== void 0 && this.Hf.kv());
  }
  gv(t) {
    if (this.Sf && this.Sf(), this.Lf(t) || !this.Bf) return;
    const e = this.Ef(t);
    this.Uf(e, this.Hf.Pv), this.Bf = !ge();
  }
  vv(t) {
    const e = xe(t.touches, w(this.Of));
    if (e === null) return;
    const i = this.Ef(t, e);
    this.Wf(i, this.Hf.Rv), this.wf = !0, this.ff = !0;
  }
  Lf(t) {
    return t.sourceCapabilities && t.sourceCapabilities.firesTouchEvents !== void 0 ? t.sourceCapabilities.firesTouchEvents : Xt(t) < this.Vf + 500;
  }
  Wf(t, e) {
    e && e.call(this.Hf, t);
  }
  Uf(t, e) {
    e && e.call(this.Hf, t);
  }
  Ef(t, e) {
    const i = e || t, s = this.Zf.getBoundingClientRect() || { left: 0, top: 0 };
    return { clientX: i.clientX, clientY: i.clientY, pageX: i.pageX, pageY: i.pageY, screenX: i.screenX, screenY: i.screenY, localX: i.clientX - s.left, localY: i.clientY - s.top, ctrlKey: t.ctrlKey, altKey: t.altKey, shiftKey: t.shiftKey, metaKey: t.metaKey, Dv: !t.type.startsWith("mouse") && t.type !== "contextmenu" && t.type !== "click", Vv: t.type, Ov: i.target, Bv: t.view, Av: () => {
      t.type !== "touchstart" && xt(t);
    } };
  }
}
function ki(n, t) {
  const e = n.clientX - t.clientX, i = n.clientY - t.clientY;
  return Math.sqrt(e * e + i * i);
}
function xt(n) {
  n.cancelable && n.preventDefault();
}
function Q(n) {
  return { nt: n.pageX, st: n.pageY };
}
function Xt(n) {
  return n.timeStamp || performance.now();
}
function xe(n, t) {
  for (let e = 0; e < n.length; ++e) if (n[e].identifier === t) return n[e];
  return null;
}
function Ht(n) {
  return { Hc: n.Hc, Iv: { gr: n.zv.externalId }, Lv: n.zv.cursorStyle };
}
function jr(n, t, e) {
  for (const i of n) {
    const s = i.gt();
    if (s !== null && s.wr) {
      const r = s.wr(t, e);
      if (r !== null) return { Bv: i, Iv: r };
    }
  }
  return null;
}
function ye(n, t) {
  return (e) => {
    var i, s, r, h;
    return ((s = (i = e.Dt()) === null || i === void 0 ? void 0 : i.Pa()) !== null && s !== void 0 ? s : "") !== t ? [] : (h = (r = e.da) === null || r === void 0 ? void 0 : r.call(e, n)) !== null && h !== void 0 ? h : [];
  };
}
function Li(n, t, e, i) {
  if (!n.length) return;
  let s = 0;
  const r = e / 2, h = n[0].At(i, !0);
  let o = t === 1 ? r - (n[0].Vi() - h / 2) : n[0].Vi() - h / 2 - r;
  o = Math.max(0, o);
  for (let l = 1; l < n.length; l++) {
    const c = n[l], a = n[l - 1], u = a.At(i, !1), d = c.Vi(), p = a.Vi();
    if (t === 1 ? d > p - u : d < p + u) {
      const f = p - u * t;
      c.Oi(f);
      const v = f - t * u / 2;
      if ((t === 1 ? v < 0 : v > e) && o > 0) {
        const g = t === 1 ? -1 - v : v - e, y = Math.min(g, o);
        for (let x = s; x < n.length; x++) n[x].Oi(n[x].Vi() + t * y);
        o -= y;
      }
    } else s = l, o = t === 1 ? p - u - d : d - (p + u);
  }
}
class Ti {
  constructor(t, e, i, s) {
    this.Li = null, this.Ev = null, this.Nv = !1, this.Fv = new Rt(200), this.Qr = null, this.Wv = 0, this.jv = !1, this.Hv = () => {
      this.jv || this.tn.$v().$t().Uh();
    }, this.Uv = () => {
      this.jv || this.tn.$v().$t().Uh();
    }, this.tn = t, this.cn = e, this.ko = e.layout, this.Oc = i, this.qv = s === "left", this.Yv = ye("normal", s), this.Zv = ye("top", s), this.Xv = ye("bottom", s), this.Kv = document.createElement("div"), this.Kv.style.height = "100%", this.Kv.style.overflow = "hidden", this.Kv.style.width = "25px", this.Kv.style.left = "0", this.Kv.style.position = "relative", this.Gv = vt(this.Kv, P({ width: 16, height: 16 })), this.Gv.subscribeSuggestedBitmapSizeChanged(this.Hv);
    const r = this.Gv.canvasElement;
    r.style.position = "absolute", r.style.zIndex = "1", r.style.left = "0", r.style.top = "0", this.Jv = vt(this.Kv, P({ width: 16, height: 16 })), this.Jv.subscribeSuggestedBitmapSizeChanged(this.Uv);
    const h = this.Jv.canvasElement;
    h.style.position = "absolute", h.style.zIndex = "2", h.style.left = "0", h.style.top = "0";
    const o = { bv: this.Qv.bind(this), pv: this.Qv.bind(this), av: this.tp.bind(this), hv: this.tp.bind(this), wv: this.ip.bind(this), cv: this.np.bind(this), _v: this.np.bind(this), qf: this.sp.bind(this), jf: this.sp.bind(this), Qf: this.ep.bind(this), Pv: this.rp.bind(this) };
    this.hp = new Fe(this.Jv.canvasElement, o, { ev: () => !this.cn.handleScroll.vertTouchDrag, rv: () => !0 });
  }
  S() {
    this.hp.S(), this.Jv.unsubscribeSuggestedBitmapSizeChanged(this.Uv), gt(this.Jv.canvasElement), this.Jv.dispose(), this.Gv.unsubscribeSuggestedBitmapSizeChanged(this.Hv), gt(this.Gv.canvasElement), this.Gv.dispose(), this.Li !== null && this.Li.Ko().p(this), this.Li = null;
  }
  lp() {
    return this.Kv;
  }
  P() {
    return this.ko.fontSize;
  }
  ap() {
    const t = this.Oc.W();
    return this.Qr !== t.R && (this.Fv.nr(), this.Qr = t.R), t;
  }
  op() {
    if (this.Li === null) return 0;
    let t = 0;
    const e = this.ap(), i = w(this.Gv.canvasElement.getContext("2d"));
    i.save();
    const s = this.Li.Ha();
    i.font = this._p(), s.length > 0 && (t = Math.max(this.Fv.xi(i, s[0].so), this.Fv.xi(i, s[s.length - 1].so)));
    const r = this.up();
    for (let c = r.length; c--; ) {
      const a = this.Fv.xi(i, r[c].Kt());
      a > t && (t = a);
    }
    const h = this.Li.Ct();
    if (h !== null && this.Ev !== null && (o = this.cn.crosshair).mode !== 2 && o.horzLine.visible && o.horzLine.labelVisible) {
      const c = this.Li.pn(1, h), a = this.Li.pn(this.Ev.height - 2, h);
      t = Math.max(t, this.Fv.xi(i, this.Li.Fi(Math.floor(Math.min(c, a)) + 0.11111111111111, h)), this.Fv.xi(i, this.Li.Fi(Math.ceil(Math.max(c, a)) - 0.11111111111111, h)));
    }
    var o;
    i.restore();
    const l = t || 34;
    return ke(Math.ceil(e.C + e.T + e.A + e.I + 5 + l));
  }
  cp(t) {
    this.Ev !== null && ft(this.Ev, t) || (this.Ev = t, this.jv = !0, this.Gv.resizeCanvasElement(t), this.Jv.resizeCanvasElement(t), this.jv = !1, this.Kv.style.width = `${t.width}px`, this.Kv.style.height = `${t.height}px`);
  }
  dp() {
    return w(this.Ev).width;
  }
  Gi(t) {
    this.Li !== t && (this.Li !== null && this.Li.Ko().p(this), this.Li = t, t.Ko().l(this.fo.bind(this), this));
  }
  Dt() {
    return this.Li;
  }
  nr() {
    const t = this.tn.fp();
    this.tn.$v().$t().E_(t, w(this.Dt()));
  }
  vp(t) {
    if (this.Ev === null) return;
    if (t !== 1) {
      this.pp(), this.Gv.applySuggestedBitmapSize();
      const i = mt(this.Gv);
      i !== null && (i.useBitmapCoordinateSpace((s) => {
        this.mp(s), this.Ie(s);
      }), this.tn.bp(i, this.Xv), this.wp(i), this.tn.bp(i, this.Yv), this.gp(i));
    }
    this.Jv.applySuggestedBitmapSize();
    const e = mt(this.Jv);
    e !== null && (e.useBitmapCoordinateSpace(({ context: i, bitmapSize: s }) => {
      i.clearRect(0, 0, s.width, s.height);
    }), this.Mp(e), this.tn.bp(e, this.Zv));
  }
  xp() {
    return this.Gv.bitmapSize;
  }
  Sp(t, e, i) {
    const s = this.xp();
    s.width > 0 && s.height > 0 && t.drawImage(this.Gv.canvasElement, e, i);
  }
  bt() {
    var t;
    (t = this.Li) === null || t === void 0 || t.Ha();
  }
  Qv(t) {
    if (this.Li === null || this.Li.Ni() || !this.cn.handleScale.axisPressedMouseMove.price) return;
    const e = this.tn.$v().$t(), i = this.tn.fp();
    this.Nv = !0, e.V_(i, this.Li, t.localY);
  }
  tp(t) {
    if (this.Li === null || !this.cn.handleScale.axisPressedMouseMove.price) return;
    const e = this.tn.$v().$t(), i = this.tn.fp(), s = this.Li;
    e.O_(i, s, t.localY);
  }
  ip() {
    if (this.Li === null || !this.cn.handleScale.axisPressedMouseMove.price) return;
    const t = this.tn.$v().$t(), e = this.tn.fp(), i = this.Li;
    this.Nv && (this.Nv = !1, t.B_(e, i));
  }
  np(t) {
    if (this.Li === null || !this.cn.handleScale.axisPressedMouseMove.price) return;
    const e = this.tn.$v().$t(), i = this.tn.fp();
    this.Nv = !1, e.B_(i, this.Li);
  }
  sp(t) {
    this.cn.handleScale.axisDoubleClickReset.price && this.nr();
  }
  ep(t) {
    this.Li !== null && (!this.tn.$v().$t().W().handleScale.axisPressedMouseMove.price || this.Li.Mh() || this.Li.Oo() || this.kp(1));
  }
  rp(t) {
    this.kp(0);
  }
  up() {
    const t = [], e = this.Li === null ? void 0 : this.Li;
    return ((i) => {
      for (let s = 0; s < i.length; ++s) {
        const r = i[s].Rn(this.tn.fp(), e);
        for (let h = 0; h < r.length; h++) t.push(r[h]);
      }
    })(this.tn.fp().Uo()), t;
  }
  mp({ context: t, bitmapSize: e }) {
    const { width: i, height: s } = e, r = this.tn.fp().$t(), h = r.q(), o = r.bd();
    h === o ? ie(t, 0, 0, i, s, h) : is(t, 0, 0, i, s, h, o);
  }
  Ie({ context: t, bitmapSize: e, horizontalPixelRatio: i }) {
    if (this.Ev === null || this.Li === null || !this.Li.W().borderVisible) return;
    t.fillStyle = this.Li.W().borderColor;
    const s = Math.max(1, Math.floor(this.ap().C * i));
    let r;
    r = this.qv ? e.width - s : 0, t.fillRect(r, 0, s, e.height);
  }
  wp(t) {
    if (this.Ev === null || this.Li === null) return;
    const e = this.Li.Ha(), i = this.Li.W(), s = this.ap(), r = this.qv ? this.Ev.width - s.T : 0;
    i.borderVisible && i.ticksVisible && t.useBitmapCoordinateSpace(({ context: h, horizontalPixelRatio: o, verticalPixelRatio: l }) => {
      h.fillStyle = i.borderColor;
      const c = Math.max(1, Math.floor(l)), a = Math.floor(0.5 * l), u = Math.round(s.T * o);
      h.beginPath();
      for (const d of e) h.rect(Math.floor(r * o), Math.round(d.Ea * l) - a, u, c);
      h.fill();
    }), t.useMediaCoordinateSpace(({ context: h }) => {
      var o;
      h.font = this._p(), h.fillStyle = (o = i.textColor) !== null && o !== void 0 ? o : this.ko.textColor, h.textAlign = this.qv ? "right" : "left", h.textBaseline = "middle";
      const l = this.qv ? Math.round(r - s.A) : Math.round(r + s.T + s.A), c = e.map((a) => this.Fv.Mi(h, a.so));
      for (let a = e.length; a--; ) {
        const u = e[a];
        h.fillText(u.so, l, u.Ea + c[a]);
      }
    });
  }
  pp() {
    if (this.Ev === null || this.Li === null) return;
    const t = [], e = this.Li.Uo().slice(), i = this.tn.fp(), s = this.ap();
    this.Li === i.pr() && this.tn.fp().Uo().forEach((h) => {
      i.vr(h) && e.push(h);
    });
    const r = this.Li;
    e.forEach((h) => {
      h.Rn(i, r).forEach((o) => {
        o.Oi(null), o.Bi() && t.push(o);
      });
    }), t.forEach((h) => h.Oi(h.ki())), this.Li.W().alignLabels && this.yp(t, s);
  }
  yp(t, e) {
    if (this.Ev === null) return;
    const i = this.Ev.height / 2, s = t.filter((h) => h.ki() <= i), r = t.filter((h) => h.ki() > i);
    s.sort((h, o) => o.ki() - h.ki()), r.sort((h, o) => h.ki() - o.ki());
    for (const h of t) {
      const o = Math.floor(h.At(e) / 2), l = h.ki();
      l > -o && l < o && h.Oi(o), l > this.Ev.height - o && l < this.Ev.height + o && h.Oi(this.Ev.height - o);
    }
    Li(s, 1, this.Ev.height, e), Li(r, -1, this.Ev.height, e);
  }
  gp(t) {
    if (this.Ev === null) return;
    const e = this.up(), i = this.ap(), s = this.qv ? "right" : "left";
    e.forEach((r) => {
      r.Ai() && r.gt(w(this.Li)).X(t, i, this.Fv, s);
    });
  }
  Mp(t) {
    if (this.Ev === null || this.Li === null) return;
    const e = this.tn.$v().$t(), i = [], s = this.tn.fp(), r = e.Zc().Rn(s, this.Li);
    r.length && i.push(r);
    const h = this.ap(), o = this.qv ? "right" : "left";
    i.forEach((l) => {
      l.forEach((c) => {
        c.gt(w(this.Li)).X(t, h, this.Fv, o);
      });
    });
  }
  kp(t) {
    this.Kv.style.cursor = t === 1 ? "ns-resize" : "default";
  }
  fo() {
    const t = this.op();
    this.Wv < t && this.tn.$v().$t().Kl(), this.Wv = t;
  }
  _p() {
    return _t(this.ko.fontSize, this.ko.fontFamily);
  }
}
function Kr(n, t) {
  var e, i;
  return (i = (e = n.ua) === null || e === void 0 ? void 0 : e.call(n, t)) !== null && i !== void 0 ? i : [];
}
function Ut(n, t) {
  var e, i;
  return (i = (e = n.Pn) === null || e === void 0 ? void 0 : e.call(n, t)) !== null && i !== void 0 ? i : [];
}
function Ar(n, t) {
  var e, i;
  return (i = (e = n.Ji) === null || e === void 0 ? void 0 : e.call(n, t)) !== null && i !== void 0 ? i : [];
}
function Xr(n, t) {
  var e, i;
  return (i = (e = n.aa) === null || e === void 0 ? void 0 : e.call(n, t)) !== null && i !== void 0 ? i : [];
}
class je {
  constructor(t, e) {
    this.Ev = P({ width: 0, height: 0 }), this.Cp = null, this.Tp = null, this.Pp = null, this.Rp = null, this.Dp = !1, this.Vp = new V(), this.Op = new V(), this.Bp = 0, this.Ap = !1, this.Ip = null, this.zp = !1, this.Lp = null, this.Ep = null, this.jv = !1, this.Hv = () => {
      this.jv || this.Np === null || this.$i().Uh();
    }, this.Uv = () => {
      this.jv || this.Np === null || this.$i().Uh();
    }, this.Qd = t, this.Np = e, this.Np.W_().l(this.Fp.bind(this), this, !0), this.Wp = document.createElement("td"), this.Wp.style.padding = "0", this.Wp.style.position = "relative";
    const i = document.createElement("div");
    i.style.width = "100%", i.style.height = "100%", i.style.position = "relative", i.style.overflow = "hidden", this.jp = document.createElement("td"), this.jp.style.padding = "0", this.Hp = document.createElement("td"), this.Hp.style.padding = "0", this.Wp.appendChild(i), this.Gv = vt(i, P({ width: 16, height: 16 })), this.Gv.subscribeSuggestedBitmapSizeChanged(this.Hv);
    const s = this.Gv.canvasElement;
    s.style.position = "absolute", s.style.zIndex = "1", s.style.left = "0", s.style.top = "0", this.Jv = vt(i, P({ width: 16, height: 16 })), this.Jv.subscribeSuggestedBitmapSizeChanged(this.Uv);
    const r = this.Jv.canvasElement;
    r.style.position = "absolute", r.style.zIndex = "2", r.style.left = "0", r.style.top = "0", this.$p = document.createElement("tr"), this.$p.appendChild(this.jp), this.$p.appendChild(this.Wp), this.$p.appendChild(this.Hp), this.Up(), this.hp = new Fe(this.Jv.canvasElement, this, { ev: () => this.Ip === null && !this.Qd.W().handleScroll.vertTouchDrag, rv: () => this.Ip === null && !this.Qd.W().handleScroll.horzTouchDrag });
  }
  S() {
    this.Cp !== null && this.Cp.S(), this.Tp !== null && this.Tp.S(), this.Pp = null, this.Jv.unsubscribeSuggestedBitmapSizeChanged(this.Uv), gt(this.Jv.canvasElement), this.Jv.dispose(), this.Gv.unsubscribeSuggestedBitmapSizeChanged(this.Hv), gt(this.Gv.canvasElement), this.Gv.dispose(), this.Np !== null && this.Np.W_().p(this), this.hp.S();
  }
  fp() {
    return w(this.Np);
  }
  qp(t) {
    var e, i;
    this.Np !== null && this.Np.W_().p(this), this.Np = t, this.Np !== null && this.Np.W_().l(je.prototype.Fp.bind(this), this, !0), this.Up(), this.Qd.Yp().indexOf(this) === this.Qd.Yp().length - 1 ? (this.Pp = (e = this.Pp) !== null && e !== void 0 ? e : new Ir(this.Wp, this.Qd), this.Pp.bt()) : ((i = this.Pp) === null || i === void 0 || i.if(), this.Pp = null);
  }
  $v() {
    return this.Qd;
  }
  lp() {
    return this.$p;
  }
  Up() {
    if (this.Np !== null && (this.Zp(), this.$i().wt().length !== 0)) {
      if (this.Cp !== null) {
        const t = this.Np.R_();
        this.Cp.Gi(w(t));
      }
      if (this.Tp !== null) {
        const t = this.Np.D_();
        this.Tp.Gi(w(t));
      }
    }
  }
  Xp() {
    this.Cp !== null && this.Cp.bt(), this.Tp !== null && this.Tp.bt();
  }
  M_() {
    return this.Np !== null ? this.Np.M_() : 0;
  }
  x_(t) {
    this.Np && this.Np.x_(t);
  }
  Qf(t) {
    if (!this.Np) return;
    this.Kp();
    const e = t.localX, i = t.localY;
    this.Gp(e, i, t);
  }
  bv(t) {
    this.Kp(), this.Jp(), this.Gp(t.localX, t.localY, t);
  }
  tv(t) {
    var e;
    if (!this.Np) return;
    this.Kp();
    const i = t.localX, s = t.localY;
    this.Gp(i, s, t);
    const r = this.wr(i, s);
    this.Qd.Qp((e = r == null ? void 0 : r.Lv) !== null && e !== void 0 ? e : null), this.$i().jc(r && { Hc: r.Hc, Iv: r.Iv });
  }
  dv(t) {
    this.Np !== null && (this.Kp(), this.tm(t));
  }
  qf(t) {
    this.Np !== null && this.im(this.Op, t);
  }
  jf(t) {
    this.qf(t);
  }
  av(t) {
    this.Kp(), this.nm(t), this.Gp(t.localX, t.localY, t);
  }
  cv(t) {
    this.Np !== null && (this.Kp(), this.Ap = !1, this.sm(t));
  }
  uv(t) {
    this.Np !== null && this.tm(t);
  }
  Rv(t) {
    if (this.Ap = !0, this.Ip === null) {
      const e = { x: t.localX, y: t.localY };
      this.rm(e, e, t);
    }
  }
  Pv(t) {
    this.Np !== null && (this.Kp(), this.Np.$t().jc(null), this.hm());
  }
  lm() {
    return this.Vp;
  }
  am() {
    return this.Op;
  }
  xv() {
    this.Bp = 1, this.$i().Un();
  }
  Sv(t, e) {
    if (!this.Qd.W().handleScale.pinch) return;
    const i = 5 * (e - this.Bp);
    this.Bp = e, this.$i().Qc(t.nt, i);
  }
  pv(t) {
    this.Ap = !1, this.zp = this.Ip !== null, this.Jp();
    const e = this.$i().Zc();
    this.Ip !== null && e.yt() && (this.Lp = { x: e.Yt(), y: e.Zt() }, this.Ip = { x: t.localX, y: t.localY });
  }
  hv(t) {
    if (this.Np === null) return;
    const e = t.localX, i = t.localY;
    if (this.Ip === null) this.nm(t);
    else {
      this.zp = !1;
      const s = w(this.Lp), r = s.x + (e - this.Ip.x), h = s.y + (i - this.Ip.y);
      this.Gp(r, h, t);
    }
  }
  _v(t) {
    this.$v().W().trackingMode.exitMode === 0 && (this.zp = !0), this.om(), this.sm(t);
  }
  wr(t, e) {
    const i = this.Np;
    return i === null ? null : function(s, r, h) {
      const o = s.Uo(), l = function(c, a, u) {
        var d, p;
        let f, v;
        for (const x of c) {
          const _ = (p = (d = x.va) === null || d === void 0 ? void 0 : d.call(x, a, u)) !== null && p !== void 0 ? p : [];
          for (const S of _) g = S.zOrder, (!(y = f == null ? void 0 : f.zOrder) || g === "top" && y !== "top" || g === "normal" && y === "bottom") && (f = S, v = x);
        }
        var g, y;
        return f && v ? { zv: f, Hc: v } : null;
      }(o, r, h);
      if ((l == null ? void 0 : l.zv.zOrder) === "top") return Ht(l);
      for (const c of o) {
        if (l && l.Hc === c && l.zv.zOrder !== "bottom" && !l.zv.isBackground) return Ht(l);
        const a = jr(c.Pn(s), r, h);
        if (a !== null) return { Hc: c, Bv: a.Bv, Iv: a.Iv };
        if (l && l.Hc === c && l.zv.zOrder !== "bottom" && l.zv.isBackground) return Ht(l);
      }
      return l != null && l.zv ? Ht(l) : null;
    }(i, t, e);
  }
  _m(t, e) {
    w(e === "left" ? this.Cp : this.Tp).cp(P({ width: t, height: this.Ev.height }));
  }
  um() {
    return this.Ev;
  }
  cp(t) {
    ft(this.Ev, t) || (this.Ev = t, this.jv = !0, this.Gv.resizeCanvasElement(t), this.Jv.resizeCanvasElement(t), this.jv = !1, this.Wp.style.width = t.width + "px", this.Wp.style.height = t.height + "px");
  }
  dm() {
    const t = w(this.Np);
    t.P_(t.R_()), t.P_(t.D_());
    for (const e of t.Ba()) if (t.vr(e)) {
      const i = e.Dt();
      i !== null && t.P_(i), e.Vn();
    }
  }
  xp() {
    return this.Gv.bitmapSize;
  }
  Sp(t, e, i) {
    const s = this.xp();
    s.width > 0 && s.height > 0 && t.drawImage(this.Gv.canvasElement, e, i);
  }
  vp(t) {
    if (t === 0 || this.Np === null) return;
    if (t > 1 && this.dm(), this.Cp !== null && this.Cp.vp(t), this.Tp !== null && this.Tp.vp(t), t !== 1) {
      this.Gv.applySuggestedBitmapSize();
      const i = mt(this.Gv);
      i !== null && (i.useBitmapCoordinateSpace((s) => {
        this.mp(s);
      }), this.Np && (this.fm(i, Kr), this.vm(i), this.pm(i), this.fm(i, Ut), this.fm(i, Ar)));
    }
    this.Jv.applySuggestedBitmapSize();
    const e = mt(this.Jv);
    e !== null && (e.useBitmapCoordinateSpace(({ context: i, bitmapSize: s }) => {
      i.clearRect(0, 0, s.width, s.height);
    }), this.bm(e), this.fm(e, Xr));
  }
  wm() {
    return this.Cp;
  }
  gm() {
    return this.Tp;
  }
  bp(t, e) {
    this.fm(t, e);
  }
  Fp() {
    this.Np !== null && this.Np.W_().p(this), this.Np = null;
  }
  tm(t) {
    this.im(this.Vp, t);
  }
  im(t, e) {
    const i = e.localX, s = e.localY;
    t.M() && t.m(this.$i().St().Nu(i), { x: i, y: s }, e);
  }
  mp({ context: t, bitmapSize: e }) {
    const { width: i, height: s } = e, r = this.$i(), h = r.q(), o = r.bd();
    h === o ? ie(t, 0, 0, i, s, o) : is(t, 0, 0, i, s, h, o);
  }
  vm(t) {
    const e = w(this.Np).j_().qh().gt();
    e !== null && e.X(t, !1);
  }
  pm(t) {
    const e = this.$i().Yc();
    this.Mm(t, Ut, Le, e), this.Mm(t, Ut, Gt, e);
  }
  bm(t) {
    this.Mm(t, Ut, Gt, this.$i().Zc());
  }
  fm(t, e) {
    const i = w(this.Np).Uo();
    for (const s of i) this.Mm(t, e, Le, s);
    for (const s of i) this.Mm(t, e, Gt, s);
  }
  Mm(t, e, i, s) {
    const r = w(this.Np), h = r.$t().Wc(), o = h !== null && h.Hc === s, l = h !== null && o && h.Iv !== void 0 ? h.Iv.Mr : void 0;
    Te(e, (c) => i(c, t, o, l), s, r);
  }
  Zp() {
    if (this.Np === null) return;
    const t = this.Qd, e = this.Np.R_().W().visible, i = this.Np.D_().W().visible;
    e || this.Cp === null || (this.jp.removeChild(this.Cp.lp()), this.Cp.S(), this.Cp = null), i || this.Tp === null || (this.Hp.removeChild(this.Tp.lp()), this.Tp.S(), this.Tp = null);
    const s = t.$t().ud();
    e && this.Cp === null && (this.Cp = new Ti(this, t.W(), s, "left"), this.jp.appendChild(this.Cp.lp())), i && this.Tp === null && (this.Tp = new Ti(this, t.W(), s, "right"), this.Hp.appendChild(this.Tp.lp()));
  }
  xm(t) {
    return t.Dv && this.Ap || this.Ip !== null;
  }
  Sm(t) {
    return Math.max(0, Math.min(t, this.Ev.width - 1));
  }
  km(t) {
    return Math.max(0, Math.min(t, this.Ev.height - 1));
  }
  Gp(t, e, i) {
    this.$i().ld(this.Sm(t), this.km(e), i, w(this.Np));
  }
  hm() {
    this.$i().od();
  }
  om() {
    this.zp && (this.Ip = null, this.hm());
  }
  rm(t, e, i) {
    this.Ip = t, this.zp = !1, this.Gp(e.x, e.y, i);
    const s = this.$i().Zc();
    this.Lp = { x: s.Yt(), y: s.Zt() };
  }
  $i() {
    return this.Qd.$t();
  }
  sm(t) {
    if (!this.Dp) return;
    const e = this.$i(), i = this.fp();
    if (e.z_(i, i.vn()), this.Rp = null, this.Dp = !1, e.ed(), this.Ep !== null) {
      const s = performance.now(), r = e.St();
      this.Ep.Vr(r.Hu(), s), this.Ep.Qu(s) || e.Zn(this.Ep);
    }
  }
  Kp() {
    this.Ip = null;
  }
  Jp() {
    if (this.Np) {
      if (this.$i().Un(), document.activeElement !== document.body && document.activeElement !== document.documentElement) w(document.activeElement).blur();
      else {
        const t = document.getSelection();
        t !== null && t.removeAllRanges();
      }
      !this.Np.vn().Ni() && this.$i().St().Ni();
    }
  }
  nm(t) {
    if (this.Np === null) return;
    const e = this.$i(), i = e.St();
    if (i.Ni()) return;
    const s = this.Qd.W(), r = s.handleScroll, h = s.kineticScroll;
    if ((!r.pressedMouseMove || t.Dv) && (!r.horzTouchDrag && !r.vertTouchDrag || !t.Dv)) return;
    const o = this.Np.vn(), l = performance.now();
    if (this.Rp !== null || this.xm(t) || (this.Rp = { x: t.clientX, y: t.clientY, Od: l, ym: t.localX, Cm: t.localY }), this.Rp !== null && !this.Dp && (this.Rp.x !== t.clientX || this.Rp.y !== t.clientY)) {
      if (t.Dv && h.touch || !t.Dv && h.mouse) {
        const c = i.le();
        this.Ep = new Br(0.2 / c, 7 / c, 0.997, 15 / c), this.Ep.Yd(i.Hu(), this.Rp.Od);
      } else this.Ep = null;
      o.Ni() || e.A_(this.Np, o, t.localY), e.nd(t.localX), this.Dp = !0;
    }
    this.Dp && (o.Ni() || e.I_(this.Np, o, t.localY), e.sd(t.localX), this.Ep !== null && this.Ep.Yd(i.Hu(), l));
  }
}
class Pi {
  constructor(t, e, i, s, r) {
    this.ft = !0, this.Ev = P({ width: 0, height: 0 }), this.Hv = () => this.vp(3), this.qv = t === "left", this.Oc = i.ud, this.cn = e, this.Tm = s, this.Pm = r, this.Kv = document.createElement("div"), this.Kv.style.width = "25px", this.Kv.style.height = "100%", this.Kv.style.overflow = "hidden", this.Gv = vt(this.Kv, P({ width: 16, height: 16 })), this.Gv.subscribeSuggestedBitmapSizeChanged(this.Hv);
  }
  S() {
    this.Gv.unsubscribeSuggestedBitmapSizeChanged(this.Hv), gt(this.Gv.canvasElement), this.Gv.dispose();
  }
  lp() {
    return this.Kv;
  }
  um() {
    return this.Ev;
  }
  cp(t) {
    ft(this.Ev, t) || (this.Ev = t, this.Gv.resizeCanvasElement(t), this.Kv.style.width = `${t.width}px`, this.Kv.style.height = `${t.height}px`, this.ft = !0);
  }
  vp(t) {
    if (t < 3 && !this.ft || this.Ev.width === 0 || this.Ev.height === 0) return;
    this.ft = !1, this.Gv.applySuggestedBitmapSize();
    const e = mt(this.Gv);
    e !== null && e.useBitmapCoordinateSpace((i) => {
      this.mp(i), this.Ie(i);
    });
  }
  xp() {
    return this.Gv.bitmapSize;
  }
  Sp(t, e, i) {
    const s = this.xp();
    s.width > 0 && s.height > 0 && t.drawImage(this.Gv.canvasElement, e, i);
  }
  Ie({ context: t, bitmapSize: e, horizontalPixelRatio: i, verticalPixelRatio: s }) {
    if (!this.Tm()) return;
    t.fillStyle = this.cn.timeScale.borderColor;
    const r = Math.floor(this.Oc.W().C * i), h = Math.floor(this.Oc.W().C * s), o = this.qv ? e.width - r : 0;
    t.fillRect(o, 0, r, h);
  }
  mp({ context: t, bitmapSize: e }) {
    ie(t, 0, 0, e.width, e.height, this.Pm());
  }
}
function Ke(n) {
  return (t) => {
    var e, i;
    return (i = (e = t.fa) === null || e === void 0 ? void 0 : e.call(t, n)) !== null && i !== void 0 ? i : [];
  };
}
const Hr = Ke("normal"), Ur = Ke("top"), qr = Ke("bottom");
class Jr {
  constructor(t, e) {
    this.Rm = null, this.Dm = null, this.k = null, this.Vm = !1, this.Ev = P({ width: 0, height: 0 }), this.Om = new V(), this.Fv = new Rt(5), this.jv = !1, this.Hv = () => {
      this.jv || this.Qd.$t().Uh();
    }, this.Uv = () => {
      this.jv || this.Qd.$t().Uh();
    }, this.Qd = t, this.q_ = e, this.cn = t.W().layout, this.Xd = document.createElement("tr"), this.Bm = document.createElement("td"), this.Bm.style.padding = "0", this.Am = document.createElement("td"), this.Am.style.padding = "0", this.Kv = document.createElement("td"), this.Kv.style.height = "25px", this.Kv.style.padding = "0", this.Im = document.createElement("div"), this.Im.style.width = "100%", this.Im.style.height = "100%", this.Im.style.position = "relative", this.Im.style.overflow = "hidden", this.Kv.appendChild(this.Im), this.Gv = vt(this.Im, P({ width: 16, height: 16 })), this.Gv.subscribeSuggestedBitmapSizeChanged(this.Hv);
    const i = this.Gv.canvasElement;
    i.style.position = "absolute", i.style.zIndex = "1", i.style.left = "0", i.style.top = "0", this.Jv = vt(this.Im, P({ width: 16, height: 16 })), this.Jv.subscribeSuggestedBitmapSizeChanged(this.Uv);
    const s = this.Jv.canvasElement;
    s.style.position = "absolute", s.style.zIndex = "2", s.style.left = "0", s.style.top = "0", this.Xd.appendChild(this.Bm), this.Xd.appendChild(this.Kv), this.Xd.appendChild(this.Am), this.zm(), this.Qd.$t().g_().l(this.zm.bind(this), this), this.hp = new Fe(this.Jv.canvasElement, this, { ev: () => !0, rv: () => !this.Qd.W().handleScroll.horzTouchDrag });
  }
  S() {
    this.hp.S(), this.Rm !== null && this.Rm.S(), this.Dm !== null && this.Dm.S(), this.Jv.unsubscribeSuggestedBitmapSizeChanged(this.Uv), gt(this.Jv.canvasElement), this.Jv.dispose(), this.Gv.unsubscribeSuggestedBitmapSizeChanged(this.Hv), gt(this.Gv.canvasElement), this.Gv.dispose();
  }
  lp() {
    return this.Xd;
  }
  Lm() {
    return this.Rm;
  }
  Em() {
    return this.Dm;
  }
  bv(t) {
    if (this.Vm) return;
    this.Vm = !0;
    const e = this.Qd.$t();
    !e.St().Ni() && this.Qd.W().handleScale.axisPressedMouseMove.time && e.Jc(t.localX);
  }
  pv(t) {
    this.bv(t);
  }
  wv() {
    const t = this.Qd.$t();
    !t.St().Ni() && this.Vm && (this.Vm = !1, this.Qd.W().handleScale.axisPressedMouseMove.time && t.hd());
  }
  av(t) {
    const e = this.Qd.$t();
    !e.St().Ni() && this.Qd.W().handleScale.axisPressedMouseMove.time && e.rd(t.localX);
  }
  hv(t) {
    this.av(t);
  }
  cv() {
    this.Vm = !1;
    const t = this.Qd.$t();
    t.St().Ni() && !this.Qd.W().handleScale.axisPressedMouseMove.time || t.hd();
  }
  _v() {
    this.cv();
  }
  qf() {
    this.Qd.W().handleScale.axisDoubleClickReset.time && this.Qd.$t().Kn();
  }
  jf() {
    this.qf();
  }
  Qf() {
    this.Qd.$t().W().handleScale.axisPressedMouseMove.time && this.kp(1);
  }
  Pv() {
    this.kp(0);
  }
  um() {
    return this.Ev;
  }
  Nm() {
    return this.Om;
  }
  Fm(t, e, i) {
    ft(this.Ev, t) || (this.Ev = t, this.jv = !0, this.Gv.resizeCanvasElement(t), this.Jv.resizeCanvasElement(t), this.jv = !1, this.Kv.style.width = `${t.width}px`, this.Kv.style.height = `${t.height}px`, this.Om.m(t)), this.Rm !== null && this.Rm.cp(P({ width: e, height: t.height })), this.Dm !== null && this.Dm.cp(P({ width: i, height: t.height }));
  }
  Wm() {
    const t = this.jm();
    return Math.ceil(t.C + t.T + t.P + t.L + t.B + t.Hm);
  }
  bt() {
    this.Qd.$t().St().Ha();
  }
  xp() {
    return this.Gv.bitmapSize;
  }
  Sp(t, e, i) {
    const s = this.xp();
    s.width > 0 && s.height > 0 && t.drawImage(this.Gv.canvasElement, e, i);
  }
  vp(t) {
    if (t === 0) return;
    if (t !== 1) {
      this.Gv.applySuggestedBitmapSize();
      const i = mt(this.Gv);
      i !== null && (i.useBitmapCoordinateSpace((s) => {
        this.mp(s), this.Ie(s), this.$m(i, qr);
      }), this.wp(i), this.$m(i, Hr)), this.Rm !== null && this.Rm.vp(t), this.Dm !== null && this.Dm.vp(t);
    }
    this.Jv.applySuggestedBitmapSize();
    const e = mt(this.Jv);
    e !== null && (e.useBitmapCoordinateSpace(({ context: i, bitmapSize: s }) => {
      i.clearRect(0, 0, s.width, s.height);
    }), this.Um([...this.Qd.$t().wt(), this.Qd.$t().Zc()], e), this.$m(e, Ur));
  }
  $m(t, e) {
    const i = this.Qd.$t().wt();
    for (const s of i) Te(e, (r) => Le(r, t, !1, void 0), s, void 0);
    for (const s of i) Te(e, (r) => Gt(r, t, !1, void 0), s, void 0);
  }
  mp({ context: t, bitmapSize: e }) {
    ie(t, 0, 0, e.width, e.height, this.Qd.$t().bd());
  }
  Ie({ context: t, bitmapSize: e, verticalPixelRatio: i }) {
    if (this.Qd.W().timeScale.borderVisible) {
      t.fillStyle = this.qm();
      const s = Math.max(1, Math.floor(this.jm().C * i));
      t.fillRect(0, 0, e.width, s);
    }
  }
  wp(t) {
    const e = this.Qd.$t().St(), i = e.Ha();
    if (!i || i.length === 0) return;
    const s = this.q_.maxTickMarkWeight(i), r = this.jm(), h = e.W();
    h.borderVisible && h.ticksVisible && t.useBitmapCoordinateSpace(({ context: o, horizontalPixelRatio: l, verticalPixelRatio: c }) => {
      o.strokeStyle = this.qm(), o.fillStyle = this.qm();
      const a = Math.max(1, Math.floor(l)), u = Math.floor(0.5 * l);
      o.beginPath();
      const d = Math.round(r.T * c);
      for (let p = i.length; p--; ) {
        const f = Math.round(i[p].coord * l);
        o.rect(f - u, 0, a, d);
      }
      o.fill();
    }), t.useMediaCoordinateSpace(({ context: o }) => {
      const l = r.C + r.T + r.L + r.P / 2;
      o.textAlign = "center", o.textBaseline = "middle", o.fillStyle = this.$(), o.font = this._p();
      for (const c of i) if (c.weight < s) {
        const a = c.needAlignCoordinate ? this.Ym(o, c.coord, c.label) : c.coord;
        o.fillText(c.label, a, l);
      }
      this.Qd.W().timeScale.allowBoldLabels && (o.font = this.Zm());
      for (const c of i) if (c.weight >= s) {
        const a = c.needAlignCoordinate ? this.Ym(o, c.coord, c.label) : c.coord;
        o.fillText(c.label, a, l);
      }
    });
  }
  Ym(t, e, i) {
    const s = this.Fv.xi(t, i), r = s / 2, h = Math.floor(e - r) + 0.5;
    return h < 0 ? e += Math.abs(0 - h) : h + s > this.Ev.width && (e -= Math.abs(this.Ev.width - (h + s))), e;
  }
  Um(t, e) {
    const i = this.jm();
    for (const s of t) for (const r of s.Qi()) r.gt().X(e, i);
  }
  qm() {
    return this.Qd.W().timeScale.borderColor;
  }
  $() {
    return this.cn.textColor;
  }
  j() {
    return this.cn.fontSize;
  }
  _p() {
    return _t(this.j(), this.cn.fontFamily);
  }
  Zm() {
    return _t(this.j(), this.cn.fontFamily, "bold");
  }
  jm() {
    this.k === null && (this.k = { C: 1, N: NaN, L: NaN, B: NaN, ji: NaN, T: 5, P: NaN, R: "", Wi: new Rt(), Hm: 0 });
    const t = this.k, e = this._p();
    if (t.R !== e) {
      const i = this.j();
      t.P = i, t.R = e, t.L = 3 * i / 12, t.B = 3 * i / 12, t.ji = 9 * i / 12, t.N = 0, t.Hm = 4 * i / 12, t.Wi.nr();
    }
    return this.k;
  }
  kp(t) {
    this.Kv.style.cursor = t === 1 ? "ew-resize" : "default";
  }
  zm() {
    const t = this.Qd.$t(), e = t.W();
    e.leftPriceScale.visible || this.Rm === null || (this.Bm.removeChild(this.Rm.lp()), this.Rm.S(), this.Rm = null), e.rightPriceScale.visible || this.Dm === null || (this.Am.removeChild(this.Dm.lp()), this.Dm.S(), this.Dm = null);
    const i = { ud: this.Qd.$t().ud() }, s = () => e.leftPriceScale.borderVisible && t.St().W().borderVisible, r = () => t.bd();
    e.leftPriceScale.visible && this.Rm === null && (this.Rm = new Pi("left", e, i, s, r), this.Bm.appendChild(this.Rm.lp())), e.rightPriceScale.visible && this.Dm === null && (this.Dm = new Pi("right", e, i, s, r), this.Am.appendChild(this.Dm.lp()));
  }
}
const Gr = !!Ct && !!navigator.userAgentData && navigator.userAgentData.brands.some((n) => n.brand.includes("Chromium")) && !!Ct && (!((Se = navigator == null ? void 0 : navigator.userAgentData) === null || Se === void 0) && Se.platform ? navigator.userAgentData.platform === "Windows" : navigator.userAgent.toLowerCase().indexOf("win") >= 0);
var Se;
class Qr {
  constructor(t, e, i) {
    var s;
    this.Xm = [], this.Km = 0, this.ho = 0, this.__ = 0, this.Gm = 0, this.Jm = 0, this.Qm = null, this.tb = !1, this.Vp = new V(), this.Op = new V(), this.Rc = new V(), this.ib = null, this.nb = null, this.Jd = t, this.cn = e, this.q_ = i, this.Xd = document.createElement("div"), this.Xd.classList.add("tv-lightweight-charts"), this.Xd.style.overflow = "hidden", this.Xd.style.direction = "ltr", this.Xd.style.width = "100%", this.Xd.style.height = "100%", (s = this.Xd).style.userSelect = "none", s.style.webkitUserSelect = "none", s.style.msUserSelect = "none", s.style.MozUserSelect = "none", s.style.webkitTapHighlightColor = "transparent", this.sb = document.createElement("table"), this.sb.setAttribute("cellspacing", "0"), this.Xd.appendChild(this.sb), this.eb = this.rb.bind(this), Me(this.cn) && this.hb(!0), this.$i = new Vr(this.Vc.bind(this), this.cn, i), this.$t().Xc().l(this.lb.bind(this), this), this.ab = new Jr(this, this.q_), this.sb.appendChild(this.ab.lp());
    const r = e.autoSize && this.ob();
    let h = this.cn.width, o = this.cn.height;
    if (r || h === 0 || o === 0) {
      const l = t.getBoundingClientRect();
      h = h || l.width, o = o || l.height;
    }
    this._b(h, o), this.ub(), t.appendChild(this.Xd), this.cb(), this.$i.St().ec().l(this.$i.Kl.bind(this.$i), this), this.$i.g_().l(this.$i.Kl.bind(this.$i), this);
  }
  $t() {
    return this.$i;
  }
  W() {
    return this.cn;
  }
  Yp() {
    return this.Xm;
  }
  fb() {
    return this.ab;
  }
  S() {
    this.hb(!1), this.Km !== 0 && window.cancelAnimationFrame(this.Km), this.$i.Xc().p(this), this.$i.St().ec().p(this), this.$i.g_().p(this), this.$i.S();
    for (const t of this.Xm) this.sb.removeChild(t.lp()), t.lm().p(this), t.am().p(this), t.S();
    this.Xm = [], w(this.ab).S(), this.Xd.parentElement !== null && this.Xd.parentElement.removeChild(this.Xd), this.Rc.S(), this.Vp.S(), this.Op.S(), this.pb();
  }
  _b(t, e, i = !1) {
    if (this.ho === e && this.__ === t) return;
    const s = function(o) {
      const l = Math.floor(o.width), c = Math.floor(o.height);
      return P({ width: l - l % 2, height: c - c % 2 });
    }(P({ width: t, height: e }));
    this.ho = s.height, this.__ = s.width;
    const r = this.ho + "px", h = this.__ + "px";
    w(this.Xd).style.height = r, w(this.Xd).style.width = h, this.sb.style.height = r, this.sb.style.width = h, i ? this.mb(O.es(), performance.now()) : this.$i.Kl();
  }
  vp(t) {
    t === void 0 && (t = O.es());
    for (let e = 0; e < this.Xm.length; e++) this.Xm[e].vp(t.Hn(e).Fn);
    this.cn.timeScale.visible && this.ab.vp(t.jn());
  }
  $h(t) {
    const e = Me(this.cn);
    this.$i.$h(t);
    const i = Me(this.cn);
    i !== e && this.hb(i), this.cb(), this.bb(t);
  }
  lm() {
    return this.Vp;
  }
  am() {
    return this.Op;
  }
  Xc() {
    return this.Rc;
  }
  wb() {
    this.Qm !== null && (this.mb(this.Qm, performance.now()), this.Qm = null);
    const t = this.gb(null), e = document.createElement("canvas");
    e.width = t.width, e.height = t.height;
    const i = w(e.getContext("2d"));
    return this.gb(i), e;
  }
  Mb(t) {
    return t === "left" && !this.xb() || t === "right" && !this.Sb() || this.Xm.length === 0 ? 0 : w(t === "left" ? this.Xm[0].wm() : this.Xm[0].gm()).dp();
  }
  kb() {
    return this.cn.autoSize && this.ib !== null;
  }
  yb() {
    return this.Xd;
  }
  Qp(t) {
    this.nb = t, this.nb ? this.yb().style.setProperty("cursor", t) : this.yb().style.removeProperty("cursor");
  }
  Cb() {
    return this.nb;
  }
  Tb() {
    return B(this.Xm[0]).um();
  }
  bb(t) {
    (t.autoSize !== void 0 || !this.ib || t.width === void 0 && t.height === void 0) && (t.autoSize && !this.ib && this.ob(), t.autoSize === !1 && this.ib !== null && this.pb(), t.autoSize || t.width === void 0 && t.height === void 0 || this._b(t.width || this.__, t.height || this.ho));
  }
  gb(t) {
    let e = 0, i = 0;
    const s = this.Xm[0], r = (o, l) => {
      let c = 0;
      for (let a = 0; a < this.Xm.length; a++) {
        const u = this.Xm[a], d = w(o === "left" ? u.wm() : u.gm()), p = d.xp();
        t !== null && d.Sp(t, l, c), c += p.height;
      }
    };
    this.xb() && (r("left", 0), e += w(s.wm()).xp().width);
    for (let o = 0; o < this.Xm.length; o++) {
      const l = this.Xm[o], c = l.xp();
      t !== null && l.Sp(t, e, i), i += c.height;
    }
    e += s.xp().width, this.Sb() && (r("right", e), e += w(s.gm()).xp().width);
    const h = (o, l, c) => {
      w(o === "left" ? this.ab.Lm() : this.ab.Em()).Sp(w(t), l, c);
    };
    if (this.cn.timeScale.visible) {
      const o = this.ab.xp();
      if (t !== null) {
        let l = 0;
        this.xb() && (h("left", l, i), l = w(s.wm()).xp().width), this.ab.Sp(t, l, i), l += o.width, this.Sb() && h("right", l, i);
      }
      i += o.height;
    }
    return P({ width: e, height: i });
  }
  Pb() {
    let t = 0, e = 0, i = 0;
    for (const f of this.Xm) this.xb() && (e = Math.max(e, w(f.wm()).op(), this.cn.leftPriceScale.minimumWidth)), this.Sb() && (i = Math.max(i, w(f.gm()).op(), this.cn.rightPriceScale.minimumWidth)), t += f.M_();
    e = ke(e), i = ke(i);
    const s = this.__, r = this.ho, h = Math.max(s - e - i, 0), o = this.cn.timeScale.visible;
    let l = o ? Math.max(this.ab.Wm(), this.cn.timeScale.minimumHeight) : 0;
    var c;
    l = (c = l) + c % 2;
    const a = 0 + l, u = r < a ? 0 : r - a, d = u / t;
    let p = 0;
    for (let f = 0; f < this.Xm.length; ++f) {
      const v = this.Xm[f];
      v.qp(this.$i.qc()[f]);
      let g = 0, y = 0;
      y = f === this.Xm.length - 1 ? u - p : Math.round(v.M_() * d), g = Math.max(y, 2), p += g, v.cp(P({ width: h, height: g })), this.xb() && v._m(e, "left"), this.Sb() && v._m(i, "right"), v.fp() && this.$i.Kc(v.fp(), g);
    }
    this.ab.Fm(P({ width: o ? h : 0, height: l }), o ? e : 0, o ? i : 0), this.$i.S_(h), this.Gm !== e && (this.Gm = e), this.Jm !== i && (this.Jm = i);
  }
  hb(t) {
    t ? this.Xd.addEventListener("wheel", this.eb, { passive: !1 }) : this.Xd.removeEventListener("wheel", this.eb);
  }
  Rb(t) {
    switch (t.deltaMode) {
      case t.DOM_DELTA_PAGE:
        return 120;
      case t.DOM_DELTA_LINE:
        return 32;
    }
    return Gr ? 1 / window.devicePixelRatio : 1;
  }
  rb(t) {
    if (!(t.deltaX !== 0 && this.cn.handleScroll.mouseWheel || t.deltaY !== 0 && this.cn.handleScale.mouseWheel)) return;
    const e = this.Rb(t), i = e * t.deltaX / 100, s = -e * t.deltaY / 100;
    if (t.cancelable && t.preventDefault(), s !== 0 && this.cn.handleScale.mouseWheel) {
      const r = Math.sign(s) * Math.min(1, Math.abs(s)), h = t.clientX - this.Xd.getBoundingClientRect().left;
      this.$t().Qc(h, r);
    }
    i !== 0 && this.cn.handleScroll.mouseWheel && this.$t().td(-80 * i);
  }
  mb(t, e) {
    var i;
    const s = t.jn();
    s === 3 && this.Db(), s !== 3 && s !== 2 || (this.Vb(t), this.Ob(t, e), this.ab.bt(), this.Xm.forEach((r) => {
      r.Xp();
    }), ((i = this.Qm) === null || i === void 0 ? void 0 : i.jn()) === 3 && (this.Qm.ts(t), this.Db(), this.Vb(this.Qm), this.Ob(this.Qm, e), t = this.Qm, this.Qm = null)), this.vp(t);
  }
  Ob(t, e) {
    for (const i of t.Qn()) this.ns(i, e);
  }
  Vb(t) {
    const e = this.$i.qc();
    for (let i = 0; i < e.length; i++) t.Hn(i).Wn && e[i].N_();
  }
  ns(t, e) {
    const i = this.$i.St();
    switch (t.qn) {
      case 0:
        i.hc();
        break;
      case 1:
        i.lc(t.Vt);
        break;
      case 2:
        i.Gn(t.Vt);
        break;
      case 3:
        i.Jn(t.Vt);
        break;
      case 4:
        i.qu();
        break;
      case 5:
        t.Vt.Qu(e) || i.Jn(t.Vt.tc(e));
    }
  }
  Vc(t) {
    this.Qm !== null ? this.Qm.ts(t) : this.Qm = t, this.tb || (this.tb = !0, this.Km = window.requestAnimationFrame((e) => {
      if (this.tb = !1, this.Km = 0, this.Qm !== null) {
        const i = this.Qm;
        this.Qm = null, this.mb(i, e);
        for (const s of i.Qn()) if (s.qn === 5 && !s.Vt.Qu(e)) {
          this.$t().Zn(s.Vt);
          break;
        }
      }
    }));
  }
  Db() {
    this.ub();
  }
  ub() {
    const t = this.$i.qc(), e = t.length, i = this.Xm.length;
    for (let s = e; s < i; s++) {
      const r = B(this.Xm.pop());
      this.sb.removeChild(r.lp()), r.lm().p(this), r.am().p(this), r.S();
    }
    for (let s = i; s < e; s++) {
      const r = new je(this, t[s]);
      r.lm().l(this.Bb.bind(this), this), r.am().l(this.Ab.bind(this), this), this.Xm.push(r), this.sb.insertBefore(r.lp(), this.ab.lp());
    }
    for (let s = 0; s < e; s++) {
      const r = t[s], h = this.Xm[s];
      h.fp() !== r ? h.qp(r) : h.Up();
    }
    this.cb(), this.Pb();
  }
  Ib(t, e, i) {
    var s;
    const r = /* @__PURE__ */ new Map();
    t !== null && this.$i.wt().forEach((a) => {
      const u = a.In().ll(t);
      u !== null && r.set(a, u);
    });
    let h;
    if (t !== null) {
      const a = (s = this.$i.St().Ui(t)) === null || s === void 0 ? void 0 : s.originalTime;
      a !== void 0 && (h = a);
    }
    const o = this.$t().Wc(), l = o !== null && o.Hc instanceof Be ? o.Hc : void 0, c = o !== null && o.Iv !== void 0 ? o.Iv.gr : void 0;
    return { zb: h, ee: t ?? void 0, Lb: e ?? void 0, Eb: l, Nb: r, Fb: c, Wb: i ?? void 0 };
  }
  Bb(t, e, i) {
    this.Vp.m(() => this.Ib(t, e, i));
  }
  Ab(t, e, i) {
    this.Op.m(() => this.Ib(t, e, i));
  }
  lb(t, e, i) {
    this.Rc.m(() => this.Ib(t, e, i));
  }
  cb() {
    const t = this.cn.timeScale.visible ? "" : "none";
    this.ab.lp().style.display = t;
  }
  xb() {
    return this.Xm[0].fp().R_().W().visible;
  }
  Sb() {
    return this.Xm[0].fp().D_().W().visible;
  }
  ob() {
    return "ResizeObserver" in window && (this.ib = new ResizeObserver((t) => {
      const e = t.find((i) => i.target === this.Jd);
      e && this._b(e.contentRect.width, e.contentRect.height);
    }), this.ib.observe(this.Jd, { box: "border-box" }), !0);
  }
  pb() {
    this.ib !== null && this.ib.disconnect(), this.ib = null;
  }
}
function Me(n) {
  return !!(n.handleScroll.mouseWheel || n.handleScale.mouseWheel);
}
function Yr(n) {
  return function(t) {
    return t.open !== void 0;
  }(n) || function(t) {
    return t.value !== void 0;
  }(n);
}
function ys(n, t) {
  var e = {};
  for (var i in n) Object.prototype.hasOwnProperty.call(n, i) && t.indexOf(i) < 0 && (e[i] = n[i]);
  if (n != null && typeof Object.getOwnPropertySymbols == "function") {
    var s = 0;
    for (i = Object.getOwnPropertySymbols(n); s < i.length; s++) t.indexOf(i[s]) < 0 && Object.prototype.propertyIsEnumerable.call(n, i[s]) && (e[i[s]] = n[i[s]]);
  }
  return e;
}
function $i(n, t, e, i) {
  const s = e.value, r = { ee: t, ot: n, Vt: [s, s, s, s], zb: i };
  return e.color !== void 0 && (r.V = e.color), r;
}
function Zr(n, t, e, i) {
  const s = e.value, r = { ee: t, ot: n, Vt: [s, s, s, s], zb: i };
  return e.lineColor !== void 0 && (r.lt = e.lineColor), e.topColor !== void 0 && (r.Ps = e.topColor), e.bottomColor !== void 0 && (r.Rs = e.bottomColor), r;
}
function th(n, t, e, i) {
  const s = e.value, r = { ee: t, ot: n, Vt: [s, s, s, s], zb: i };
  return e.topLineColor !== void 0 && (r.Re = e.topLineColor), e.bottomLineColor !== void 0 && (r.De = e.bottomLineColor), e.topFillColor1 !== void 0 && (r.ke = e.topFillColor1), e.topFillColor2 !== void 0 && (r.ye = e.topFillColor2), e.bottomFillColor1 !== void 0 && (r.Ce = e.bottomFillColor1), e.bottomFillColor2 !== void 0 && (r.Te = e.bottomFillColor2), r;
}
function eh(n, t, e, i) {
  const s = { ee: t, ot: n, Vt: [e.open, e.high, e.low, e.close], zb: i };
  return e.color !== void 0 && (s.V = e.color), s;
}
function ih(n, t, e, i) {
  const s = { ee: t, ot: n, Vt: [e.open, e.high, e.low, e.close], zb: i };
  return e.color !== void 0 && (s.V = e.color), e.borderColor !== void 0 && (s.Ot = e.borderColor), e.wickColor !== void 0 && (s.Xh = e.wickColor), s;
}
function sh(n, t, e, i, s) {
  const r = B(s)(e), h = Math.max(...r), o = Math.min(...r), l = r[r.length - 1], c = [l, h, o, l], a = e, { time: u, color: d } = a;
  return { ee: t, ot: n, Vt: c, zb: i, $e: ys(a, ["time", "color"]), V: d };
}
function qt(n) {
  return n.Vt !== void 0;
}
function Vi(n, t) {
  return t.customValues !== void 0 && (n.jb = t.customValues), n;
}
function dt(n) {
  return (t, e, i, s, r, h) => function(o, l) {
    return l ? l(o) : (c = o).open === void 0 && c.value === void 0;
    var c;
  }(i, h) ? Vi({ ot: t, ee: e, zb: s }, i) : Vi(n(t, e, i, s, r), i);
}
function Ri(n) {
  return { Candlestick: dt(ih), Bar: dt(eh), Area: dt(Zr), Baseline: dt(th), Histogram: dt($i), Line: dt($i), Custom: dt(sh) }[n];
}
function Oi(n) {
  return { ee: 0, Hb: /* @__PURE__ */ new Map(), la: n };
}
function Wi(n, t) {
  if (n !== void 0 && n.length !== 0) return { $b: t.key(n[0].ot), Ub: t.key(n[n.length - 1].ot) };
}
function Di(n) {
  let t;
  return n.forEach((e) => {
    t === void 0 && (t = e.zb);
  }), B(t);
}
class nh {
  constructor(t) {
    this.qb = /* @__PURE__ */ new Map(), this.Yb = /* @__PURE__ */ new Map(), this.Zb = /* @__PURE__ */ new Map(), this.Xb = [], this.q_ = t;
  }
  S() {
    this.qb.clear(), this.Yb.clear(), this.Zb.clear(), this.Xb = [];
  }
  Kb(t, e) {
    let i = this.qb.size !== 0, s = !1;
    const r = this.Yb.get(t);
    if (r !== void 0) if (this.Yb.size === 1) i = !1, s = !0, this.qb.clear();
    else for (const l of this.Xb) l.pointData.Hb.delete(t) && (s = !0);
    let h = [];
    if (e.length !== 0) {
      const l = e.map((p) => p.time), c = this.q_.createConverterToInternalObj(e), a = Ri(t.Qh()), u = t.Ca(), d = t.Ta();
      h = e.map((p, f) => {
        const v = c(p.time), g = this.q_.key(v);
        let y = this.qb.get(g);
        y === void 0 && (y = Oi(v), this.qb.set(g, y), s = !0);
        const x = a(v, y.ee, p, l[f], u, d);
        return y.Hb.set(t, x), x;
      });
    }
    i && this.Gb(), this.Jb(t, h);
    let o = -1;
    if (s) {
      const l = [];
      this.qb.forEach((c) => {
        l.push({ timeWeight: 0, time: c.la, pointData: c, originalTime: Di(c.Hb) });
      }), l.sort((c, a) => this.q_.key(c.time) - this.q_.key(a.time)), o = this.Qb(l);
    }
    return this.tw(t, o, function(l, c, a) {
      const u = Wi(l, a), d = Wi(c, a);
      if (u !== void 0 && d !== void 0) return { ta: u.Ub >= d.Ub && u.$b >= d.$b };
    }(this.Yb.get(t), r, this.q_));
  }
  vd(t) {
    return this.Kb(t, []);
  }
  iw(t, e) {
    const i = e;
    (function(v) {
      v.zb === void 0 && (v.zb = v.time);
    })(i), this.q_.preprocessData(e);
    const s = this.q_.createConverterToInternalObj([e])(e.time), r = this.Zb.get(t);
    if (r !== void 0 && this.q_.key(s) < this.q_.key(r)) throw new Error(`Cannot update oldest data, last time=${r}, new time=${s}`);
    let h = this.qb.get(this.q_.key(s));
    const o = h === void 0;
    h === void 0 && (h = Oi(s), this.qb.set(this.q_.key(s), h));
    const l = Ri(t.Qh()), c = t.Ca(), a = t.Ta(), u = l(s, h.ee, e, i.zb, c, a);
    h.Hb.set(t, u), this.nw(t, u);
    const d = { ta: qt(u) };
    if (!o) return this.tw(t, -1, d);
    const p = { timeWeight: 0, time: h.la, pointData: h, originalTime: Di(h.Hb) }, f = Dt(this.Xb, this.q_.key(p.time), (v, g) => this.q_.key(v.time) < g);
    this.Xb.splice(f, 0, p);
    for (let v = f; v < this.Xb.length; ++v) _e(this.Xb[v].pointData, v);
    return this.q_.fillWeightsForPoints(this.Xb, f), this.tw(t, f, d);
  }
  nw(t, e) {
    let i = this.Yb.get(t);
    i === void 0 && (i = [], this.Yb.set(t, i));
    const s = i.length !== 0 ? i[i.length - 1] : null;
    s === null || this.q_.key(e.ot) > this.q_.key(s.ot) ? qt(e) && i.push(e) : qt(e) ? i[i.length - 1] = e : i.splice(-1, 1), this.Zb.set(t, e.ot);
  }
  Jb(t, e) {
    e.length !== 0 ? (this.Yb.set(t, e.filter(qt)), this.Zb.set(t, e[e.length - 1].ot)) : (this.Yb.delete(t), this.Zb.delete(t));
  }
  Gb() {
    for (const t of this.Xb) t.pointData.Hb.size === 0 && this.qb.delete(this.q_.key(t.time));
  }
  Qb(t) {
    let e = -1;
    for (let i = 0; i < this.Xb.length && i < t.length; ++i) {
      const s = this.Xb[i], r = t[i];
      if (this.q_.key(s.time) !== this.q_.key(r.time)) {
        e = i;
        break;
      }
      r.timeWeight = s.timeWeight, _e(r.pointData, i);
    }
    if (e === -1 && this.Xb.length !== t.length && (e = Math.min(this.Xb.length, t.length)), e === -1) return -1;
    for (let i = e; i < t.length; ++i) _e(t[i].pointData, i);
    return this.q_.fillWeightsForPoints(t, e), this.Xb = t, e;
  }
  sw() {
    if (this.Yb.size === 0) return null;
    let t = 0;
    return this.Yb.forEach((e) => {
      e.length !== 0 && (t = Math.max(t, e[e.length - 1].ee));
    }), t;
  }
  tw(t, e, i) {
    const s = { ew: /* @__PURE__ */ new Map(), St: { Eu: this.sw() } };
    if (e !== -1) this.Yb.forEach((r, h) => {
      s.ew.set(h, { $e: r, rw: h === t ? i : void 0 });
    }), this.Yb.has(t) || s.ew.set(t, { $e: [], rw: i }), s.St.hw = this.Xb, s.St.lw = e;
    else {
      const r = this.Yb.get(t);
      s.ew.set(t, { $e: r || [], rw: i });
    }
    return s;
  }
}
function _e(n, t) {
  n.ee = t, n.Hb.forEach((e) => {
    e.ee = t;
  });
}
function Ae(n) {
  const t = { value: n.Vt[3], time: n.zb };
  return n.jb !== void 0 && (t.customValues = n.jb), t;
}
function Bi(n) {
  const t = Ae(n);
  return n.V !== void 0 && (t.color = n.V), t;
}
function rh(n) {
  const t = Ae(n);
  return n.lt !== void 0 && (t.lineColor = n.lt), n.Ps !== void 0 && (t.topColor = n.Ps), n.Rs !== void 0 && (t.bottomColor = n.Rs), t;
}
function hh(n) {
  const t = Ae(n);
  return n.Re !== void 0 && (t.topLineColor = n.Re), n.De !== void 0 && (t.bottomLineColor = n.De), n.ke !== void 0 && (t.topFillColor1 = n.ke), n.ye !== void 0 && (t.topFillColor2 = n.ye), n.Ce !== void 0 && (t.bottomFillColor1 = n.Ce), n.Te !== void 0 && (t.bottomFillColor2 = n.Te), t;
}
function Ss(n) {
  const t = { open: n.Vt[0], high: n.Vt[1], low: n.Vt[2], close: n.Vt[3], time: n.zb };
  return n.jb !== void 0 && (t.customValues = n.jb), t;
}
function oh(n) {
  const t = Ss(n);
  return n.V !== void 0 && (t.color = n.V), t;
}
function lh(n) {
  const t = Ss(n), { V: e, Ot: i, Xh: s } = n;
  return e !== void 0 && (t.color = e), i !== void 0 && (t.borderColor = i), s !== void 0 && (t.wickColor = s), t;
}
function Pe(n) {
  return { Area: rh, Line: Bi, Baseline: hh, Histogram: Bi, Bar: oh, Candlestick: lh, Custom: ch }[n];
}
function ch(n) {
  const t = n.zb;
  return Object.assign(Object.assign({}, n.$e), { time: t });
}
const ah = { vertLine: { color: "#9598A1", width: 1, style: 3, visible: !0, labelVisible: !0, labelBackgroundColor: "#131722" }, horzLine: { color: "#9598A1", width: 1, style: 3, visible: !0, labelVisible: !0, labelBackgroundColor: "#131722" }, mode: 1 }, uh = { vertLines: { color: "#D6DCDE", style: 0, visible: !0 }, horzLines: { color: "#D6DCDE", style: 0, visible: !0 } }, dh = { background: { type: "solid", color: "#FFFFFF" }, textColor: "#191919", fontSize: 12, fontFamily: $e, attributionLogo: !0 }, Ce = { autoScale: !0, mode: 0, invertScale: !1, alignLabels: !0, borderVisible: !0, borderColor: "#2B2B43", entireTextOnly: !1, visible: !1, ticksVisible: !1, scaleMargins: { bottom: 0.1, top: 0.2 }, minimumWidth: 0 }, fh = { rightOffset: 0, barSpacing: 6, minBarSpacing: 0.5, fixLeftEdge: !1, fixRightEdge: !1, lockVisibleTimeRangeOnResize: !1, rightBarStaysOnScroll: !1, borderVisible: !0, borderColor: "#2B2B43", visible: !0, timeVisible: !1, secondsVisible: !0, shiftVisibleRangeOnNewBar: !0, allowShiftVisibleRangeOnWhitespaceReplacement: !1, ticksVisible: !1, uniformDistribution: !1, minimumHeight: 0, allowBoldLabels: !0 }, mh = { color: "rgba(0, 0, 0, 0)", visible: !1, fontSize: 48, fontFamily: $e, fontStyle: "", text: "", horzAlign: "center", vertAlign: "center" };
function Ii() {
  return { width: 0, height: 0, autoSize: !1, layout: dh, crosshair: ah, grid: uh, overlayPriceScales: Object.assign({}, Ce), leftPriceScale: Object.assign(Object.assign({}, Ce), { visible: !1 }), rightPriceScale: Object.assign(Object.assign({}, Ce), { visible: !0 }), timeScale: fh, watermark: mh, localization: { locale: Ct ? navigator.language : "", dateFormat: "dd MMM 'yy" }, handleScroll: { mouseWheel: !0, pressedMouseMove: !0, horzTouchDrag: !0, vertTouchDrag: !0 }, handleScale: { axisPressedMouseMove: { time: !0, price: !0 }, axisDoubleClickReset: { time: !0, price: !0 }, mouseWheel: !0, pinch: !0 }, kineticScroll: { mouse: !1, touch: !0 }, trackingMode: { exitMode: 1 } };
}
class ph {
  constructor(t, e) {
    this.aw = t, this.ow = e;
  }
  applyOptions(t) {
    this.aw.$t().$c(this.ow, t);
  }
  options() {
    return this.Li().W();
  }
  width() {
    return ne(this.ow) ? this.aw.Mb(this.ow) : 0;
  }
  Li() {
    return w(this.aw.$t().Uc(this.ow)).Dt;
  }
}
function Fi(n, t, e) {
  const i = ys(n, ["time", "originalTime"]), s = Object.assign({ time: t }, i);
  return e !== void 0 && (s.originalTime = e), s;
}
const vh = { color: "#FF0000", price: 0, lineStyle: 2, lineWidth: 1, lineVisible: !0, axisLabelVisible: !0, title: "", axisLabelColor: "", axisLabelTextColor: "" };
class gh {
  constructor(t) {
    this.Nh = t;
  }
  applyOptions(t) {
    this.Nh.$h(t);
  }
  options() {
    return this.Nh.W();
  }
  _w() {
    return this.Nh;
  }
}
class bh {
  constructor(t, e, i, s, r) {
    this.uw = new V(), this.Es = t, this.cw = e, this.dw = i, this.q_ = r, this.fw = s;
  }
  S() {
    this.uw.S();
  }
  priceFormatter() {
    return this.Es.ba();
  }
  priceToCoordinate(t) {
    const e = this.Es.Ct();
    return e === null ? null : this.Es.Dt().Rt(t, e.Vt);
  }
  coordinateToPrice(t) {
    const e = this.Es.Ct();
    return e === null ? null : this.Es.Dt().pn(t, e.Vt);
  }
  barsInLogicalRange(t) {
    if (t === null) return null;
    const e = new Mt(new Tt(t.from, t.to)).lu(), i = this.Es.In();
    if (i.Ni()) return null;
    const s = i.ll(e.Os(), 1), r = i.ll(e.ui(), -1), h = w(i.el()), o = w(i.An());
    if (s !== null && r !== null && s.ee > r.ee) return { barsBefore: t.from - h, barsAfter: o - t.to };
    const l = { barsBefore: s === null || s.ee === h ? t.from - h : s.ee - h, barsAfter: r === null || r.ee === o ? o - t.to : o - r.ee };
    return s !== null && r !== null && (l.from = s.zb, l.to = r.zb), l;
  }
  setData(t) {
    this.q_, this.Es.Qh(), this.cw.pw(this.Es, t), this.mw("full");
  }
  update(t) {
    this.Es.Qh(), this.cw.bw(this.Es, t), this.mw("update");
  }
  dataByIndex(t, e) {
    const i = this.Es.In().ll(t, e);
    return i === null ? null : Pe(this.seriesType())(i);
  }
  data() {
    const t = Pe(this.seriesType());
    return this.Es.In().ne().map((e) => t(e));
  }
  subscribeDataChanged(t) {
    this.uw.l(t);
  }
  unsubscribeDataChanged(t) {
    this.uw.v(t);
  }
  setMarkers(t) {
    this.q_;
    const e = t.map((i) => Fi(i, this.q_.convertHorzItemToInternal(i.time), i.time));
    this.Es.na(e);
  }
  markers() {
    return this.Es.sa().map((t) => Fi(t, t.originalTime, void 0));
  }
  applyOptions(t) {
    this.Es.$h(t);
  }
  options() {
    return tt(this.Es.W());
  }
  priceScale() {
    return this.dw.priceScale(this.Es.Dt().Pa());
  }
  createPriceLine(t) {
    const e = U(tt(vh), t), i = this.Es.ea(e);
    return new gh(i);
  }
  removePriceLine(t) {
    this.Es.ra(t._w());
  }
  seriesType() {
    return this.Es.Qh();
  }
  attachPrimitive(t) {
    this.Es.ka(t), t.attached && t.attached({ chart: this.fw, series: this, requestUpdate: () => this.Es.$t().Kl() });
  }
  detachPrimitive(t) {
    this.Es.ya(t), t.detached && t.detached();
  }
  mw(t) {
    this.uw.M() && this.uw.m(t);
  }
}
class wh {
  constructor(t, e, i) {
    this.ww = new V(), this.mu = new V(), this.Om = new V(), this.$i = t, this.yl = t.St(), this.ab = e, this.yl.nc().l(this.gw.bind(this)), this.yl.sc().l(this.Mw.bind(this)), this.ab.Nm().l(this.xw.bind(this)), this.q_ = i;
  }
  S() {
    this.yl.nc().p(this), this.yl.sc().p(this), this.ab.Nm().p(this), this.ww.S(), this.mu.S(), this.Om.S();
  }
  scrollPosition() {
    return this.yl.Hu();
  }
  scrollToPosition(t, e) {
    e ? this.yl.Ju(t, 1e3) : this.$i.Jn(t);
  }
  scrollToRealTime() {
    this.yl.Gu();
  }
  getVisibleRange() {
    const t = this.yl.Vu();
    return t === null ? null : { from: t.from.originalTime, to: t.to.originalTime };
  }
  setVisibleRange(t) {
    const e = { from: this.q_.convertHorzItemToInternal(t.from), to: this.q_.convertHorzItemToInternal(t.to) }, i = this.yl.Iu(e);
    this.$i.pd(i);
  }
  getVisibleLogicalRange() {
    const t = this.yl.Du();
    return t === null ? null : { from: t.Os(), to: t.ui() };
  }
  setVisibleLogicalRange(t) {
    ct(t.from <= t.to, "The from index cannot be after the to index."), this.$i.pd(t);
  }
  resetTimeScale() {
    this.$i.Kn();
  }
  fitContent() {
    this.$i.hc();
  }
  logicalToCoordinate(t) {
    const e = this.$i.St();
    return e.Ni() ? null : e.It(t);
  }
  coordinateToLogical(t) {
    return this.yl.Ni() ? null : this.yl.Nu(t);
  }
  timeToCoordinate(t) {
    const e = this.q_.convertHorzItemToInternal(t), i = this.yl.Va(e, !1);
    return i === null ? null : this.yl.It(i);
  }
  coordinateToTime(t) {
    const e = this.$i.St(), i = e.Nu(t), s = e.Ui(i);
    return s === null ? null : s.originalTime;
  }
  width() {
    return this.ab.um().width;
  }
  height() {
    return this.ab.um().height;
  }
  subscribeVisibleTimeRangeChange(t) {
    this.ww.l(t);
  }
  unsubscribeVisibleTimeRangeChange(t) {
    this.ww.v(t);
  }
  subscribeVisibleLogicalRangeChange(t) {
    this.mu.l(t);
  }
  unsubscribeVisibleLogicalRangeChange(t) {
    this.mu.v(t);
  }
  subscribeSizeChange(t) {
    this.Om.l(t);
  }
  unsubscribeSizeChange(t) {
    this.Om.v(t);
  }
  applyOptions(t) {
    this.yl.$h(t);
  }
  options() {
    return Object.assign(Object.assign({}, tt(this.yl.W())), { barSpacing: this.yl.le() });
  }
  gw() {
    this.ww.M() && this.ww.m(this.getVisibleRange());
  }
  Mw() {
    this.mu.M() && this.mu.m(this.getVisibleLogicalRange());
  }
  xw(t) {
    this.Om.m(t.width, t.height);
  }
}
function xh(n) {
  if (n === void 0 || n.type === "custom") return;
  const t = n;
  t.minMove !== void 0 && t.precision === void 0 && (t.precision = function(e) {
    if (e >= 1) return 0;
    let i = 0;
    for (; i < 8; i++) {
      const s = Math.round(e);
      if (Math.abs(s - e) < 1e-8) return i;
      e *= 10;
    }
    return i;
  }(t.minMove));
}
function ji(n) {
  return function(t) {
    if (Bt(t.handleScale)) {
      const i = t.handleScale;
      t.handleScale = { axisDoubleClickReset: { time: i, price: i }, axisPressedMouseMove: { time: i, price: i }, mouseWheel: i, pinch: i };
    } else if (t.handleScale !== void 0) {
      const { axisPressedMouseMove: i, axisDoubleClickReset: s } = t.handleScale;
      Bt(i) && (t.handleScale.axisPressedMouseMove = { time: i, price: i }), Bt(s) && (t.handleScale.axisDoubleClickReset = { time: s, price: s });
    }
    const e = t.handleScroll;
    Bt(e) && (t.handleScroll = { horzTouchDrag: e, vertTouchDrag: e, mouseWheel: e, pressedMouseMove: e });
  }(n), n;
}
class yh {
  constructor(t, e, i) {
    this.Sw = /* @__PURE__ */ new Map(), this.kw = /* @__PURE__ */ new Map(), this.yw = new V(), this.Cw = new V(), this.Tw = new V(), this.Pw = new nh(e);
    const s = i === void 0 ? tt(Ii()) : U(tt(Ii()), ji(i));
    this.q_ = e, this.aw = new Qr(t, s, e), this.aw.lm().l((h) => {
      this.yw.M() && this.yw.m(this.Rw(h()));
    }, this), this.aw.am().l((h) => {
      this.Cw.M() && this.Cw.m(this.Rw(h()));
    }, this), this.aw.Xc().l((h) => {
      this.Tw.M() && this.Tw.m(this.Rw(h()));
    }, this);
    const r = this.aw.$t();
    this.Dw = new wh(r, this.aw.fb(), this.q_);
  }
  remove() {
    this.aw.lm().p(this), this.aw.am().p(this), this.aw.Xc().p(this), this.Dw.S(), this.aw.S(), this.Sw.clear(), this.kw.clear(), this.yw.S(), this.Cw.S(), this.Tw.S(), this.Pw.S();
  }
  resize(t, e, i) {
    this.autoSizeActive() || this.aw._b(t, e, i);
  }
  addCustomSeries(t, e) {
    const i = yt(t), s = Object.assign(Object.assign({}, Qi), i.defaultOptions());
    return this.Vw("Custom", s, e, i);
  }
  addAreaSeries(t) {
    return this.Vw("Area", nn, t);
  }
  addBaselineSeries(t) {
    return this.Vw("Baseline", rn, t);
  }
  addBarSeries(t) {
    return this.Vw("Bar", en, t);
  }
  addCandlestickSeries(t = {}) {
    return function(e) {
      e.borderColor !== void 0 && (e.borderUpColor = e.borderColor, e.borderDownColor = e.borderColor), e.wickColor !== void 0 && (e.wickUpColor = e.wickColor, e.wickDownColor = e.wickColor);
    }(t), this.Vw("Candlestick", tn, t);
  }
  addHistogramSeries(t) {
    return this.Vw("Histogram", hn, t);
  }
  addLineSeries(t) {
    return this.Vw("Line", sn, t);
  }
  removeSeries(t) {
    const e = B(this.Sw.get(t)), i = this.Pw.vd(e);
    this.aw.$t().vd(e), this.Ow(i), this.Sw.delete(t), this.kw.delete(e);
  }
  pw(t, e) {
    this.Ow(this.Pw.Kb(t, e));
  }
  bw(t, e) {
    this.Ow(this.Pw.iw(t, e));
  }
  subscribeClick(t) {
    this.yw.l(t);
  }
  unsubscribeClick(t) {
    this.yw.v(t);
  }
  subscribeCrosshairMove(t) {
    this.Tw.l(t);
  }
  unsubscribeCrosshairMove(t) {
    this.Tw.v(t);
  }
  subscribeDblClick(t) {
    this.Cw.l(t);
  }
  unsubscribeDblClick(t) {
    this.Cw.v(t);
  }
  priceScale(t) {
    return new ph(this.aw, t);
  }
  timeScale() {
    return this.Dw;
  }
  applyOptions(t) {
    this.aw.$h(ji(t));
  }
  options() {
    return this.aw.W();
  }
  takeScreenshot() {
    return this.aw.wb();
  }
  autoSizeActive() {
    return this.aw.kb();
  }
  chartElement() {
    return this.aw.yb();
  }
  paneSize() {
    const t = this.aw.Tb();
    return { height: t.height, width: t.width };
  }
  setCrosshairPosition(t, e, i) {
    const s = this.Sw.get(i);
    if (s === void 0) return;
    const r = this.aw.$t().dr(s);
    r !== null && this.aw.$t().ad(t, e, r);
  }
  clearCrosshairPosition() {
    this.aw.$t().od(!0);
  }
  Vw(t, e, i = {}, s) {
    xh(i.priceFormat);
    const r = U(tt(Yi), tt(e), i), h = this.aw.$t().dd(t, r, s), o = new bh(h, this, this, this, this.q_);
    return this.Sw.set(o, h), this.kw.set(h, o), o;
  }
  Ow(t) {
    const e = this.aw.$t();
    e._d(t.St.Eu, t.St.hw, t.St.lw), t.ew.forEach((i, s) => s.J(i.$e, i.rw)), e.Wu();
  }
  Bw(t) {
    return B(this.kw.get(t));
  }
  Rw(t) {
    const e = /* @__PURE__ */ new Map();
    t.Nb.forEach((s, r) => {
      const h = r.Qh(), o = Pe(h)(s);
      if (h !== "Custom") ct(Yr(o));
      else {
        const l = r.Ta();
        ct(!l || l(o) === !1);
      }
      e.set(this.Bw(r), o);
    });
    const i = t.Eb !== void 0 && this.kw.has(t.Eb) ? this.Bw(t.Eb) : void 0;
    return { time: t.zb, logical: t.ee, point: t.Lb, hoveredSeries: i, hoveredObjectId: t.Fb, seriesData: e, sourceEvent: t.Wb };
  }
}
function Sh(n, t, e) {
  let i;
  if (Wt(n)) {
    const r = document.getElementById(n);
    ct(r !== null, `Cannot find element in DOM with id=${n}`), i = r;
  } else i = n;
  const s = new yh(i, t, e);
  return t.setOptions(s.options()), s;
}
function Mh(n, t) {
  return Sh(n, new zi(), zi.Id(t));
}
Object.assign(Object.assign({}, Yi), Qi);
function _h({ data: n = [], theme: t = "dark", className: e = "" }) {
  const i = lt(null), s = lt(null), r = lt(null), h = t === "dark";
  return X(() => {
    if (!i.current) return;
    const o = Mh(i.current, {
      layout: {
        background: { type: ze.Solid, color: h ? "#0a0e14" : "#ffffff" },
        textColor: h ? "#9ca3af" : "#374151"
      },
      grid: {
        vertLines: { color: h ? "#1f2937" : "#e5e7eb" },
        horzLines: { color: h ? "#1f2937" : "#e5e7eb" }
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: h ? "#374151" : "#d1d5db" },
      timeScale: { borderColor: h ? "#374151" : "#d1d5db", timeVisible: !0 }
    }), l = o.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderDownColor: "#ef4444",
      borderUpColor: "#22c55e",
      wickDownColor: "#ef4444",
      wickUpColor: "#22c55e"
    });
    s.current = o, r.current = l;
    const c = new ResizeObserver((a) => {
      const { width: u, height: d } = a[0].contentRect;
      o.applyOptions({ width: u, height: d });
    });
    return c.observe(i.current), () => {
      c.disconnect(), o.remove();
    };
  }, [h]), X(() => {
    r.current && n.length > 0 && r.current.setData(n);
  }, [n]), /* @__PURE__ */ m("div", { ref: i, className: `ct-w-full ct-h-full ct-min-h-[400px] ${e}` });
}
function Ch({ chartType: n, symbol: t, theme: e = "dark", chartData: i, className: s = "" }) {
  return /* @__PURE__ */ m("div", { className: `ct-relative ct-w-full ct-h-full ${s}`, children: n === "tradingview" ? /* @__PURE__ */ m(Hs, { symbol: t, theme: e }) : /* @__PURE__ */ m(_h, { data: i, theme: e }) });
}
const Nh = {
  priceTargets: [{ price: "", percentage: "" }],
  targetsEnabled: !1,
  profitProtection: { enabled: !1, dropPercent: "10", activateAbove: "" },
  stopLoss: { enabled: !1, triggerPrice: "" },
  trailingStop: { enabled: !1, trailPercent: "10" }
};
function zh({ state: n, onChange: t, className: e = "" }) {
  const i = (s) => t({ ...n, ...s });
  return /* @__PURE__ */ b("div", { className: `ct-space-y-3 ${e}`, children: [
    /* @__PURE__ */ m(
      Jt,
      {
        enabled: n.targetsEnabled,
        onToggle: (s) => i({ targetsEnabled: s }),
        icon: "🎯",
        label: "Price Targets",
        color: "blue",
        description: "Set multiple price targets to auto-sell portions",
        children: /* @__PURE__ */ b("div", { className: "ct-space-y-2", children: [
          n.priceTargets.map((s, r) => /* @__PURE__ */ b("div", { className: "ct-flex ct-items-center ct-gap-2", children: [
            /* @__PURE__ */ m(
              "input",
              {
                type: "number",
                value: s.price,
                placeholder: "Price",
                onChange: (h) => {
                  const o = [...n.priceTargets];
                  o[r] = { ...o[r], price: h.target.value }, i({ priceTargets: o });
                },
                className: "ct-flex-1 ct-px-2 ct-py-1.5 ct-text-sm ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-rounded ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
              }
            ),
            /* @__PURE__ */ m(
              "input",
              {
                type: "number",
                value: s.percentage,
                placeholder: "%",
                onChange: (h) => {
                  const o = [...n.priceTargets];
                  o[r] = { ...o[r], percentage: h.target.value }, i({ priceTargets: o });
                },
                className: "ct-w-20 ct-px-2 ct-py-1.5 ct-text-sm ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-rounded ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
              }
            ),
            n.priceTargets.length > 1 && /* @__PURE__ */ m(
              "button",
              {
                onClick: () => i({ priceTargets: n.priceTargets.filter((h, o) => o !== r) }),
                className: "ct-text-red-400 hover:ct-text-red-300 ct-text-sm",
                children: "×"
              }
            )
          ] }, r)),
          /* @__PURE__ */ m(
            "button",
            {
              onClick: () => i({ priceTargets: [...n.priceTargets, { price: "", percentage: "" }] }),
              className: "ct-text-xs ct-text-blue-400 hover:ct-text-blue-300",
              children: "+ Add Target"
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ m(
      Jt,
      {
        enabled: n.profitProtection.enabled,
        onToggle: (s) => i({ profitProtection: { ...n.profitProtection, enabled: s } }),
        icon: "🛡️",
        label: "Profit Protection",
        color: "green",
        description: "Auto-sell if price drops from peak",
        children: /* @__PURE__ */ b("div", { className: "ct-space-y-2", children: [
          /* @__PURE__ */ b("div", { className: "ct-flex ct-items-center ct-gap-2", children: [
            /* @__PURE__ */ m(
              "input",
              {
                type: "number",
                value: n.profitProtection.dropPercent,
                placeholder: "Drop %",
                onChange: (s) => i({ profitProtection: { ...n.profitProtection, dropPercent: s.target.value } }),
                className: "ct-flex-1 ct-px-2 ct-py-1.5 ct-text-sm ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-rounded ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
              }
            ),
            /* @__PURE__ */ m("span", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "% from peak" })
          ] }),
          /* @__PURE__ */ b("div", { className: "ct-flex ct-items-center ct-gap-2", children: [
            /* @__PURE__ */ m(
              "input",
              {
                type: "number",
                value: n.profitProtection.activateAbove,
                placeholder: "Activate above",
                onChange: (s) => i({ profitProtection: { ...n.profitProtection, activateAbove: s.target.value } }),
                className: "ct-flex-1 ct-px-2 ct-py-1.5 ct-text-sm ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-rounded ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
              }
            ),
            /* @__PURE__ */ m("span", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "price" })
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ m(
      Jt,
      {
        enabled: n.stopLoss.enabled,
        onToggle: (s) => i({ stopLoss: { ...n.stopLoss, enabled: s } }),
        icon: "🛑",
        label: "Stop Loss",
        color: "red",
        description: "Auto-sell if price drops below threshold",
        children: /* @__PURE__ */ b("div", { className: "ct-flex ct-items-center ct-gap-2", children: [
          /* @__PURE__ */ m(
            "input",
            {
              type: "number",
              value: n.stopLoss.triggerPrice,
              placeholder: "Stop price",
              onChange: (s) => i({ stopLoss: { ...n.stopLoss, triggerPrice: s.target.value } }),
              className: "ct-flex-1 ct-px-2 ct-py-1.5 ct-text-sm ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-rounded ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
            }
          ),
          /* @__PURE__ */ m("span", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "trigger" })
        ] })
      }
    ),
    /* @__PURE__ */ m(
      Jt,
      {
        enabled: n.trailingStop.enabled,
        onToggle: (s) => i({ trailingStop: { ...n.trailingStop, enabled: s } }),
        icon: "📉",
        label: "Trailing Stop",
        color: "orange",
        description: "Stop-loss that follows price upward",
        children: /* @__PURE__ */ b("div", { className: "ct-flex ct-items-center ct-gap-2", children: [
          /* @__PURE__ */ m(
            "input",
            {
              type: "number",
              value: n.trailingStop.trailPercent,
              placeholder: "Trail %",
              onChange: (s) => i({ trailingStop: { ...n.trailingStop, trailPercent: s.target.value } }),
              className: "ct-flex-1 ct-px-2 ct-py-1.5 ct-text-sm ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-rounded ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
            }
          ),
          /* @__PURE__ */ m("span", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "% below peak" })
        ] })
      }
    )
  ] });
}
function Jt({ enabled: n, onToggle: t, icon: e, label: i, color: s, description: r, children: h }) {
  const o = n ? `ct-border-${s}-500/50` : "ct-border-[hsl(var(--cedros-border))]", l = n ? `ct-bg-${s}-500/5` : "";
  return /* @__PURE__ */ b(
    "div",
    {
      className: `ct-border ct-rounded-cedros ct-p-3 ct-cursor-pointer ct-transition-all ${o} ${l}`,
      onClick: (c) => {
        c.target.closest(".ct-card-body") || t(!n);
      },
      children: [
        /* @__PURE__ */ b("div", { className: "ct-flex ct-items-center ct-gap-2 ct-mb-1", children: [
          /* @__PURE__ */ m(
            "input",
            {
              type: "checkbox",
              checked: n,
              onChange: (c) => {
                c.stopPropagation(), t(c.target.checked);
              },
              className: "ct-w-4 ct-h-4 ct-rounded"
            }
          ),
          /* @__PURE__ */ m("span", { className: "ct-text-base", children: e }),
          /* @__PURE__ */ m("span", { className: "ct-text-sm ct-font-medium ct-text-[hsl(var(--cedros-foreground))]", children: i })
        ] }),
        n && /* @__PURE__ */ b("div", { className: "ct-card-body ct-mt-2 ct-space-y-2", onClick: (c) => c.stopPropagation(), children: [
          /* @__PURE__ */ m("p", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: r }),
          h
        ] })
      ]
    }
  );
}
function Ki({
  walletAddress: n,
  inputMint: t,
  outputMint: e,
  inputSymbol: i = "",
  outputSymbol: s = "",
  currentPrice: r,
  onSign: h,
  onSuccess: o,
  className: l = ""
}) {
  const { isLoading: c, error: a, createLimit: u, createStopLoss: d, createTakeProfit: p, createDca: f } = Bs(), v = it(), [g, y] = M("limit"), [x, _] = M("buy"), [S, E] = M(""), [z, T] = M(""), [N, W] = M(100), [R, J] = M("10"), [$, j] = M("86400"), [G, st] = M("10"), [K, wt] = M(""), [k, H] = M(""), [nt, Nt] = M("10"), [Xe, _s] = M("30"), [Cs, Ns] = M(Nh), [zs, at] = M(null), Es = [
    { id: "limit", label: "Limit" },
    { id: "stop-loss", label: "Stop Loss" },
    { id: "take-profit", label: "Take Profit" },
    { id: "trailing-stop", label: "Trailing" },
    { id: "oco", label: "OCO" },
    { id: "bracket", label: "Bracket" },
    { id: "dca", label: "DCA" },
    { id: "auto", label: "Auto" }
  ], rt = x === "buy" ? e : t, ht = x === "buy" ? t : e, ks = C(async () => {
    var L, He, Ue;
    if (!(!n || !h || !S)) {
      at(null);
      try {
        let Z;
        const ut = n;
        if (g === "limit") {
          if (!z) {
            at("Enter a price");
            return;
          }
          const F = Math.round(parseFloat(S) * Math.pow(10, 9)).toString(), Ls = Math.round(parseFloat(S) * parseFloat(z) * Math.pow(10, 6)).toString();
          Z = await u({ maker: ut, inputMint: rt, outputMint: ht, inAmount: F, outAmount: Ls });
        } else if (g === "stop-loss") {
          if (!z) {
            at("Enter a trigger price");
            return;
          }
          const D = Math.round(parseFloat(S) * Math.pow(10, 9)).toString();
          Z = await d({ maker: ut, inputMint: rt, outputMint: ht, inAmount: D, triggerPrice: z, slippageBps: N });
        } else if (g === "take-profit") {
          if (!z) {
            at("Enter a trigger price");
            return;
          }
          const D = Math.round(parseFloat(S) * Math.pow(10, 9)).toString();
          Z = await p({ maker: ut, inputMint: rt, outputMint: ht, inAmount: D, triggerPrice: z, slippageBps: N });
        } else if (g === "trailing-stop") {
          const D = await fetch(`${v.baseUrl}/orders/trailing-stop`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ maker: ut, inputMint: rt, outputMint: ht, inAmount: Math.round(parseFloat(S) * 1e9).toString(), trailPercent: parseFloat(G), slippageBps: N, walletId: "" })
          }), F = await D.json();
          if (!D.ok) throw new Error(((L = F.error) == null ? void 0 : L.message) ?? "Failed");
          o == null || o(F.orderId), E("");
          return;
        } else if (g === "oco") {
          if (!K || !k) {
            at("Enter both stop-loss and take-profit prices");
            return;
          }
          const D = await fetch(`${v.baseUrl}/orders/oco`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ maker: ut, inputMint: rt, outputMint: ht, inAmount: Math.round(parseFloat(S) * 1e9).toString(), stopLoss: { triggerPrice: K, slippageBps: N }, takeProfit: { triggerPrice: k, slippageBps: 50 } })
          }), F = await D.json();
          if (!D.ok) throw new Error(((He = F.error) == null ? void 0 : He.message) ?? "Failed");
          o == null || o(F.ocoId), E("");
          return;
        } else if (g === "bracket") {
          const D = await fetch(`${v.baseUrl}/orders/bracket`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ maker: ut, walletId: "", inputMint: rt, outputMint: ht, inAmount: Math.round(parseFloat(S) * 1e9).toString(), stopLossPercent: parseFloat(nt), takeProfitPercent: parseFloat(Xe), trailingStop: !1 })
          }), F = await D.json();
          if (!D.ok) throw new Error(((Ue = F.error) == null ? void 0 : Ue.message) ?? "Failed");
          Z = { transaction: F.entryTransaction, orderId: F.bracketId };
        } else {
          const D = Math.round(parseFloat(S) * Math.pow(10, 6)).toString(), F = Math.round(parseFloat(S) / parseInt(R) * Math.pow(10, 6)).toString();
          Z = await f({ maker: ut, inputMint: rt, outputMint: ht, totalInAmount: D, perCycleAmount: F, cycleInterval: parseInt($) });
        }
        await h(Z.transaction), o == null || o(Z.orderId), E(""), T("");
      } catch (Z) {
        at(Z.message);
      }
    }
  }, [n, h, S, z, g, x, N, rt, ht, R, $, u, d, p, f, o]);
  return /* @__PURE__ */ b("div", { className: `ct-bg-[hsl(var(--cedros-background))] ct-border ct-border-[hsl(var(--cedros-border))] ct-rounded-cedros ct-p-4 ct-space-y-3 ${l}`, children: [
    /* @__PURE__ */ b("div", { className: "ct-flex ct-gap-1 ct-p-1 ct-bg-[hsl(var(--cedros-muted))] ct-rounded-cedros", children: [
      /* @__PURE__ */ m(
        "button",
        {
          onClick: () => _("buy"),
          className: `ct-flex-1 ct-py-2 ct-rounded ct-text-sm ct-font-medium ct-transition ${x === "buy" ? "ct-bg-green-500 ct-text-white" : "ct-text-[hsl(var(--cedros-muted-foreground))]"}`,
          children: "Buy"
        }
      ),
      /* @__PURE__ */ m(
        "button",
        {
          onClick: () => _("sell"),
          className: `ct-flex-1 ct-py-2 ct-rounded ct-text-sm ct-font-medium ct-transition ${x === "sell" ? "ct-bg-red-500 ct-text-white" : "ct-text-[hsl(var(--cedros-muted-foreground))]"}`,
          children: "Sell"
        }
      )
    ] }),
    /* @__PURE__ */ m("div", { className: "ct-flex ct-gap-1 ct-overflow-x-auto", children: Es.map((L) => /* @__PURE__ */ m(
      "button",
      {
        onClick: () => y(L.id),
        className: `ct-px-3 ct-py-1.5 ct-rounded ct-text-xs ct-font-medium ct-whitespace-nowrap ct-transition ${g === L.id ? "ct-bg-[hsl(var(--cedros-primary))] ct-text-[hsl(var(--cedros-primary-foreground))]" : "ct-text-[hsl(var(--cedros-muted-foreground))] hover:ct-bg-[hsl(var(--cedros-muted))]"}`,
        children: L.label
      },
      L.id
    )) }),
    g !== "dca" && /* @__PURE__ */ b("div", { className: "ct-space-y-1", children: [
      /* @__PURE__ */ m("label", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: g === "limit" ? "Limit Price" : "Trigger Price" }),
      /* @__PURE__ */ m(
        "input",
        {
          type: "text",
          value: z,
          onChange: (L) => T(L.target.value),
          placeholder: r ? r.toFixed(2) : "0.00",
          className: "ct-w-full ct-px-3 ct-py-2 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] ct-outline-none focus:ct-ring-2 focus:ct-ring-[hsl(var(--cedros-ring))]"
        }
      )
    ] }),
    /* @__PURE__ */ b("div", { className: "ct-space-y-1", children: [
      /* @__PURE__ */ m("label", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Amount" }),
      /* @__PURE__ */ m(
        "input",
        {
          type: "text",
          value: S,
          onChange: (L) => E(L.target.value),
          placeholder: "0.00",
          className: "ct-w-full ct-px-3 ct-py-2 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] ct-outline-none focus:ct-ring-2 focus:ct-ring-[hsl(var(--cedros-ring))]"
        }
      ),
      /* @__PURE__ */ m("div", { className: "ct-flex ct-gap-1", children: [25, 50, 75, 100].map((L) => /* @__PURE__ */ b("button", { className: "ct-flex-1 ct-py-1 ct-text-xs ct-rounded ct-bg-[hsl(var(--cedros-muted))] ct-text-[hsl(var(--cedros-muted-foreground))] hover:ct-bg-[hsl(var(--cedros-border))]", children: [
        L,
        "%"
      ] }, L)) })
    ] }),
    g === "dca" && /* @__PURE__ */ b("div", { className: "ct-grid ct-grid-cols-2 ct-gap-2", children: [
      /* @__PURE__ */ b("div", { className: "ct-space-y-1", children: [
        /* @__PURE__ */ m("label", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Cycles" }),
        /* @__PURE__ */ m(
          "input",
          {
            type: "text",
            value: R,
            onChange: (L) => J(L.target.value),
            className: "ct-w-full ct-px-3 ct-py-2 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
          }
        )
      ] }),
      /* @__PURE__ */ b("div", { className: "ct-space-y-1", children: [
        /* @__PURE__ */ m("label", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Interval" }),
        /* @__PURE__ */ b(
          "select",
          {
            value: $,
            onChange: (L) => j(L.target.value),
            className: "ct-w-full ct-px-3 ct-py-2 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))]",
            children: [
              /* @__PURE__ */ m("option", { value: "3600", children: "Hourly" }),
              /* @__PURE__ */ m("option", { value: "86400", children: "Daily" }),
              /* @__PURE__ */ m("option", { value: "604800", children: "Weekly" })
            ]
          }
        )
      ] })
    ] }),
    g === "trailing-stop" && /* @__PURE__ */ b("div", { className: "ct-space-y-1", children: [
      /* @__PURE__ */ m("label", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Trail Percentage" }),
      /* @__PURE__ */ b("div", { className: "ct-flex ct-items-center ct-gap-2", children: [
        /* @__PURE__ */ m(
          "input",
          {
            type: "number",
            value: G,
            onChange: (L) => st(L.target.value),
            placeholder: "10",
            className: "ct-flex-1 ct-px-3 ct-py-2 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
          }
        ),
        /* @__PURE__ */ m("span", { className: "ct-text-sm ct-text-[hsl(var(--cedros-muted-foreground))]", children: "% below peak" })
      ] })
    ] }),
    g === "oco" && /* @__PURE__ */ b("div", { className: "ct-grid ct-grid-cols-2 ct-gap-2", children: [
      /* @__PURE__ */ b("div", { className: "ct-space-y-1", children: [
        /* @__PURE__ */ m("label", { className: "ct-text-xs ct-text-red-400", children: "Stop Loss Price" }),
        /* @__PURE__ */ m(
          "input",
          {
            type: "number",
            value: K,
            onChange: (L) => wt(L.target.value),
            placeholder: "130.00",
            className: "ct-w-full ct-px-3 ct-py-2 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-red-500/30 ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
          }
        )
      ] }),
      /* @__PURE__ */ b("div", { className: "ct-space-y-1", children: [
        /* @__PURE__ */ m("label", { className: "ct-text-xs ct-text-green-400", children: "Take Profit Price" }),
        /* @__PURE__ */ m(
          "input",
          {
            type: "number",
            value: k,
            onChange: (L) => H(L.target.value),
            placeholder: "200.00",
            className: "ct-w-full ct-px-3 ct-py-2 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-green-500/30 ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
          }
        )
      ] })
    ] }),
    g === "bracket" && /* @__PURE__ */ b("div", { className: "ct-grid ct-grid-cols-2 ct-gap-2", children: [
      /* @__PURE__ */ b("div", { className: "ct-space-y-1", children: [
        /* @__PURE__ */ m("label", { className: "ct-text-xs ct-text-red-400", children: "Stop Loss %" }),
        /* @__PURE__ */ m(
          "input",
          {
            type: "number",
            value: nt,
            onChange: (L) => Nt(L.target.value),
            placeholder: "10",
            className: "ct-w-full ct-px-3 ct-py-2 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-red-500/30 ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
          }
        )
      ] }),
      /* @__PURE__ */ b("div", { className: "ct-space-y-1", children: [
        /* @__PURE__ */ m("label", { className: "ct-text-xs ct-text-green-400", children: "Take Profit %" }),
        /* @__PURE__ */ m(
          "input",
          {
            type: "number",
            value: Xe,
            onChange: (L) => _s(L.target.value),
            placeholder: "30",
            className: "ct-w-full ct-px-3 ct-py-2 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-green-500/30 ct-text-[hsl(var(--cedros-foreground))] ct-outline-none"
          }
        )
      ] })
    ] }),
    g === "auto" && /* @__PURE__ */ m(zh, { state: Cs, onChange: Ns }),
    (g === "stop-loss" || g === "take-profit" || g === "trailing-stop") && /* @__PURE__ */ m(Gi, { value: N, onChange: W }),
    /* @__PURE__ */ m(te, { message: zs || a, onDismiss: () => at(null) }),
    /* @__PURE__ */ m(
      "button",
      {
        onClick: ks,
        disabled: !n || !S || c,
        className: `ct-w-full ct-py-3 ct-rounded-cedros ct-font-semibold ct-text-white ct-transition disabled:ct-opacity-50 disabled:ct-cursor-not-allowed ${x === "buy" ? "ct-bg-green-500 hover:ct-bg-green-600" : "ct-bg-red-500 hover:ct-bg-red-600"}`,
        children: c ? /* @__PURE__ */ m(bt, {}) : `${x === "buy" ? "Buy" : "Sell"} ${i}`
      }
    )
  ] });
}
function Eh({
  marketAddress: n,
  tickSize: t = 0.01,
  maxLevels: e = 15,
  onPriceClick: i,
  className: s = ""
}) {
  const { data: r, isLoading: h, isStreaming: o } = Is(n), l = Qt(() => {
    if (!r) return { bids: [], asks: [], maxTotal: 1, spread: 0 };
    const c = (p, f) => {
      const v = /* @__PURE__ */ new Map();
      for (const y of p) {
        const x = f ? Math.ceil(y.price / t) * t : Math.floor(y.price / t) * t, _ = v.get(x);
        _ ? (_.size += y.size, _.total += y.total) : v.set(x, { price: x, size: y.size, total: y.total });
      }
      const g = Array.from(v.values());
      return g.sort((y, x) => f ? y.price - x.price : x.price - y.price), g.slice(0, e);
    }, a = c(r.bids, !1), u = c(r.asks, !0), d = Math.max(
      ...a.map((p) => p.total),
      ...u.map((p) => p.total),
      1
    );
    return { bids: a, asks: u, maxTotal: d, spread: r.spread };
  }, [r, t, e]);
  return h ? /* @__PURE__ */ m("div", { className: "ct-flex ct-justify-center ct-py-8", children: /* @__PURE__ */ m(bt, {}) }) : r ? /* @__PURE__ */ b("div", { className: `ct-text-sm ${s}`, children: [
    /* @__PURE__ */ b("div", { className: "ct-flex ct-items-center ct-justify-between ct-px-3 ct-py-1.5 ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: [
      /* @__PURE__ */ m("span", { children: "Orderbook" }),
      /* @__PURE__ */ m("span", { className: o ? "ct-text-green-400" : "ct-text-yellow-400", children: o ? "● Live" : "○ Polling" })
    ] }),
    /* @__PURE__ */ b("div", { className: "ct-grid ct-grid-cols-3 ct-gap-2 ct-px-3 ct-py-1.5 ct-border-b ct-border-[hsl(var(--cedros-border))] ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: [
      /* @__PURE__ */ m("div", { children: "Price" }),
      /* @__PURE__ */ m("div", { className: "ct-text-right", children: "Size" }),
      /* @__PURE__ */ m("div", { className: "ct-text-right", children: "Total" })
    ] }),
    /* @__PURE__ */ m("div", { className: "ct-max-h-48 ct-overflow-y-auto", children: l.asks.slice().reverse().map((c, a) => /* @__PURE__ */ m(
      Ai,
      {
        level: c,
        side: "ask",
        maxTotal: l.maxTotal,
        onClick: () => i == null ? void 0 : i(c.price, "buy")
      },
      `ask-${a}`
    )) }),
    /* @__PURE__ */ b("div", { className: "ct-px-3 ct-py-2 ct-bg-[hsl(var(--cedros-muted))] ct-border-y ct-border-[hsl(var(--cedros-border))]", children: [
      /* @__PURE__ */ b("div", { className: "ct-flex ct-items-center ct-justify-between ct-text-xs", children: [
        /* @__PURE__ */ m("span", { className: "ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Spread" }),
        /* @__PURE__ */ b("span", { className: "ct-font-medium ct-text-[hsl(var(--cedros-foreground))]", children: [
          l.spread.toFixed(3),
          "%"
        ] })
      ] }),
      r.midPrice > 0 && /* @__PURE__ */ b("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: [
        "Mid: $",
        r.midPrice.toFixed(4)
      ] })
    ] }),
    /* @__PURE__ */ m("div", { className: "ct-max-h-48 ct-overflow-y-auto", children: l.bids.map((c, a) => /* @__PURE__ */ m(
      Ai,
      {
        level: c,
        side: "bid",
        maxTotal: l.maxTotal,
        onClick: () => i == null ? void 0 : i(c.price, "sell")
      },
      `bid-${a}`
    )) })
  ] }) : /* @__PURE__ */ m("div", { className: "ct-text-center ct-py-8 ct-text-[hsl(var(--cedros-muted-foreground))] ct-text-sm", children: "No orderbook data" });
}
function Ai({ level: n, side: t, maxTotal: e, onClick: i }) {
  const s = t === "ask", r = `${n.total / e * 100}%`;
  return /* @__PURE__ */ b(
    "div",
    {
      onClick: i,
      className: `ct-relative ct-px-3 ct-py-1 ct-cursor-pointer ct-transition-colors ${s ? "hover:ct-bg-red-500/10" : "hover:ct-bg-green-500/10"}`,
      children: [
        /* @__PURE__ */ m(
          "div",
          {
            className: `ct-absolute ct-inset-y-0 ct-left-0 ${s ? "ct-bg-red-500/10" : "ct-bg-green-500/10"}`,
            style: { width: r }
          }
        ),
        /* @__PURE__ */ b("div", { className: "ct-relative ct-grid ct-grid-cols-3 ct-gap-2", children: [
          /* @__PURE__ */ m("div", { className: `ct-font-medium ${s ? "ct-text-red-400" : "ct-text-green-400"}`, children: n.price.toFixed(4) }),
          /* @__PURE__ */ m("div", { className: "ct-text-right ct-text-[hsl(var(--cedros-foreground))]", children: n.size.toFixed(2) }),
          /* @__PURE__ */ b("div", { className: "ct-text-right ct-text-[hsl(var(--cedros-muted-foreground))]", children: [
            "$",
            (n.total / 1e3).toFixed(1),
            "K"
          ] })
        ] })
      ]
    }
  );
}
function kh({ limitOrders: n, dcaOrders: t, isLoading: e, onCancel: i, className: s = "" }) {
  if (e) return /* @__PURE__ */ m("div", { className: "ct-flex ct-justify-center ct-py-8", children: /* @__PURE__ */ m(bt, {}) });
  const r = n.length === 0 && t.length === 0;
  return /* @__PURE__ */ b("div", { className: `ct-space-y-2 ${s}`, children: [
    r && /* @__PURE__ */ m("div", { className: "ct-text-center ct-py-8 ct-text-[hsl(var(--cedros-muted-foreground))] ct-text-sm", children: "No open orders" }),
    n.length > 0 && /* @__PURE__ */ b("table", { className: "ct-w-full ct-text-sm", children: [
      /* @__PURE__ */ m("thead", { children: /* @__PURE__ */ b("tr", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))] ct-border-b ct-border-[hsl(var(--cedros-border))]", children: [
        /* @__PURE__ */ m("th", { className: "ct-text-left ct-py-2 ct-px-2", children: "Type" }),
        /* @__PURE__ */ m("th", { className: "ct-text-left ct-py-2", children: "Pair" }),
        /* @__PURE__ */ m("th", { className: "ct-text-right ct-py-2", children: "Amount" }),
        /* @__PURE__ */ m("th", { className: "ct-text-right ct-py-2", children: "Trigger" }),
        /* @__PURE__ */ m("th", { className: "ct-text-right ct-py-2", children: "Status" }),
        /* @__PURE__ */ m("th", { className: "ct-text-right ct-py-2 ct-px-2" })
      ] }) }),
      /* @__PURE__ */ m("tbody", { children: n.map((h) => /* @__PURE__ */ b("tr", { className: "ct-border-b ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))]", children: [
        /* @__PURE__ */ m("td", { className: "ct-py-2 ct-px-2", children: /* @__PURE__ */ m("span", { className: `ct-px-2 ct-py-0.5 ct-rounded ct-text-xs ct-font-medium ${h.orderType === "stop-loss" ? "ct-bg-red-500/10 ct-text-red-400" : h.orderType === "take-profit" ? "ct-bg-green-500/10 ct-text-green-400" : "ct-bg-blue-500/10 ct-text-blue-400"}`, children: h.orderType }) }),
        /* @__PURE__ */ b("td", { className: "ct-py-2 ct-font-mono ct-text-xs", children: [
          h.inputMint.slice(0, 4),
          "→",
          h.outputMint.slice(0, 4)
        ] }),
        /* @__PURE__ */ m("td", { className: "ct-py-2 ct-text-right", children: h.inAmount }),
        /* @__PURE__ */ m("td", { className: "ct-py-2 ct-text-right", children: h.triggerPrice ?? "-" }),
        /* @__PURE__ */ m("td", { className: "ct-py-2 ct-text-right", children: h.status }),
        /* @__PURE__ */ m("td", { className: "ct-py-2 ct-px-2 ct-text-right", children: i && h.status === "open" && /* @__PURE__ */ m(
          "button",
          {
            onClick: () => i(h.orderId),
            className: "ct-text-xs ct-text-red-400 hover:ct-text-red-300",
            children: "Cancel"
          }
        ) })
      ] }, h.orderId)) })
    ] }),
    t.length > 0 && /* @__PURE__ */ b("div", { className: "ct-space-y-2", children: [
      /* @__PURE__ */ m("h4", { className: "ct-text-xs ct-font-medium ct-text-[hsl(var(--cedros-muted-foreground))] ct-px-2", children: "DCA Schedules" }),
      t.map((h) => /* @__PURE__ */ b("div", { className: "ct-flex ct-items-center ct-justify-between ct-px-2 ct-py-2 ct-rounded ct-bg-[hsl(var(--cedros-muted))]", children: [
        /* @__PURE__ */ b("div", { children: [
          /* @__PURE__ */ b("span", { className: "ct-text-sm ct-text-[hsl(var(--cedros-foreground))]", children: [
            h.completedCycles,
            "/",
            h.totalCycles,
            " cycles"
          ] }),
          /* @__PURE__ */ m("span", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))] ct-ml-2", children: h.status })
        ] }),
        h.nextCycleAt && /* @__PURE__ */ b("span", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: [
          "Next: ",
          new Date(h.nextCycleAt).toLocaleDateString()
        ] })
      ] }, h.dcaAccountId))
    ] })
  ] });
}
function Ms({ holdings: n, isLoading: t, totalValue: e, className: i = "" }) {
  return t ? /* @__PURE__ */ m("div", { className: "ct-flex ct-justify-center ct-py-8", children: /* @__PURE__ */ m(bt, {}) }) : /* @__PURE__ */ b("div", { className: i, children: [
    e && /* @__PURE__ */ b("div", { className: "ct-flex ct-justify-between ct-items-center ct-px-2 ct-py-2 ct-mb-2", children: [
      /* @__PURE__ */ m("span", { className: "ct-text-sm ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Total Value" }),
      /* @__PURE__ */ b("span", { className: "ct-text-lg ct-font-semibold ct-text-[hsl(var(--cedros-foreground))]", children: [
        "$",
        e
      ] })
    ] }),
    n.length === 0 ? /* @__PURE__ */ m("div", { className: "ct-text-center ct-py-8 ct-text-[hsl(var(--cedros-muted-foreground))] ct-text-sm", children: "No holdings" }) : /* @__PURE__ */ b("table", { className: "ct-w-full ct-text-sm", children: [
      /* @__PURE__ */ m("thead", { children: /* @__PURE__ */ b("tr", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))] ct-border-b ct-border-[hsl(var(--cedros-border))]", children: [
        /* @__PURE__ */ m("th", { className: "ct-text-left ct-py-2 ct-px-2", children: "Token" }),
        /* @__PURE__ */ m("th", { className: "ct-text-right ct-py-2", children: "Balance" }),
        /* @__PURE__ */ m("th", { className: "ct-text-right ct-py-2", children: "Price" }),
        /* @__PURE__ */ m("th", { className: "ct-text-right ct-py-2 ct-px-2", children: "Value" })
      ] }) }),
      /* @__PURE__ */ m("tbody", { children: n.map((s) => /* @__PURE__ */ b("tr", { className: "ct-border-b ct-border-[hsl(var(--cedros-border))] ct-text-[hsl(var(--cedros-foreground))]", children: [
        /* @__PURE__ */ m("td", { className: "ct-py-2 ct-px-2 ct-font-medium", children: s.symbol ?? s.mint.slice(0, 6) }),
        /* @__PURE__ */ m("td", { className: "ct-py-2 ct-text-right ct-font-mono", children: s.uiBalance }),
        /* @__PURE__ */ m("td", { className: "ct-py-2 ct-text-right", children: s.currentPrice ? `$${s.currentPrice}` : "-" }),
        /* @__PURE__ */ m("td", { className: "ct-py-2 ct-px-2 ct-text-right ct-font-medium", children: s.currentValue ? `$${s.currentValue}` : "-" })
      ] }, s.mint)) })
    ] })
  ] });
}
function Wh({
  walletAddress: n,
  inputMint: t = "So11111111111111111111111111111111111111112",
  outputMint: e = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  inputSymbol: i = "SOL",
  outputSymbol: s = "USDC",
  tradingViewSymbol: r = "SOLUSD",
  chartType: h = "tradingview",
  manifestMarket: o,
  theme: l = "dark",
  onSign: c,
  onOrderSuccess: a,
  className: u = ""
}) {
  const [d, p] = M("positions"), { limitOrders: f, dcaOrders: v, isLoading: g, cancelOrder: y } = Ws(n ?? null), { positions: x, isLoading: _ } = Ui(n ?? null);
  return /* @__PURE__ */ b("div", { className: `ct-flex ct-flex-col ct-h-full ct-min-h-screen ct-bg-[hsl(var(--cedros-background))] ${u}`, children: [
    /* @__PURE__ */ b("div", { className: "ct-flex ct-flex-1 ct-min-h-0", children: [
      /* @__PURE__ */ m("div", { className: "ct-flex-1 ct-min-w-0 ct-border-r ct-border-[hsl(var(--cedros-border))]", children: /* @__PURE__ */ m(Ch, { chartType: h, symbol: r, theme: l }) }),
      /* @__PURE__ */ m("div", { className: "ct-hidden xl:ct-block ct-w-80 ct-flex-shrink-0 ct-overflow-y-auto", children: /* @__PURE__ */ m(
        Ki,
        {
          walletAddress: n,
          inputMint: t,
          outputMint: e,
          inputSymbol: i,
          outputSymbol: s,
          onSign: c,
          onSuccess: a
        }
      ) })
    ] }),
    /* @__PURE__ */ b("div", { className: "ct-border-t ct-border-[hsl(var(--cedros-border))]", children: [
      /* @__PURE__ */ m("div", { className: "ct-flex ct-gap-4 ct-px-4 ct-border-b ct-border-[hsl(var(--cedros-border))]", children: ["positions", "orders", ...o ? ["orderbook"] : []].map((S) => /* @__PURE__ */ b(
        "button",
        {
          onClick: () => p(S),
          className: `ct-py-2 ct-text-sm ct-font-medium ct-border-b-2 ct-transition ct-capitalize ${d === S ? "ct-border-[hsl(var(--cedros-primary))] ct-text-[hsl(var(--cedros-foreground))]" : "ct-border-transparent ct-text-[hsl(var(--cedros-muted-foreground))] hover:ct-text-[hsl(var(--cedros-foreground))]"}`,
          children: [
            S,
            " ",
            S === "orders" && f.length > 0 && `(${f.length})`
          ]
        },
        S
      )) }),
      /* @__PURE__ */ b("div", { className: "ct-max-h-64 ct-overflow-y-auto", children: [
        d === "positions" && /* @__PURE__ */ m(
          Ms,
          {
            holdings: (x == null ? void 0 : x.holdings) ?? [],
            isLoading: _,
            totalValue: x == null ? void 0 : x.totalValue
          }
        ),
        d === "orders" && /* @__PURE__ */ m(
          kh,
          {
            limitOrders: f,
            dcaOrders: v,
            isLoading: g,
            onCancel: n ? (S) => y(S, n) : void 0
          }
        ),
        d === "orderbook" && o && /* @__PURE__ */ m(Eh, { marketAddress: o })
      ] })
    ] }),
    /* @__PURE__ */ m("div", { className: "xl:ct-hidden ct-p-4", children: /* @__PURE__ */ m(
      Ki,
      {
        walletAddress: n,
        inputMint: t,
        outputMint: e,
        inputSymbol: i,
        outputSymbol: s,
        onSign: c,
        onSuccess: a
      }
    ) })
  ] });
}
function Dh({ walletAddress: n, className: t = "" }) {
  const { positions: e, isLoading: i, error: s, refresh: r } = Ui(n ?? null);
  return /* @__PURE__ */ b("div", { className: `ct-max-w-2xl ct-mx-auto ct-py-8 ct-px-4 ct-space-y-4 ${t}`, children: [
    /* @__PURE__ */ b("div", { className: "ct-flex ct-items-center ct-justify-between", children: [
      /* @__PURE__ */ m("h2", { className: "ct-text-xl ct-font-semibold ct-text-[hsl(var(--cedros-foreground))]", children: "Portfolio" }),
      /* @__PURE__ */ m(
        "button",
        {
          onClick: r,
          disabled: i,
          className: "ct-text-sm ct-text-[hsl(var(--cedros-primary))] hover:ct-underline disabled:ct-opacity-50",
          children: "Refresh"
        }
      )
    ] }),
    n ? /* @__PURE__ */ b(Ts, { children: [
      /* @__PURE__ */ m(te, { message: s }),
      e && /* @__PURE__ */ b("div", { className: "ct-bg-[hsl(var(--cedros-muted))] ct-rounded-cedros ct-p-4 ct-grid ct-grid-cols-2 ct-gap-4", children: [
        /* @__PURE__ */ b("div", { children: [
          /* @__PURE__ */ m("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Total Value" }),
          /* @__PURE__ */ b("div", { className: "ct-text-2xl ct-font-bold ct-text-[hsl(var(--cedros-foreground))]", children: [
            "$",
            e.totalValue
          ] })
        ] }),
        /* @__PURE__ */ b("div", { children: [
          /* @__PURE__ */ m("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Open Orders" }),
          /* @__PURE__ */ m("div", { className: "ct-text-2xl ct-font-bold ct-text-[hsl(var(--cedros-foreground))]", children: e.openOrders })
        ] })
      ] }),
      /* @__PURE__ */ m("div", { className: "ct-bg-[hsl(var(--cedros-background))] ct-border ct-border-[hsl(var(--cedros-border))] ct-rounded-cedros", children: /* @__PURE__ */ m(
        Ms,
        {
          holdings: (e == null ? void 0 : e.holdings) ?? [],
          isLoading: i
        }
      ) })
    ] }) : /* @__PURE__ */ m("div", { className: "ct-text-center ct-py-12 ct-text-[hsl(var(--cedros-muted-foreground))]", children: "Connect a wallet to view your portfolio" })
  ] });
}
function Bh({ walletAddress: n, onSign: t, className: e = "" }) {
  const { actions: i, isLoading: s, complete: r, dismiss: h } = qi(n ?? null), [o, l] = M(null), c = async (a, u) => {
    if (t) {
      l(a);
      try {
        const d = await t(u);
        await r(a, d);
      } catch {
      } finally {
        l(null);
      }
    }
  };
  return !n || i.length === 0 ? null : /* @__PURE__ */ b("div", { className: `ct-space-y-2 ${e}`, children: [
    /* @__PURE__ */ b("h4", { className: "ct-text-sm ct-font-medium ct-text-[hsl(var(--cedros-foreground))]", children: [
      "Pending Actions (",
      i.length,
      ")"
    ] }),
    i.map((a) => /* @__PURE__ */ b("div", { className: "ct-flex ct-items-center ct-gap-3 ct-p-3 ct-rounded-cedros ct-bg-[hsl(var(--cedros-muted))] ct-border ct-border-[hsl(var(--cedros-border))]", children: [
      /* @__PURE__ */ b("div", { className: "ct-flex-1 ct-min-w-0", children: [
        /* @__PURE__ */ m("div", { className: "ct-text-sm ct-text-[hsl(var(--cedros-foreground))]", children: a.reason }),
        /* @__PURE__ */ b("div", { className: "ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))]", children: [
          "Expires ",
          new Date(a.expiresAt).toLocaleTimeString()
        ] })
      ] }),
      /* @__PURE__ */ b("div", { className: "ct-flex ct-gap-2", children: [
        /* @__PURE__ */ m(
          "button",
          {
            onClick: () => c(a.id, a.transaction),
            disabled: o === a.id,
            className: "ct-px-3 ct-py-1.5 ct-rounded ct-text-xs ct-font-medium ct-bg-[hsl(var(--cedros-primary))] ct-text-[hsl(var(--cedros-primary-foreground))] hover:ct-opacity-90 disabled:ct-opacity-50",
            children: o === a.id ? /* @__PURE__ */ m(bt, { className: "ct-h-3 ct-w-3" }) : "Sign"
          }
        ),
        /* @__PURE__ */ m(
          "button",
          {
            onClick: () => h(a.id),
            className: "ct-px-3 ct-py-1.5 ct-rounded ct-text-xs ct-text-[hsl(var(--cedros-muted-foreground))] hover:ct-text-[hsl(var(--cedros-foreground))]",
            children: "Dismiss"
          }
        )
      ] })
    ] }, a.id))
  ] });
}
function Ih({ walletAddress: n, onClick: t, className: e = "" }) {
  const { count: i } = qi(n ?? null);
  return i === 0 ? null : /* @__PURE__ */ m(
    "button",
    {
      onClick: t,
      className: `ct-relative ct-inline-flex ct-items-center ct-justify-center ct-px-2 ct-py-1 ct-rounded-full ct-text-xs ct-font-medium ct-bg-red-500 ct-text-white ct-animate-pulse ${e}`,
      children: i
    }
  );
}
export {
  Ih as ActionNotificationBadge,
  Bh as ActionQueue,
  $h as CedrosTradeProvider,
  Ch as ChartContainer,
  te as ErrorMessage,
  _h as LightweightChart,
  bt as LoadingSpinner,
  kh as OpenOrdersTable,
  Ki as OrderForm,
  Dh as PortfolioPage,
  Ms as PositionsTable,
  Gi as SlippageControl,
  Ks as SwapForm,
  Rh as SwapPage,
  Ji as TokenSelector,
  Vs as TradeApiClient,
  Kh as TradeApiError,
  Wh as TradingPage,
  Hs as TradingViewChart,
  Xs as TransferForm,
  Oh as TransferPage,
  qi as useActionQueue,
  Bs as useLimitOrder,
  Ws as useOpenOrders,
  Ui as usePositions,
  Vh as usePrices,
  Rs as useSwap,
  Ds as useTokens,
  it as useTradeApi,
  Hi as useTradeContext,
  Os as useTransfer
};
