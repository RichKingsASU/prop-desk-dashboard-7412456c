import { supabase } from "@/integrations/supabase/client";

export type TradesGetParams = {
  limit?: number;
};

/**
 * Raw trade shape returned by the backend.
 * Keep this flexible — components may map/normalize as needed.
 */
export type TradeApi = {
  id: string | number;
  created_at?: string | null;
  root_symbol?: string | null;
  side?: string | null;
  strike?: number | null;
  option_type?: string | null;
  expiry?: string | null;
  price?: number | null;
  delta?: number | null;
  [k: string]: unknown;
};

export const client = {
  getTrades: async (params: TradesGetParams = {}): Promise<TradeApi[]> => {
    const { limit = 50 } = params;

    const { data, error } = await supabase
      .from("trades")
      .select("id, created_at, root_symbol, side, strike, option_type, expiry, price, delta")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as unknown as TradeApi[];
  },
};

