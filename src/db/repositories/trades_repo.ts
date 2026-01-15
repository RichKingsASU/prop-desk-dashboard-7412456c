export type Trade = {
  id: string;
  uid: string;
  created_at: string;
  symbol: string;
  side: "buy" | "sell";
  qty: number;
  price?: number | null;
  status?: string | null;
  source?: string | null;
};

export type Position = {
  symbol: string;
  qty: number;
  avg_price?: number | null;
  market_value?: number | null;
  unrealized_pnl?: number | null;
};

export async function listTradesByUid(_uid: string): Promise<Trade[]> {
  // TODO: implement with Postgres schema once finalized.
  return [];
}

export async function createTrade(_trade: Omit<Trade, "id" | "created_at">): Promise<Trade> {
  // TODO: implement with Postgres schema once finalized.
  const now = new Date().toISOString();
  return { ..._trade, id: "00000000-0000-0000-0000-000000000000", created_at: now };
}

export async function listPositionsByUid(_uid: string): Promise<Position[]> {
  // TODO: implement with Postgres schema once finalized.
  return [];
}

