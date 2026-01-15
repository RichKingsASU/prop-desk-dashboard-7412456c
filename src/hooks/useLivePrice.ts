import { useState, useEffect } from 'react';
import { apiClient, type LiveQuote, type MarketBar1m } from '@/api/client';

interface LivePriceData {
  price: number;
  change: number;
  changePct: number;
  isLive: boolean;
}

interface MarketBar {
  open: number;
  close: number;
  ts: string;
}

export function useLivePrice(symbol: string): LivePriceData & { loading: boolean } {
  const [priceData, setPriceData] = useState<LivePriceData>({
    price: 0,
    change: 0,
    changePct: 0,
    isLive: false,
  });
  const [loading, setLoading] = useState(true);
  const [openPrice, setOpenPrice] = useState<number | null>(null);

  // Fetch today's open price from market_data_1m
  useEffect(() => {
    const fetchOpenPrice = async () => {
      try {
        // TODO(api): Provide a dedicated "day open" endpoint to avoid pulling a window of bars.
        const bars = (await apiClient.getMarketData1mLatest({ symbol, limit: 200 })) as MarketBar1m[];
        const sorted = [...bars].sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime());
        const oldest = sorted[0];
        if (oldest) setOpenPrice(oldest.open);
      } catch (err) {
        console.error('Error fetching open price:', err);
      }
    };

    fetchOpenPrice();
  }, [symbol]);

  // Subscribe to real-time quote updates
  useEffect(() => {
    let isMounted = true;
    let intervalId: number | null = null;

    const loadQuote = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const quotes = (await apiClient.getLiveQuotes([symbol])) as LiveQuote[];
        const q = quotes[0];
        if (q) {
          const currentPrice = q.last_trade_price || q.bid_price || 0;
          const open = openPrice || currentPrice;
          const change = currentPrice - open;
          const changePct = open > 0 ? (change / open) * 100 : 0;

          setPriceData({
            price: currentPrice,
            change,
            changePct,
            isLive: true,
          });
        }
      } catch (err) {
        console.error('Error fetching quote:', err);
      } finally {
        setLoading(false);
      }
    };

    loadQuote();

    // TODO(realtime): Replace polling with backend WS at VITE_WS_BASE_URL.
    intervalId = window.setInterval(loadQuote, 3000);

    return () => {
      isMounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [symbol, openPrice]);

  return { ...priceData, loading };
}
