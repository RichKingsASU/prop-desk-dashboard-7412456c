import { useState, useEffect } from 'react';

interface LivePriceData {
  price: number;
  change: number;
  changePct: number;
  isLive: boolean;
}

export function useLivePrice(symbol: string): LivePriceData & { loading: boolean } {
  const [priceData, setPriceData] = useState<LivePriceData>({
    price: 0,
    change: 0,
    changePct: 0,
    isLive: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No backend configured for live price hydration.
    setPriceData({ price: 0, change: 0, changePct: 0, isLive: false });
    setLoading(false);
  }, [symbol]);

  return { ...priceData, loading };
}
