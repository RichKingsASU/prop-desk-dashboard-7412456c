import { useState, useEffect } from "react";
import { apiFetch } from "@/services/apiClient";

interface LivePriceData {
  price: number;
  change: number;
  changePct: number;
  isLive: boolean;
}

type QuoteResp = {
  quotes: Array<{
    symbol: string;
    bid_price?: number | null;
    ask_price?: number | null;
    last_trade_price?: number | null;
    last_update_ts?: string | null;
  }>;
};

export function useLivePrice(symbol: string): LivePriceData & { loading: boolean } {
  const [priceData, setPriceData] = useState<LivePriceData>({
    price: 0,
    change: 0,
    changePct: 0,
    isLive: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const resp = await apiFetch<QuoteResp>(`/market/quotes?symbols=${encodeURIComponent(symbol)}`);
        const q = resp.quotes?.[0];
        const currentPrice = q?.last_trade_price ?? q?.bid_price ?? 0;
        const open = currentPrice;
        const change = currentPrice - open;
        const changePct = open > 0 ? (change / open) * 100 : 0;

        if (!isMounted) return;
        setPriceData({
          price: currentPrice,
          change,
          changePct,
          isLive: Boolean(q?.last_update_ts),
        });
      } catch {
        if (!isMounted) return;
        setPriceData({ price: 0, change: 0, changePct: 0, isLive: false });
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [symbol]);

  return { ...priceData, loading };
}

