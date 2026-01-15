import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/api/client';

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

export function useOptionsSnapshots(initialFilters?: Partial<SnapshotFilters>) {
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

      const data = await apiClient.getAlpacaOptionSnapshots({
        limit: 500,
        underlying_symbol: filters.symbol,
        since: timeWindowStart.toISOString(),
        option_type: filters.optionType !== 'all' ? filters.optionType : undefined,
        strike_min: filters.strikeMin ?? undefined,
        strike_max: filters.strikeMax ?? undefined,
        expiration: filters.expiration ?? undefined,
      });

      // Client-side filtering for JSONB fields
      let filtered = (data || []) as OptionSnapshot[];

      // If backend doesn't support JSONB-level filtering, keep these as a safety net.
      if (filters.optionType !== 'all') filtered = filtered.filter(s => s.payload?.option_type === filters.optionType);
      if (filters.strikeMin !== null) filtered = filtered.filter(s => (s.payload?.strike || 0) >= filters.strikeMin!);
      if (filters.strikeMax !== null) filtered = filtered.filter(s => (s.payload?.strike || 0) <= filters.strikeMax!);
      if (filters.expiration) filtered = filtered.filter(s => s.payload?.expiration === filters.expiration);

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
    fetchSnapshots();
  }, [filters]);

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
