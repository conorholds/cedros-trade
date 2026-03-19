import { default as default_2 } from 'react';
import { JSX as JSX_2 } from 'react/jsx-runtime';

export declare function ActionNotificationBadge({ walletAddress, onClick, className }: ActionNotificationBadgeProps): JSX_2.Element | null;

export declare interface ActionNotificationBadgeProps {
    walletAddress?: string;
    onClick?: () => void;
    className?: string;
}

export declare function ActionQueue({ walletAddress, onSign, className }: ActionQueueProps): JSX_2.Element | null;

export declare interface ActionQueueProps {
    walletAddress?: string;
    onSign?: (transaction: string) => Promise<string>;
    className?: string;
}

export declare interface CedrosTradeConfig {
    /** Base URL of the cedros-trade server (e.g. "/api/trade" or "https://trade.example.com") */
    serverUrl: string;
    /** Function to get the auth token (from cedros-login or custom auth) */
    getAccessToken?: () => string | null;
    /** Optional API key for rate-limited access */
    apiKey?: string;
    /** Default slippage in bps */
    defaultSlippageBps?: number;
    /** Chart type: 'tradingview' | 'lightweight' */
    chartType?: 'tradingview' | 'lightweight';
}

export declare function CedrosTradeProvider({ config, children, theme: themeMode, themeOverrides, unstyled, }: CedrosTradeProviderProps): JSX_2.Element;

export declare interface CedrosTradeProviderProps {
    config: CedrosTradeConfig;
    children: default_2.ReactNode;
    /** Theme mode. Same prop name as cedros-login. Default: 'dark'. */
    theme?: ThemeMode;
    /**
     * Override CSS variable tokens. Same ThemeOverrides interface as cedros-login —
     * pass the same object to both providers and they'll both respect it.
     *
     * @example
     * const overrides = { '--cedros-background': '#292524', '--cedros-foreground': '#f5f5f4' };
     * <CedrosLoginProvider config={...} themeOverrides={overrides}>
     *   <CedrosTradeProvider config={...} themeOverrides={overrides}>
     */
    themeOverrides?: ThemeOverrides;
    /** Disable all default styles. Same prop as cedros-login's `unstyled`. */
    unstyled?: boolean;
}

export declare function ChartContainer({ chartType, symbol, theme, chartData, className }: ChartContainerProps): JSX_2.Element;

export declare interface ChartContainerProps {
    chartType: 'tradingview' | 'lightweight';
    symbol: string;
    theme?: 'light' | 'dark';
    chartData?: {
        time: string;
        open: number;
        high: number;
        low: number;
        close: number;
    }[];
    className?: string;
}

export declare interface DcaOrder {
    dcaAccountId: string;
    inputMint: string;
    outputMint: string;
    totalInAmount: string;
    perCycleAmount: string;
    cycleInterval: number;
    completedCycles: number;
    totalCycles: number;
    totalOutReceived: string;
    status: string;
    nextCycleAt?: string;
}

export declare function ErrorMessage({ message, className, onDismiss }: ErrorMessageProps): JSX_2.Element | null;

export declare interface ErrorMessageProps {
    message: string | null;
    className?: string;
    onDismiss?: () => void;
}

export declare interface ExecuteResult {
    signature: string;
    status: 'confirmed' | 'submitted' | 'failed';
}

export declare interface Holding {
    mint: string;
    symbol?: string;
    balance: string;
    decimals: number;
    uiBalance: string;
    currentPrice?: string;
    currentValue?: string;
}

export declare function LightweightChart({ data, theme, className }: LightweightChartProps): JSX_2.Element;

export declare interface LightweightChartProps {
    data?: {
        time: string;
        open: number;
        high: number;
        low: number;
        close: number;
    }[];
    theme?: 'light' | 'dark';
    className?: string;
}

export declare function LoadingSpinner({ className }: {
    className?: string;
}): JSX_2.Element;

export declare interface MonitoredOrder {
    id: string;
    orderType: string;
    maker: string;
    walletId: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    status: string;
    currentTrigger?: string;
    peakPrice?: string;
    createdAt: string;
    executedAt?: string;
    txSignature?: string;
    fillPrice?: string;
}

export declare function MonitoredOrdersList({ walletAddress, className }: MonitoredOrdersListProps): JSX_2.Element;

export declare interface MonitoredOrdersListProps {
    walletAddress: string;
    className?: string;
}

export declare interface OpenOrder {
    orderId: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    filled: string;
    status: string;
    orderType: 'limit' | 'stop-loss' | 'take-profit';
    triggerPrice?: string;
    createdAt?: string;
    expiry?: string;
}

export declare function OpenOrdersTable({ limitOrders, dcaOrders, isLoading, onCancel, className }: OpenOrdersTableProps): JSX_2.Element;

export declare interface OpenOrdersTableProps {
    limitOrders: OpenOrder[];
    dcaOrders: DcaOrder[];
    isLoading: boolean;
    onCancel?: (orderId: string) => void;
    className?: string;
}

export declare function OrderForm({ walletAddress, inputMint, outputMint, inputSymbol, outputSymbol, currentPrice, onSign, onSuccess, className, }: OrderFormProps): JSX_2.Element;

export declare interface OrderFormProps {
    walletAddress?: string;
    inputMint: string;
    outputMint: string;
    inputSymbol?: string;
    outputSymbol?: string;
    currentPrice?: number;
    onSign?: (transaction: string) => Promise<string>;
    onSuccess?: (orderId: string) => void;
    className?: string;
}

export declare interface PendingAction {
    id: string;
    walletAddress: string;
    orderId: string;
    actionType: string;
    transaction: string;
    reason: string;
    status: string;
    createdAt: string;
    expiresAt: string;
    txSignature?: string;
}

export declare interface PnlHolding {
    mint: string;
    symbol?: string;
    uiBalance: string;
    currentPrice: string;
    currentValue: string;
    entryPrice?: string;
    costBasis?: string;
    unrealizedPnl?: string;
    unrealizedPnlPercent?: string;
}

export declare function PnlTable({ walletAddress, className }: PnlTableProps): JSX_2.Element;

export declare interface PnlTableProps {
    walletAddress: string;
    className?: string;
}

export declare function PortfolioPage({ walletAddress, className }: PortfolioPageProps): JSX_2.Element;

export declare interface PortfolioPageProps {
    walletAddress?: string;
    className?: string;
}

export declare interface PositionsResponse {
    holdings: Holding[];
    openOrders: number;
    totalValue: string;
}

export declare function PositionsTable({ holdings, isLoading, totalValue, className }: PositionsTableProps): JSX_2.Element;

export declare interface PositionsTableProps {
    holdings: Holding[];
    isLoading: boolean;
    totalValue?: string;
    className?: string;
}

export declare interface PriceSnapshot {
    mint: string;
    priceUsd: number;
    sources: {
        name: string;
        priceUsd: number;
        stale: boolean;
    }[];
    degraded: boolean;
    marketCap?: number;
    volume24h?: number;
    priceChange24hPct?: number;
}

export declare function ProviderComparison({ inputMint, outputMint, amount, outputDecimals, onSelect, className }: ProviderComparisonProps): JSX_2.Element | null;

export declare interface ProviderComparisonProps {
    inputMint: string;
    outputMint: string;
    amount: string;
    outputDecimals?: number;
    onSelect?: (quote: SwapQuote) => void;
    className?: string;
}

export declare interface ProviderInfo {
    name: string;
    enabled: boolean;
    capabilities: {
        name: string;
        gasless: boolean;
        mevProtected: boolean;
        supportsExactOut: boolean;
    };
    health: {
        name: string;
        healthy: boolean;
        latencyMs?: number;
        error?: string;
    };
}

export declare function SlippageControl({ value, onChange, className }: SlippageControlProps): JSX_2.Element;

export declare interface SlippageControlProps {
    value: number;
    onChange: (bps: number) => void;
    className?: string;
}

export declare function SwapForm({ walletAddress, onSign, onSuccess, onError, defaultInputMint, defaultOutputMint, allowedInputMints, allowedOutputMints, className, }: SwapFormProps): JSX_2.Element;

export declare interface SwapFormProps {
    /** User's wallet public key */
    walletAddress?: string;
    /** Called with the unsigned transaction for signing */
    onSign?: (transaction: string, provider: string, requestId?: string) => Promise<string>;
    /** Called after successful execution */
    onSuccess?: (signature: string) => void;
    onError?: (error: string) => void;
    defaultInputMint?: string;
    defaultOutputMint?: string;
    /** Restrict which mints appear in the input token selector */
    allowedInputMints?: string[];
    /** Restrict which mints appear in the output token selector */
    allowedOutputMints?: string[];
    className?: string;
}

export declare function SwapPage({ title, ...formProps }: SwapPageProps): JSX_2.Element;

export declare interface SwapPageProps extends SwapFormProps {
    title?: string;
}

export declare interface SwapQuote {
    provider: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    otherAmountThreshold?: string;
    priceImpactPct: number;
    slippageBps: number;
    routeData?: unknown;
    gasless: boolean;
}

export declare interface SwapTransaction {
    transaction: string;
    gasless: boolean;
    lastValidBlockHeight?: number;
    requestId?: string;
}

export declare type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Theme overrides — same interface as cedros-login's ThemeOverrides.
 * Uses CSS custom property names as keys so one set of overrides works across all Cedros packages.
 * Additional trade-specific tokens (--ct-*) are accepted via the index signature.
 */
export declare interface ThemeOverrides {
    '--cedros-primary'?: string;
    '--cedros-primary-foreground'?: string;
    '--cedros-background'?: string;
    '--cedros-foreground'?: string;
    '--cedros-muted'?: string;
    '--cedros-muted-foreground'?: string;
    '--cedros-border'?: string;
    '--cedros-input'?: string;
    '--cedros-ring'?: string;
    '--cedros-radius'?: string;
    '--cedros-destructive'?: string;
    '--cedros-destructive-foreground'?: string;
    /** Additional custom properties (e.g. --ct-buy, --ct-sell) */
    [key: string]: string | undefined;
}

export declare interface TokenRecord {
    mint: string;
    symbol: string;
    name: string;
    decimals: number;
    logoUrl?: string;
    coingeckoId?: string;
    tradingviewSymbol?: string;
    categories: string[];
}

export declare function TokenSelector({ isOpen, onClose, onSelect, excludeMints, allowedMints, className }: TokenSelectorProps): JSX_2.Element | null;

export declare interface TokenSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (token: TokenRecord) => void;
    /** Mints to exclude from the list (e.g. the other side of the pair) */
    excludeMints?: string[];
    /** If set, only show these mints (allowlist) */
    allowedMints?: string[];
    className?: string;
}

export declare class TradeApiClient {
    private baseUrl;
    private tokenFn?;
    private apiKey?;
    constructor(baseUrl: string, tokenFn?: (() => string | null) | undefined, apiKey?: string | undefined);
    private request;
    private get;
    private post;
    private del;
    getTokens(category?: string): Promise<{
        tokens: TokenRecord[];
        count: number;
    }>;
    getToken(mint: string): Promise<TokenRecord>;
    getQuote(params: {
        inputMint: string;
        outputMint: string;
        amount: string;
        slippageBps?: number;
        provider?: string;
    }): Promise<SwapQuote>;
    buildSwap(quote: SwapQuote, userPublicKey: string): Promise<SwapTransaction>;
    compareQuotes(inputMint: string, outputMint: string, amount: string): Promise<SwapQuote[]>;
    executeSwap(signedTransaction: string, provider: string, requestId?: string): Promise<ExecuteResult>;
    simulateSwap(signedTransaction: string): Promise<{
        success: boolean;
        logs?: string[];
        unitsConsumed?: number;
        error?: unknown;
    }>;
    getSwapRoutes(): Promise<{
        provider: string;
        capabilities: ProviderInfo["capabilities"];
        enabled: boolean;
    }[]>;
    getProviders(): Promise<ProviderInfo[]>;
    getPrice(mint: string): Promise<PriceSnapshot>;
    getPriceBySymbol(symbol: string): Promise<PriceSnapshot>;
    getBatchPrices(mints: string[]): Promise<{
        prices: PriceSnapshot[];
    }>;
    buildTransfer(params: {
        sender: string;
        recipient: string;
        mint: string;
        amount: string;
        memo?: string;
    }): Promise<TransferBuildResponse>;
    executeTransfer(signedTransaction: string): Promise<ExecuteResult>;
    resolveAddress(address: string): Promise<{
        input: string;
        resolved: string;
        type: string;
    }>;
    createLimitOrder(params: {
        maker: string;
        inputMint: string;
        outputMint: string;
        inAmount: string;
        outAmount: string;
        expiry?: string;
    }): Promise<{
        transaction: string;
        orderId: string;
    }>;
    createStopLoss(params: {
        maker: string;
        inputMint: string;
        outputMint: string;
        inAmount: string;
        triggerPrice: string;
        slippageBps?: number;
    }): Promise<{
        transaction: string;
        orderId: string;
    }>;
    createTakeProfit(params: {
        maker: string;
        inputMint: string;
        outputMint: string;
        inAmount: string;
        triggerPrice: string;
        slippageBps?: number;
    }): Promise<{
        transaction: string;
        orderId: string;
    }>;
    createDca(params: {
        maker: string;
        inputMint: string;
        outputMint: string;
        totalInAmount: string;
        perCycleAmount: string;
        cycleInterval: number;
    }): Promise<{
        transaction: string;
        orderId: string;
    }>;
    cancelOrder(orderId: string, maker: string): Promise<{
        transaction: string;
    }>;
    createTrailingStop(params: {
        maker: string;
        walletId?: string;
        inputMint: string;
        outputMint: string;
        inAmount: string;
        trailPercent: number;
        slippageBps?: number;
    }): Promise<{
        orderId: string;
        currentPrice: string;
        initialTrigger: string;
        status: string;
    }>;
    createOco(params: {
        maker: string;
        walletId?: string;
        inputMint: string;
        outputMint: string;
        inAmount: string;
        stopLoss: {
            triggerPrice: string;
            slippageBps: number;
        };
        takeProfit: {
            triggerPrice: string;
            slippageBps: number;
        };
    }): Promise<{
        ocoId: string;
        stopLossOrderId: string;
        takeProfitOrderId: string;
        status: string;
        linked: boolean;
        reason?: string;
    }>;
    createBracket(params: {
        maker: string;
        walletId?: string;
        inputMint: string;
        outputMint: string;
        inAmount: string;
        stopLossPercent: number;
        takeProfitPercent: number;
        trailingStop?: boolean;
    }): Promise<{
        bracketId: string;
        entryTransaction: string;
        status: string;
    }>;
    getOpenOrders(wallet: string): Promise<{
        limitOrders: OpenOrder[];
        dcaOrders: DcaOrder[];
    }>;
    getMonitoredOrders(wallet: string): Promise<unknown[]>;
    getExecutions(orderId: string): Promise<{
        orderId: string;
        timestamp: string;
        txSignature: string;
        fillPrice: string;
        status: string;
    }[]>;
    getPositions(wallet: string): Promise<PositionsResponse>;
    getPnl(wallet: string): Promise<{
        holdings: PnlHolding[];
        totalValue: string;
        totalCostBasis: string;
        totalUnrealizedPnl: string;
        dataSource: string;
    }>;
    getTradeHistory(wallet: string, mint?: string, limit?: number): Promise<{
        trades: TradeHistoryEntry[];
    }>;
    getOrderbook(market: string): Promise<{
        bids: unknown[];
        asks: unknown[];
        spread: number;
        midPrice: number;
    }>;
    findMarkets(baseMint: string, quoteMint: string): Promise<{
        address: string;
        baseMint: string;
        quoteMint: string;
    }[]>;
    placeManifestOrder(params: {
        market: string;
        maker: string;
        isBid: boolean;
        numBaseTokens: number;
        tokenPrice: number;
        orderType?: string;
    }): Promise<{
        transaction: string;
        orderId: string;
        needsSeatSetup: boolean;
    }>;
    getPendingActions(wallet: string): Promise<PendingAction[]>;
    completeAction(actionId: string, signedTransaction: string): Promise<{
        actionId: string;
        status: string;
        signature: string;
    }>;
    dismissAction(actionId: string): Promise<{
        actionId: string;
        status: string;
    }>;
    getHealth(): Promise<{
        status: string;
        version: string;
    }>;
}

export declare class TradeApiError extends Error {
    status: number;
    code: string;
    constructor(status: number, code: string, message: string);
}

declare interface TradeContextValue {
    api: TradeApiClient;
    config: CedrosTradeConfig;
    theme: UseThemeReturn;
}

export declare interface TradeHistoryEntry {
    signature: string;
    timestamp: string;
    tradeType: string;
    inputMint: string;
    outputMint: string;
    inputAmount: string;
    outputAmount: string;
    price: string;
    source: string;
}

export declare function TradeHistoryTable({ walletAddress, mintFilter, limit, className }: TradeHistoryTableProps): JSX_2.Element;

export declare interface TradeHistoryTableProps {
    walletAddress: string;
    mintFilter?: string;
    limit?: number;
    className?: string;
}

export declare function TradingPage({ walletAddress, inputMint, outputMint, inputSymbol, outputSymbol, tradingViewSymbol, chartType, manifestMarket, theme, onSign, onOrderSuccess, className, }: TradingPageProps): JSX_2.Element;

export declare interface TradingPageProps {
    walletAddress?: string;
    inputMint?: string;
    outputMint?: string;
    inputSymbol?: string;
    outputSymbol?: string;
    tradingViewSymbol?: string;
    chartType?: 'tradingview' | 'lightweight';
    /** Manifest market address for orderbook (optional — hides orderbook if not set) */
    manifestMarket?: string;
    theme?: 'light' | 'dark';
    onSign?: (transaction: string) => Promise<string>;
    onOrderSuccess?: (orderId: string) => void;
    className?: string;
}

export declare function TradingViewChart({ symbol, interval, theme, className, }: TradingViewChartProps): JSX_2.Element;

export declare interface TradingViewChartProps {
    symbol: string;
    interval?: string;
    theme?: 'light' | 'dark';
    className?: string;
}

export declare interface TransferBuildResponse {
    transaction: string;
    recipientResolved: string;
    recipientType: 'address' | 'domain';
    lastValidBlockHeight: number;
    createsAta: boolean;
}

export declare function TransferForm({ walletAddress, onSign, onSuccess, onError, className }: TransferFormProps): JSX_2.Element;

export declare interface TransferFormProps {
    walletAddress?: string;
    onSign?: (transaction: string) => Promise<string>;
    onSuccess?: (signature: string) => void;
    onError?: (error: string) => void;
    className?: string;
}

export declare function TransferPage(props: TransferPageProps): JSX_2.Element;

export declare interface TransferPageProps extends TransferFormProps {
}

export declare function useActionQueue(walletAddress: string | null): UseActionQueueReturn;

export declare interface UseActionQueueReturn {
    actions: PendingAction[];
    count: number;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    complete: (actionId: string, signedTransaction: string) => Promise<void>;
    dismiss: (actionId: string) => Promise<void>;
}

/** Expose theme state. Same pattern as cedros-login's useThemeManager(). */
export declare function useCedrosTradeTheme(): UseThemeReturn;

export declare function useLimitOrder(): UseLimitOrderReturn;

export declare interface UseLimitOrderReturn {
    isLoading: boolean;
    error: string | null;
    createLimit: (params: {
        maker: string;
        inputMint: string;
        outputMint: string;
        inAmount: string;
        outAmount: string;
        expiry?: string;
    }) => Promise<{
        transaction: string;
        orderId: string;
    }>;
    createStopLoss: (params: {
        maker: string;
        inputMint: string;
        outputMint: string;
        inAmount: string;
        triggerPrice: string;
        slippageBps?: number;
    }) => Promise<{
        transaction: string;
        orderId: string;
    }>;
    createTakeProfit: (params: {
        maker: string;
        inputMint: string;
        outputMint: string;
        inAmount: string;
        triggerPrice: string;
        slippageBps?: number;
    }) => Promise<{
        transaction: string;
        orderId: string;
    }>;
    createDca: (params: {
        maker: string;
        inputMint: string;
        outputMint: string;
        totalInAmount: string;
        perCycleAmount: string;
        cycleInterval: number;
    }) => Promise<{
        transaction: string;
        orderId: string;
    }>;
}

export declare function useOpenOrders(walletAddress: string | null): UseOpenOrdersReturn;

export declare interface UseOpenOrdersReturn {
    limitOrders: OpenOrder[];
    dcaOrders: DcaOrder[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    cancelOrder: (orderId: string, maker: string) => Promise<{
        transaction: string;
    }>;
}

export declare function usePositions(walletAddress: string | null): UsePositionsReturn;

export declare interface UsePositionsReturn {
    positions: PositionsResponse | null;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export declare function usePrices(useWebSocket?: boolean): UsePricesReturn;

export declare interface UsePricesReturn {
    prices: Record<string, PriceSnapshot>;
    isLoading: boolean;
    error: string | null;
    getPrice: (mint: string) => Promise<PriceSnapshot>;
    subscribe: (mints: string[]) => void;
    unsubscribe: (mints: string[]) => void;
    connectionState: WsState;
}

export declare function useSwap(): UseSwapReturn;

export declare interface UseSwapReturn {
    quote: SwapQuote | null;
    transaction: SwapTransaction | null;
    result: ExecuteResult | null;
    isLoading: boolean;
    error: string | null;
    getQuote: (inputMint: string, outputMint: string, amount: string, slippageBps?: number) => Promise<SwapQuote>;
    buildTransaction: (quote: SwapQuote, userPublicKey: string) => Promise<SwapTransaction>;
    execute: (signedTransaction: string, provider: string, requestId?: string) => Promise<ExecuteResult>;
    compareProviders: (inputMint: string, outputMint: string, amount: string) => Promise<SwapQuote[]>;
    reset: () => void;
}

export declare function useTheme(initialMode?: ThemeMode, overrides?: ThemeOverrides): UseThemeReturn;

export declare interface UseThemeReturn {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
    isDark: boolean;
    className: string;
    style: React.CSSProperties;
}

export declare function useTokens(): UseTokensReturn;

export declare interface UseTokensReturn {
    tokens: TokenRecord[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    getByMint: (mint: string) => TokenRecord | undefined;
    getBySymbol: (symbol: string) => TokenRecord | undefined;
}

export declare function useTradeApi(): TradeApiClient;

export declare function useTradeContext(): TradeContextValue;

export declare function useTransfer(): UseTransferReturn;

export declare interface UseTransferReturn {
    buildResult: TransferBuildResponse | null;
    executeResult: ExecuteResult | null;
    isLoading: boolean;
    error: string | null;
    build: (sender: string, recipient: string, mint: string, amount: string, memo?: string) => Promise<TransferBuildResponse>;
    execute: (signedTransaction: string) => Promise<ExecuteResult>;
    resolveAddress: (address: string) => Promise<{
        input: string;
        resolved: string;
        type: string;
    }>;
    reset: () => void;
}

declare type WsState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

export { }
