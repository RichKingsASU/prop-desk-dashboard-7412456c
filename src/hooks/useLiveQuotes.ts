import { useEffect, useState } from "react";
import { apiClient, type LiveQuote } from "@/api/client";

export function useLiveQuotes() {
  const [quotes, setQuotes] = useState<LiveQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let intervalId: number | null = null;

    async function load() {
      try {
        if (isMounted) setLoading(true);
        const data = await apiClient.getLiveQuotes("*");
        if (!isMounted) return;
        setQuotes((data || []).slice().sort((a, b) => a.symbol.localeCompare(b.symbol)));
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message ?? "Failed to load live quotes");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    // TODO(realtime): Replace polling with backend WS at VITE_WS_BASE_URL.
    intervalId = window.setInterval(load, 5000);

    return () => {
      isMounted = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, []);

  return { quotes, loading, error };
}
