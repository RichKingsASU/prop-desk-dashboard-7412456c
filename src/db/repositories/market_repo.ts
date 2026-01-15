export type Quote = {
  symbol: string;
  bid_price?: number | null;
  ask_price?: number | null;
  last_trade_price?: number | null;
  last_update_ts?: string | null;
};

export type NewsEvent = {
  id: string;
  headline: string;
  source?: string | null;
  url?: string | null;
  symbols?: string[] | null;
  received_at: string;
};

export type OptionSnapshot = Record<string, unknown>;

export type Bar1m = {
  symbol: string;
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export async function getQuotes(_symbols: string[]): Promise<Quote[]> {
  // TODO: implement with Postgres schema once finalized.
  return [];
}

export async function listNews(_opts: { symbols?: string[]; limit?: number }): Promise<NewsEvent[]> {
  // TODO: implement with Postgres schema once finalized.
  return [];
}

export async function listOptionsSnapshots(_opts: {
  symbol?: string;
  expiry?: string;
  limit?: number;
}): Promise<OptionSnapshot[]> {
  // TODO: implement with Postgres schema once finalized.
  return [];
}

export async function listBars1m(_opts: {
  symbol: string;
  start?: string;
  end?: string;
  limit?: number;
}): Promise<Bar1m[]> {
  // TODO: implement with Postgres schema once finalized.
  return [];
}

