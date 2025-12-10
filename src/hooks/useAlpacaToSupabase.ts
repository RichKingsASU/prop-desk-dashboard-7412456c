import { useEffect, useRef, useState } from "react";
import { alpacaWs, AlpacaMessage, AlpacaTrade, AlpacaQuote } from "@/services/AlpacaWebSocket";
import { supabase } from "@/integrations/supabase/client";

interface UseAlpacaToSupabaseOptions {
  enabled: boolean;
  batchIntervalMs?: number;
}

interface PersistStats {
  upsertsTotal: number;
  errorsTotal: number;
  lastError: string | null;
  isPersisting: boolean;
}

export function useAlpacaToSupabase({ 
  enabled, 
  batchIntervalMs = 500 
}: UseAlpacaToSupabaseOptions) {
  const [stats, setStats] = useState<PersistStats>({
    upsertsTotal: 0,
    errorsTotal: 0,
    lastError: null,
    isPersisting: false,
  });

  // Batch buffer: symbol -> partial quote data
  const batchBuffer = useRef<Map<string, Partial<{
    symbol: string;
    bid_price: number | null;
    bid_size: number | null;
    ask_price: number | null;
    ask_size: number | null;
    last_trade_price: number | null;
    last_trade_size: number | null;
    last_update_ts: string;
  }>>>(new Map());

  useEffect(() => {
    if (!enabled) {
      batchBuffer.current.clear();
      return;
    }

    // Listen to Alpaca messages
    const unsubMessage = alpacaWs.onMessage((message: AlpacaMessage) => {
      const symbol = message.S;
      const existing = batchBuffer.current.get(symbol) || { symbol };

      if (message.T === 't') {
        // Trade message
        const trade = message as AlpacaTrade;
        batchBuffer.current.set(symbol, {
          ...existing,
          symbol,
          last_trade_price: trade.p,
          last_trade_size: trade.s,
          last_update_ts: new Date().toISOString(),
        });
      } else if (message.T === 'q') {
        // Quote message
        const quote = message as AlpacaQuote;
        batchBuffer.current.set(symbol, {
          ...existing,
          symbol,
          bid_price: quote.bp,
          bid_size: quote.bs,
          ask_price: quote.ap,
          ask_size: quote.as,
          last_update_ts: new Date().toISOString(),
        });
      }
    });

    // Flush buffer to Supabase periodically
    const flushInterval = setInterval(async () => {
      if (batchBuffer.current.size === 0) return;

      // Copy and clear buffer
      const items = Array.from(batchBuffer.current.values());
      batchBuffer.current.clear();

      setStats(s => ({ ...s, isPersisting: true }));

      try {
        // Upsert batch to live_quotes (conflict on symbol primary key)
        const { error } = await supabase
          .from("live_quotes")
          .upsert(
            items.map(item => ({
              symbol: item.symbol!,
              bid_price: item.bid_price ?? null,
              bid_size: item.bid_size ?? null,
              ask_price: item.ask_price ?? null,
              ask_size: item.ask_size ?? null,
              last_trade_price: item.last_trade_price ?? null,
              last_trade_size: item.last_trade_size ?? null,
              last_update_ts: item.last_update_ts ?? new Date().toISOString(),
            })),
            { onConflict: "symbol" }
          );

        if (error) throw error;

        setStats(s => ({
          ...s,
          upsertsTotal: s.upsertsTotal + items.length,
          isPersisting: false,
          lastError: null,
        }));
      } catch (err: any) {
        console.error("[AlpacaToSupabase] Upsert error:", err);
        setStats(s => ({
          ...s,
          errorsTotal: s.errorsTotal + 1,
          isPersisting: false,
          lastError: err.message ?? "Upsert failed",
        }));
      }
    }, batchIntervalMs);

    return () => {
      unsubMessage();
      clearInterval(flushInterval);
      batchBuffer.current.clear();
    };
  }, [enabled, batchIntervalMs]);

  return stats;
}
