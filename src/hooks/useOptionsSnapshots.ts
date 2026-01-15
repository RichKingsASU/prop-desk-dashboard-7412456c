import { useMemo, useState, useEffect } from "react";
import { client } from "@/integrations/backend/client";

export interface OptionSnapshot {
  option_symbol: string;
  underlying_symbol: string;
  snapshot_time: string;
  inserted_at: string;
  payload: {
    strike?: number;
    expiration?: string;
    option_type?: 'call' | 'put';
    bid?: number;
    ask?: number;
    last?: number;
    volume?: number;
    open_interest?: number;
    iv?: number;
    delta?: number;
    gamma?: number;
    theta?: number;
    vega?: number;
    [key: string]: unknown;
  };
}

export interface SnapshotFilters {
  symbol: string;
  optionType: 'all' | 'call' | 'put';
  strikeMin: number | null;
  strikeMax: number | null;
  expiration: string | null;
  timeWindowMinutes: number;
}

const DEFAULT_FILTERS: SnapshotFilters = {
  symbol: 'SPY',
  optionType: 'all',
  strikeMin: null,
  strikeMax: null,
  expiration: null,
  timeWindowMinutes: 60,
};

function coerceString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function toIso(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v;
  if (typeof v === "number") return new Date(v).toISOString();
  if (v instanceof Date) return v.toISOString();
  return null;
}

function coerceOptionsSnapshots(raw: unknown): OptionSnapshot[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as any).snapshots)
    ? (raw as any).snapshots
    : raw && typeof raw === "object" && Array.isArray((raw as any).data)
    ? (raw as any).data
    : [];

  const now = new Date().toISOString();
  const normalized: OptionSnapshot[] = arr
    .map((item: any, idx: number) => {
      const optionSymbol = coerceString(item?.option_symbol ?? item?.symbol ?? item?.optionSymbol ?? item?.contract) ?? null;
      const underlying = coerceString(item?.underlying_symbol ?? item?.underlying ?? item?.underlyingSymbol) ?? null;
      const snapshotTime = toIso(item?.snapshot_time ?? item?.snapshotTime ?? item?.time ?? item?.t) ?? now;
      const insertedAt = toIso(item?.inserted_at ?? item?.insertedAt ?? item?.received_at ?? item?.receivedAt) ?? snapshotTime;

      const payload =
        item?.payload && typeof item.payload === "object"
          ? item.payload
          : // Many providers return the snapshot details at top-level; preserve them under payload.
            Object.fromEntries(
              Object.entries(item ?? {}).filter(([k]) => !["option_symbol", "underlying_symbol", "snapshot_time", "inserted_at"].includes(k))
            );

      if (!optionSymbol || !underlying) return null;

      return {
        option_symbol: optionSymbol,
        underlying_symbol: underlying,
        snapshot_time: snapshotTime,
        inserted_at: insertedAt,
        payload: payload as any,
      };
    })
    .filter(Boolean) as OptionSnapshot[];

  return normalized.sort((a, b) => new Date(b.snapshot_time).getTime() - new Date(a.snapshot_time).getTime());
}

export function useOptionsSnapshots(
  initialFilters?: Partial<SnapshotFilters>,
  options?: { pollMs?: number }
) {
  const [filters, setFilters] = useState<SnapshotFilters>({ ...DEFAULT_FILTERS, ...initialFilters });
  const [snapshots, setSnapshots] = useState<OptionSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchSnapshots = async () => {
    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const timeWindowStart = new Date(now.getTime() - filters.timeWindowMinutes * 60 * 1000);

      const raw = await client.getOptionsSnapshots({
        symbol: filters.symbol,
        // Fetch a reasonable page and do client-side filtering.
        // Backend implementations vary; if it supports more filters it can use query params above.
        limit: 500,
        start: timeWindowStart.toISOString(),
        end: now.toISOString(),
      });

      let filtered = coerceOptionsSnapshots(raw);
      filtered = filtered.filter((s) => s.underlying_symbol === filters.symbol);

      // Client-side filtering for JSON/payload fields
      filtered = filtered.filter((s) => {
        const t = toIso(s.snapshot_time);
        return t ? new Date(t).getTime() >= timeWindowStart.getTime() : true;
      });

      if (filters.optionType !== 'all') {
        filtered = filtered.filter(s => s.payload?.option_type === filters.optionType);
      }

      if (filters.strikeMin !== null) {
        filtered = filtered.filter(s => (s.payload?.strike || 0) >= filters.strikeMin!);
      }

      if (filters.strikeMax !== null) {
        filtered = filtered.filter(s => (s.payload?.strike || 0) <= filters.strikeMax!);
      }

      if (filters.expiration) {
        filtered = filtered.filter(s => s.payload?.expiration === filters.expiration);
      }

      setSnapshots(filtered);
      setTotalCount(filtered.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch snapshots');
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const pollMs = Math.max(1000, options?.pollMs ?? 20_000);

    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        await fetchSnapshots();
      } finally {
        inFlight = false;
      }
    };

    refresh();
    const id = window.setInterval(() => {
      if (!cancelled) refresh();
    }, pollMs);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [filters, options?.pollMs]);

  const updateFilters = (newFilters: Partial<SnapshotFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // Get unique expirations from current data
  const availableExpirations = useMemo(() => {
    const exps = new Set<string>();
    snapshots.forEach(s => {
      if (s.payload?.expiration) exps.add(s.payload.expiration);
    });
    return Array.from(exps).sort();
  }, [snapshots]);

  return {
    snapshots,
    filters,
    updateFilters,
    loading,
    error,
    totalCount,
    availableExpirations,
    refresh: fetchSnapshots
  };
}
