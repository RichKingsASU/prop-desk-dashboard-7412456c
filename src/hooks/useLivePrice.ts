import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
        const { data, error } = await supabase
          .from('market_data_1m')
          .select('open, ts')
          .eq('symbol', symbol)
          .order('ts', { ascending: true })
          .limit(1);

        if (!error && data && data.length > 0) {
          setOpenPrice(data[0].open);
        }
      } catch (err) {
        console.error('Error fetching open price:', err);
      }
    };

    fetchOpenPrice();
  }, [symbol]);

  // Subscribe to real-time quote updates
  useEffect(() => {
    const fetchInitialQuote = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('live_quotes')
          .select('*')
          .eq('symbol', symbol)
          .maybeSingle();

        if (!error && data) {
          const currentPrice = data.last_trade_price || data.bid_price || 0;
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

    fetchInitialQuote();

    // Real-time subscription
    const channel = supabase
      .channel(`live-price-${symbol}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_quotes',
          filter: `symbol=eq.${symbol}`,
        },
        (payload) => {
          const data = payload.new as any;
          if (data) {
            const currentPrice = data.last_trade_price || data.bid_price || 0;
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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [symbol, openPrice]);

  return { ...priceData, loading };
}
