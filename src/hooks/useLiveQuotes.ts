import { useEffect, useState } from "react";
import { apiFetch } from "@/services/apiClient";

export type LiveQuote = {
  symbol: string;
  bid_price: number | null;
  bid_size?: number | null;
  ask_price: number | null;
  ask_size?: number | null;
  last_trade_price: number | null;
  last_trade_size?: number | null;
  last_update_ts: string | null;
};

export function useLiveQuotes() {
  const [quotes, setQuotes] = useState<LiveQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const resp = await apiFetch<{ quotes: LiveQuote[] }>("/market/quotes");
        if (!isMounted) return;
        setQuotes(Array.isArray(resp.quotes) ? resp.quotes : []);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load live quotes");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  return { quotes, loading, error };
}

