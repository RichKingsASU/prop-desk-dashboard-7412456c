import { useState, useEffect, useMemo } from 'react';
import { useLiveQuotes } from './useLiveQuotes';

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

interface SparklineData {
  [symbol: string]: number[];
}

export function useLiveWatchlist() {
  const { quotes, loading: quotesLoading } = useLiveQuotes();
  const [sparklines, setSparklines] = useState<SparklineData>({});
  const [sparklinesLoading, setSparklinesLoading] = useState(false);

  useEffect(() => {
    setSparklines({});
    setSparklinesLoading(false);
  }, [quotes]);

  // Build watchlist items from live quotes
  const watchlist = useMemo((): WatchlistItem[] => {
    if (quotes.length === 0) {
      return [];
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
