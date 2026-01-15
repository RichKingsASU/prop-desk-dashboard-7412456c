import { apiFetch } from "@/api/http";

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  trading_mode: string | null;
};

export type DevEventLogIngest = {
  source: string;
  level: "info" | "warn" | "error" | "debug";
  event_type: string;
  message: string;
  meta?: Record<string, unknown>;
};

export type LiveQuote = {
  symbol: string;
  bid_price: number | null;
  bid_size: number | null;
  ask_price: number | null;
  ask_size: number | null;
  last_trade_price: number | null;
  last_trade_size: number | null;
  last_update_ts: string;
};

export type MarketBar1m = {
  symbol: string;
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type PaperTrade = {
  created_at: string;
  symbol: string;
  side: string;
  qty: number;
  price: number;
  status: string | null;
  source: string | null;
};

export const apiClient = {
  // Health
  healthz: async (): Promise<{ ok: boolean }> => {
    return await apiFetch("/healthz", { method: "GET" }, { requireAuth: false });
  },

  // Identity
  me: async (): Promise<{ uid: string; email: string | null }> => {
    return await apiFetch("/me");
  },

  // Profile
  getProfileMe: async (): Promise<Profile> => {
    return await apiFetch("/profiles/me");
  },
  patchProfileMe: async (patch: Partial<Pick<Profile, "display_name" | "avatar_url" | "trading_mode">>): Promise<Profile> => {
    return await apiFetch("/profiles/me", { method: "PATCH", body: JSON.stringify(patch) });
  },

  // Dev event logs
  postDevEventLogs: async (logs: DevEventLogIngest[]): Promise<void> => {
    await apiFetch("/dev-event-logs", { method: "POST", body: JSON.stringify({ logs }) });
  },

  // Trading / Market data
  getPaperTrades: async (limit = 50): Promise<PaperTrade[]> => {
    return await apiFetch(`/paper-trades${qs({ limit })}`);
  },

  getMarketData1mLatest: async (params: { limit?: number; symbol?: string; symbols?: string[] } = {}): Promise<MarketBar1m[]> => {
    const { limit = 200, symbol, symbols } = params;
    return await apiFetch(
      `/market-data/1m/latest${qs({
        limit,
        symbol,
        symbols: symbols && symbols.length > 0 ? symbols.join(",") : undefined,
      })}`
    );
  },

  getLiveQuotes: async (symbols: string[] | "*" , params: { limit?: number } = {}): Promise<LiveQuote[]> => {
    const { limit } = params;
    const symbolsParam = symbols === "*" ? "*" : symbols.join(",");
    return await apiFetch(`/live-quotes${qs({ symbols: symbolsParam, limit })}`);
  },

  getNewsEvents: async (params: { limit?: number; source?: string | null; symbol?: string | null } = {}): Promise<unknown[]> => {
    const { limit = 100, source, symbol } = params;
    return await apiFetch(`/news-events${qs({ limit, source: source ?? undefined, symbol: symbol ?? undefined })}`);
  },

  getOptionsFlow: async (limit = 100): Promise<unknown[]> => {
    return await apiFetch(`/options-flow${qs({ limit })}`);
  },

  getAlpacaOptionSnapshots: async (
    params: {
      limit?: number;
      underlying_symbol?: string;
      since?: string;
      option_type?: string;
      strike_min?: number;
      strike_max?: number;
      expiration?: string;
    } = {}
  ): Promise<unknown[]> => {
    const { limit = 500, ...rest } = params;
    return await apiFetch(`/alpaca-option-snapshots${qs({ limit, ...rest })}`);
  },

  // Brokerage / System
  getBrokerAccounts: async (): Promise<unknown[]> => {
    return await apiFetch("/broker-accounts");
  },

  getSystemState: async (): Promise<unknown> => {
    return await apiFetch("/system/state");
  },

  getSystemLogs: async (limit = 200): Promise<unknown[]> => {
    return await apiFetch(`/system/logs${qs({ limit })}`);
  },

  postSystemCommand: async (command: string, args?: Record<string, unknown>): Promise<void> => {
    await apiFetch("/system/commands", { method: "POST", body: JSON.stringify({ command, args }) });
  },

  // Trades / Portfolio
  getTradesRecent: async (limit = 50): Promise<unknown[]> => {
    return await apiFetch(`/trades/recent${qs({ limit })}`);
  },

  getPortfolioPerformance: async (): Promise<unknown[]> => {
    return await apiFetch("/portfolio/performance");
  },
};

