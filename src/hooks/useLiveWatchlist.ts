import { useEffect, useMemo, useState } from "react";
import { useLiveQuotes } from "./useLiveQuotes";
import { client } from "@/integrations/backend/client";

export interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  status: "hot" | "trending" | "normal";
  sparklineData: number[];
  isLive?: boolean;
}

// Mock data fallback
const mockWatchlist: WatchlistItem[] = [
  { symbol: "SPY", price: 432.15, change: 1.23, changePct: 0.29, volume: 85000000, status: "hot", sparklineData: [430, 431, 430.5, 432, 431.8, 432.15] },
  { symbol: "QQQ", price: 368.50, change: -0.85, changePct: -0.23, volume: 45000000, status: "normal", sparklineData: [369, 368.8, 369.2, 368.5, 368.3, 368.5] },
  { symbol: "AAPL", price: 178.23, change: 2.15, changePct: 1.22, volume: 52000000, status: "trending", sparklineData: [176, 177, 177.5, 178, 178.1, 178.23] },
  { symbol: "TSLA", price: 245.67, change: -3.45, changePct: -1.38, volume: 95000000, status: "hot", sparklineData: [249, 247, 246, 245, 246, 245.67] },
  { symbol: "NVDA", price: 495.30, change: 8.75, changePct: 1.80, volume: 78000000, status: "trending", sparklineData: [487, 490, 492, 494, 495, 495.3] },
  { symbol: "AMD", price: 165.80, change: 1.90, changePct: 1.16, volume: 34000000, status: "normal", sparklineData: [164, 165, 164.5, 165.5, 165.7, 165.8] },
  { symbol: "MSFT", price: 412.45, change: -1.20, changePct: -0.29, volume: 28000000, status: "normal", sparklineData: [413, 412.5, 413, 412.8, 412.3, 412.45] },
];

interface SparklineData {
  [symbol: string]: number[];
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

type MarketBar = { symbol: string; ts: string; close: number };

function coerceBars1m(raw: unknown): MarketBar[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as any).bars)
    ? (raw as any).bars
    : raw && typeof raw === "object" && Array.isArray((raw as any).data)
    ? (raw as any).data
    : [];

  const bars: MarketBar[] = arr
    .map((item: any) => {
      const symbol = coerceString(item?.symbol ?? item?.S) ?? null;
      const ts = toIso(item?.ts ?? item?.t ?? item?.time ?? item?.timestamp) ?? null;
      const close = coerceNumber(item?.close ?? item?.c);
      if (!symbol || !ts || close == null) return null;
      return { symbol, ts, close };
    })
    .filter(Boolean) as MarketBar[];

  return bars;
}

export function useLiveWatchlist(options?: { sparklinePollMs?: number; quotesPollMs?: number }) {
  const { quotes, loading: quotesLoading } = useLiveQuotes({ pollMs: options?.quotesPollMs });
  const [sparklines, setSparklines] = useState<SparklineData>({});
  const [sparklinesLoading, setSparklinesLoading] = useState(false);

  // Fetch sparkline data from 1m bars for symbols in quotes
  useEffect(() => {
    const fetchSparklines = async () => {
      if (quotes.length === 0) return;
      
      setSparklinesLoading(true);
      try {
        const symbols = quotes.map(q => q.symbol);
        
        // Ask for a bit more than needed; we'll slice client-side.
        const raw = await client.getMarketBars1m({ symbols, limit: symbols.length * 20 });
        const bars = coerceBars1m(raw);

        // Group by symbol and take last 6 closes (by timestamp desc)
        const grouped: SparklineData = {};
        symbols.forEach(sym => {
          const symbolBars = bars
            .filter((b) => b.symbol === sym)
            .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
            .slice(0, 6)
            .reverse();
          grouped[sym] = symbolBars.map((b) => b.close);
        });

        setSparklines(grouped);
      } catch (err) {
        console.error('Error fetching sparklines:', err);
      } finally {
        setSparklinesLoading(false);
      }
    };

    fetchSparklines();
    
    // Refresh sparklines (bars) every 5-15s (configurable)
    const pollMs = Math.max(1000, options?.sparklinePollMs ?? 10_000);
    const interval = setInterval(fetchSparklines, pollMs);
    return () => clearInterval(interval);
  }, [quotes, options?.sparklinePollMs]);

  // Build watchlist items from live quotes
  const watchlist = useMemo((): WatchlistItem[] => {
    if (quotes.length === 0) {
      // Return mock data when no live quotes
      return mockWatchlist;
    }

    return quotes.map(quote => {
      const sparklineData = sparklines[quote.symbol] || [];
      const openPrice = sparklineData.length > 0 ? sparklineData[0] : quote.last_trade_price || 0;
      const currentPrice = quote.last_trade_price || quote.bid_price || 0;
      const change = currentPrice - openPrice;
      const changePct = openPrice > 0 ? (change / openPrice) * 100 : 0;

      // Determine status based on change percentage
      let status: "hot" | "trending" | "normal" = "normal";
      if (Math.abs(changePct) >= 2) status = "hot";
      else if (Math.abs(changePct) >= 1) status = "trending";

      return {
        symbol: quote.symbol,
        price: currentPrice,
        change,
        changePct,
        volume: 0, // Not available in live_quotes
        status,
        sparklineData: sparklineData.length > 0 ? sparklineData : [currentPrice],
        isLive: true,
      };
    });
  }, [quotes, sparklines]);

  const isLive = quotes.length > 0;
  const loading = quotesLoading || sparklinesLoading;

  return { watchlist, loading, isLive };
}
