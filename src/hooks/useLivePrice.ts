import { useEffect, useState } from "react";
import { client } from "@/integrations/backend/client";

interface LivePriceData {
  price: number;
  change: number;
  changePct: number;
  isLive: boolean;
}

interface MarketBar {
  symbol: string;
  ts: string;
  open: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
}

function coerceNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function coerceString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function toIso(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v;
  if (typeof v === "number") return new Date(v).toISOString();
  if (v instanceof Date) return v.toISOString();
  return null;
}

function coerceBars1m(raw: unknown, symbolHint?: string): MarketBar[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as any).bars)
    ? (raw as any).bars
    : raw && typeof raw === "object" && Array.isArray((raw as any).data)
    ? (raw as any).data
    : [];

  const mapped: MarketBar[] = arr
    .map((item: any) => {
      const symbol = coerceString(item?.symbol ?? item?.S) ?? symbolHint ?? null;
      const ts = toIso(item?.ts ?? item?.t ?? item?.time ?? item?.timestamp) ?? null;
      if (!symbol || !ts) return null;

      // Alpaca bar fields: o/h/l/c/v
      const open = coerceNumber(item?.open ?? item?.o);
      const high = coerceNumber(item?.high ?? item?.h);
      const low = coerceNumber(item?.low ?? item?.l);
      const close = coerceNumber(item?.close ?? item?.c);
      const volume = coerceNumber(item?.volume ?? item?.v);
      if (open == null || close == null) return null;

      return {
        symbol,
        ts,
        open,
        high: high ?? undefined,
        low: low ?? undefined,
        close,
        volume: volume ?? undefined,
      };
    })
    .filter(Boolean) as MarketBar[];

  return mapped.sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
}

export function useLivePrice(
  symbol: string,
  options?: { pollMs?: number }
): LivePriceData & { loading: boolean } {
  const [priceData, setPriceData] = useState<LivePriceData>({
    price: 0,
    change: 0,
    changePct: 0,
    isLive: false,
  });
  const [loading, setLoading] = useState(true);
  const [openPrice, setOpenPrice] = useState<number | null>(null);

  // Poll bars (1m) for open + latest close.
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const pollMs = Math.max(1000, options?.pollMs ?? 10_000);

    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
      try {
        if (!cancelled) setLoading(true);
        const raw = await client.getMarketBars1m({ symbols: [symbol], limit: 500 });
        const bars = coerceBars1m(raw, symbol);
        if (cancelled) return;

        if (!bars.length) {
          setPriceData((prev) => ({ ...prev, isLive: false }));
          return;
        }

        // Approximate "open" as first bar returned (ideally the session open).
        const sessionOpen = bars[0]?.open ?? null;
        if (sessionOpen != null) setOpenPrice(sessionOpen);

        const latest = bars[bars.length - 1];
        const currentPrice = latest.close;
        const open = sessionOpen ?? currentPrice;
        const change = currentPrice - open;
        const changePct = open > 0 ? (change / open) * 100 : 0;

        setPriceData({
          price: currentPrice,
          change,
          changePct,
          isLive: true,
        });
      } catch (err) {
        if (!cancelled) {
          console.warn("[useLivePrice] Failed to fetch bars:", err);
          setPriceData((prev) => ({ ...prev, isLive: false }));
        }
      } finally {
        inFlight = false;
        if (!cancelled) setLoading(false);
      }
    };

    refresh();
    const id = window.setInterval(refresh, pollMs);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [symbol, options?.pollMs]);

  return { ...priceData, loading };
}
