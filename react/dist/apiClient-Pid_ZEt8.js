class p {
  constructor(t, e, r) {
    this.baseUrl = t, this.tokenFn = e, this.apiKey = r;
  }
  async request(t, e) {
    var n, a, u;
    const r = {
      "Content-Type": "application/json",
      ...e == null ? void 0 : e.headers
    }, o = (n = this.tokenFn) == null ? void 0 : n.call(this);
    o && (r.Authorization = `Bearer ${o}`), this.apiKey && (r["x-api-key"] = this.apiKey);
    const s = await fetch(`${this.baseUrl}${t}`, { ...e, headers: r });
    if (!s.ok) {
      const i = await s.json().catch(() => ({ error: { message: s.statusText } }));
      throw new c(s.status, ((a = i == null ? void 0 : i.error) == null ? void 0 : a.code) ?? "UNKNOWN", ((u = i == null ? void 0 : i.error) == null ? void 0 : u.message) ?? s.statusText);
    }
    return s.json();
  }
  get(t) {
    return this.request(t);
  }
  post(t, e) {
    return this.request(t, { method: "POST", body: JSON.stringify(e) });
  }
  del(t, e) {
    return this.request(t, { method: "DELETE", body: e ? JSON.stringify(e) : void 0 });
  }
  // --- Tokens ---
  getTokens(t) {
    const e = t ? `?category=${t}` : "";
    return this.get(`/tokens${e}`);
  }
  getToken(t) {
    return this.get(`/tokens/${t}`);
  }
  // --- Swap ---
  getQuote(t) {
    return this.post("/swap/quote", t);
  }
  buildSwap(t, e) {
    return this.post("/swap/build", { quote: t, userPublicKey: e });
  }
  compareQuotes(t, e, r) {
    return this.get(`/swap/compare?inputMint=${t}&outputMint=${e}&amount=${r}`);
  }
  executeSwap(t, e, r) {
    return this.post("/swap/execute", { signedTransaction: t, provider: e, requestId: r });
  }
  getProviders() {
    return this.get("/swap/providers");
  }
  // --- Prices ---
  getPrice(t) {
    return this.get(`/prices/${t}`);
  }
  getBatchPrices(t) {
    return this.post("/prices/batch", { mints: t });
  }
  // --- Transfers ---
  buildTransfer(t) {
    return this.post("/transfers/build", t);
  }
  executeTransfer(t) {
    return this.post("/transfers/execute", { signedTransaction: t, provider: "rpc" });
  }
  resolveAddress(t) {
    return this.get(`/transfers/resolve/${t}`);
  }
  // --- Orders ---
  createLimitOrder(t) {
    return this.post("/orders/limit", t);
  }
  createStopLoss(t) {
    return this.post("/orders/stop-loss", t);
  }
  createTakeProfit(t) {
    return this.post("/orders/take-profit", t);
  }
  createDca(t) {
    return this.post("/orders/dca", t);
  }
  cancelOrder(t, e) {
    return this.del(`/orders/${t}`, { maker: e });
  }
  getOpenOrders(t) {
    return this.get(`/orders/wallet/${t}`);
  }
  // --- Positions ---
  getPositions(t) {
    return this.get(`/positions/${t}`);
  }
  // --- Action Queue ---
  getPendingActions(t) {
    return this.get(`/orders/actions/${t}`);
  }
  completeAction(t, e) {
    return this.post(
      `/orders/actions/${t}/complete`,
      { signedTransaction: e }
    );
  }
  dismissAction(t) {
    return this.post(`/orders/actions/${t}/dismiss`, {});
  }
  // --- Health ---
  getHealth() {
    return this.get("/health");
  }
}
class c extends Error {
  constructor(t, e, r) {
    super(r), this.status = t, this.code = e, this.name = "TradeApiError";
  }
}
export {
  p as T,
  c as a
};
