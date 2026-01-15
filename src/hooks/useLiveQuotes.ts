import { useEffect, useState } from "react";

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

export function useLiveQuotes() {
  const [quotes, setQuotes] = useState<LiveQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase-based market data is disabled; return an empty set.
    setQuotes([]);
    setError("Live quotes are unavailable (no data backend configured).");
    setLoading(false);
  }, []);

  return { quotes, loading, error };
}
