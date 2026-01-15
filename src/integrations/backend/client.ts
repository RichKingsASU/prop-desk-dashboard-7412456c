type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface BackendClientOptions {
  /**
   * Base URL for the backend API.
   * - If empty/undefined, requests are made relative to the current origin.
   */
  baseUrl?: string;
  /**
   * Request timeout in milliseconds.
   */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

function toSearchParams(params: Record<string, unknown> | undefined) {
  const qs = new URLSearchParams();
  if (!params) return qs;
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      // Common backend convention: symbols=a&symbols=b (or comma-separated elsewhere)
      for (const item of v) {
        if (item == null) continue;
        qs.append(k, String(item));
      }
      continue;
    }
    qs.set(k, String(v));
  }
  return qs;
}

function normalizeBaseUrl(baseUrl?: string) {
  const raw = (baseUrl ?? "").trim();
  if (!raw) return "";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

async function requestJson(
  url: string,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });

    // Some endpoints may return empty bodies (e.g. 204).
    const text = await res.text().catch(() => "");
    const data = text ? (JSON.parse(text) as JsonValue) : null;
    return { ok: res.ok, status: res.status, data };
  } finally {
    window.clearTimeout(t);
  }
}

async function tryPathsJson(
  baseUrl: string,
  paths: string[],
  init?: RequestInit,
  timeoutMs?: number
): Promise<unknown> {
  let lastNon404: { status: number; data: unknown } | null = null;

  for (const p of paths) {
    const url = `${baseUrl}${p.startsWith("/") ? p : `/${p}`}`;
    const res = await requestJson(url, init, timeoutMs ?? DEFAULT_TIMEOUT_MS);

    if (res.ok) return res.data;
    if (res.status === 404) continue;

    lastNon404 = { status: res.status, data: res.data };
  }

  if (lastNon404) {
    throw new Error(`Backend request failed (HTTP ${lastNon404.status})`);
  }
  throw new Error("Backend endpoint not found (tried multiple paths)");
}

export function createBackendClient(options?: BackendClientOptions) {
  const baseUrl = normalizeBaseUrl(options?.baseUrl ?? import.meta.env.VITE_BACKEND_URL);
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return {
    /**
     * Market quotes (L1).
     * Shape varies by backend; caller should normalize.
     */
    async getMarketQuotes(params?: { symbols?: string[]; limit?: number }): Promise<unknown> {
      const qs = toSearchParams({
        symbols: params?.symbols,
        symbol: params?.symbols?.length === 1 ? params.symbols[0] : undefined, // common alt
        limit: params?.limit,
      }).toString();
      const suffix = qs ? `?${qs}` : "";

      return await tryPathsJson(
        baseUrl,
        [
          `/market/quotes${suffix}`,
          `/api/market/quotes${suffix}`,
          `/market/quotes/latest${suffix}`,
          `/market-data/quotes${suffix}`,
          `/quotes${suffix}`,
          `/api/quotes${suffix}`,
        ],
        undefined,
        timeoutMs
      );
    },

    /**
     * Market news/events.
     * Shape varies by backend; caller should normalize.
     */
    async getMarketNews(params?: { symbol?: string; source?: string; limit?: number }): Promise<unknown> {
      const qs = toSearchParams({
        symbol: params?.symbol,
        symbols: params?.symbol ? [params.symbol] : undefined,
        source: params?.source,
        limit: params?.limit,
      }).toString();
      const suffix = qs ? `?${qs}` : "";

      return await tryPathsJson(
        baseUrl,
        [
          `/market/news${suffix}`,
          `/api/market/news${suffix}`,
          `/market/news/latest${suffix}`,
          `/news${suffix}`,
          `/api/news${suffix}`,
          `/market-data/news${suffix}`,
        ],
        undefined,
        timeoutMs
      );
    },

    /**
     * 1-minute bars.
     * Shape varies by backend; caller should normalize.
     */
    async getMarketBars1m(params?: {
      symbols?: string[];
      limit?: number;
      start?: string;
      end?: string;
    }): Promise<unknown> {
      const qs = toSearchParams({
        symbols: params?.symbols,
        symbol: params?.symbols?.length === 1 ? params.symbols[0] : undefined,
        limit: params?.limit,
        start: params?.start,
        end: params?.end,
        timeframe: "1Min",
        tf: "1m",
      }).toString();
      const suffix = qs ? `?${qs}` : "";

      return await tryPathsJson(
        baseUrl,
        [
          `/market/bars/1m${suffix}`,
          `/api/market/bars/1m${suffix}`,
          `/market/bars${suffix}`,
          `/api/market/bars${suffix}`,
          `/bars/1m${suffix}`,
          `/api/bars/1m${suffix}`,
          `/market-data/bars/1m${suffix}`,
        ],
        undefined,
        timeoutMs
      );
    },

    /**
     * Options snapshots.
     * Shape varies by backend; caller should normalize.
     */
    async getOptionsSnapshots(params?: {
      symbol?: string;
      limit?: number;
      start?: string;
      end?: string;
    }): Promise<unknown> {
      const qs = toSearchParams({
        symbol: params?.symbol,
        underlying: params?.symbol,
        underlying_symbol: params?.symbol,
        limit: params?.limit,
        start: params?.start,
        end: params?.end,
      }).toString();
      const suffix = qs ? `?${qs}` : "";

      return await tryPathsJson(
        baseUrl,
        [
          `/options/snapshots${suffix}`,
          `/api/options/snapshots${suffix}`,
          `/market/options/snapshots${suffix}`,
          `/api/market/options/snapshots${suffix}`,
          `/options_snapshots${suffix}`,
          `/api/options_snapshots${suffix}`,
        ],
        undefined,
        timeoutMs
      );
    },

    /**
     * System state/status for Mission Control.
     * Tries a few common endpoints; the first that exists wins.
     */
    async getSystemStatus(): Promise<unknown> {
      return await tryPathsJson(baseUrl, ["/system/status", "/system/state", "/system"], undefined, timeoutMs);
    },

    /**
     * System logs for Mission Control.
     * The backend shape varies; caller should normalize.
     */
    async getSystemLogs(params?: { limit?: number; since?: string }): Promise<unknown> {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set("limit", String(params.limit));
      if (params?.since) qs.set("since", params.since);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";

      return await tryPathsJson(
        baseUrl,
        [`/system/logs${suffix}`, `/logs/system${suffix}`, `/logs${suffix}`],
        undefined,
        timeoutMs
      );
    },

    /**
     * Dev logs endpoint (some backends split "dev" vs "system" logs).
     */
    async getDevLogs(params?: { limit?: number; since?: string }): Promise<unknown> {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set("limit", String(params.limit));
      if (params?.since) qs.set("since", params.since);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";

      return await tryPathsJson(baseUrl, [`/dev/logs${suffix}`, `/logs/dev${suffix}`], undefined, timeoutMs);
    },

    /**
     * Send a system command to the backend.
     * Returns backend response JSON if available.
     */
    async postSystemCommand(command: "START" | "STOP"): Promise<unknown> {
      return await tryPathsJson(
        baseUrl,
        ["/system/commands"],
        { method: "POST", body: JSON.stringify({ command }) },
        timeoutMs
      );
    },
  };
}

export const client = createBackendClient();

