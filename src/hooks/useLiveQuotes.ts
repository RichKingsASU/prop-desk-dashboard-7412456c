import { useEffect, useState } from "react";
import { client } from "@/integrations/backend/client";

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

function coerceNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function coerceString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function coerceLiveQuotes(raw: unknown): LiveQuote[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as any).quotes)
    ? (raw as any).quotes
    : raw && typeof raw === "object" && Array.isArray((raw as any).data)
    ? (raw as any).data
    : raw && typeof raw === "object" && typeof (raw as any).quotes === "object"
    ? // Some backends return a map keyed by symbol.
      Object.entries((raw as any).quotes).map(([symbol, q]) => ({ symbol, ...(q as any) }))
    : raw && typeof raw === "object" && typeof (raw as any).data === "object"
    ? Object.entries((raw as any).data).map(([symbol, q]) => ({ symbol, ...(q as any) }))
    : [];

  const nowIso = new Date().toISOString();
  const normalized: LiveQuote[] = arr
    .map((item: any) => {
      const symbol = coerceString(item?.symbol ?? item?.S ?? item?.ticker) ?? null;
      if (!symbol) return null;

      const tsRaw = item?.last_update_ts ?? item?.timestamp ?? item?.t ?? item?.time ?? item?.updated_at ?? null;
      const ts =
        typeof tsRaw === "string"
          ? tsRaw
          : typeof tsRaw === "number"
          ? new Date(tsRaw).toISOString()
          : tsRaw instanceof Date
          ? tsRaw.toISOString()
          : nowIso;

      // Accept common key variants:
      // - bid: bid_price | bidPrice | bp
      // - ask: ask_price | askPrice | ap
      // - last: last_trade_price | last | price | p
      return {
        symbol,
        bid_price: coerceNumber(item?.bid_price ?? item?.bidPrice ?? item?.bp ?? item?.bid),
        bid_size: coerceNumber(item?.bid_size ?? item?.bidSize ?? item?.bs),
        ask_price: coerceNumber(item?.ask_price ?? item?.askPrice ?? item?.ap ?? item?.ask),
        ask_size: coerceNumber(item?.ask_size ?? item?.askSize ?? item?.as),
        last_trade_price: coerceNumber(item?.last_trade_price ?? item?.last ?? item?.price ?? item?.p),
        last_trade_size: coerceNumber(item?.last_trade_size ?? item?.lastSize ?? item?.s),
        last_update_ts: ts,
      };
    })
    .filter(Boolean) as LiveQuote[];

  return normalized.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export function useLiveQuotes(options?: { pollMs?: number; symbols?: string[]; limit?: number }) {
  const [quotes, setQuotes] = useState<LiveQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const pollMs = Math.max(250, options?.pollMs ?? 1500);

    async function refresh() {
      if (inFlight) return;
      inFlight = true;
      try {
        if (!cancelled) setLoading(true);
        const raw = await client.getMarketQuotes({ symbols: options?.symbols, limit: options?.limit });
        if (cancelled) return;
        setQuotes(coerceLiveQuotes(raw));
        setError(null);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message ?? "Failed to load live quotes");
      } finally {
        inFlight = false;
        if (!cancelled) setLoading(false);
      }
    }

    refresh();
    const id = window.setInterval(refresh, pollMs);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [options?.pollMs, options?.symbols, options?.limit]);

  return { quotes, loading, error };
}
