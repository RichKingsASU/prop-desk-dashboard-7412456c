import { useEffect, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/integrations/supabase/client";

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
    let isMounted = true;

    async function loadInitial() {
      try {
        setLoading(true);
        if (!isSupabaseConfigured()) {
          throw new Error("Supabase is not configured.");
        }

        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from("live_quotes")
          .select("*")
          .order("symbol", { ascending: true });

        if (error) throw error;
        if (!isMounted) return;
        setQuotes((data || []) as LiveQuote[]);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err.message ?? "Failed to load live quotes");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadInitial();

    if (!isSupabaseConfigured()) {
      return () => {
        isMounted = false;
      };
    }

    const supabase = getSupabaseClient();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("live_quotes_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "live_quotes",
        },
        (payload) => {
          const newRow = payload.new as LiveQuote;
          setQuotes((prev) => {
            // Upsert in local state by symbol
            const idx = prev.findIndex((q) => q.symbol === newRow.symbol);
            if (idx === -1) {
              return [...prev, newRow].sort((a, b) => a.symbol.localeCompare(b.symbol));
            }
            const copy = [...prev];
            copy[idx] = newRow;
            return copy;
          });
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { quotes, loading, error };
}
