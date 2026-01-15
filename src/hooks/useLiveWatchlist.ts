import { useMemo } from "react";
import { useLiveQuotes } from "./useLiveQuotes";

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

export function useLiveWatchlist() {
  const { quotes, loading } = useLiveQuotes();

  const watchlist = useMemo((): WatchlistItem[] => {
    if (quotes.length === 0) return [];

    return quotes.map((quote) => {
      const openPrice = quote.last_trade_price || quote.bid_price || 0;
      const currentPrice = quote.last_trade_price || quote.bid_price || 0;
      const change = currentPrice - openPrice;
      const changePct = openPrice > 0 ? (change / openPrice) * 100 : 0;

      let status: "hot" | "trending" | "normal" = "normal";
      if (Math.abs(changePct) >= 2) status = "hot";
      else if (Math.abs(changePct) >= 1) status = "trending";

      return {
        symbol: quote.symbol,
        price: currentPrice,
        change,
        changePct,
        volume: 0,
        status,
        sparklineData: [],
        isLive: true,
      };
    });
  }, [quotes]);

  return { watchlist, loading, isLive: quotes.length > 0 };
}

