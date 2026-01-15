import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/services/apiClient";

export interface OptionSnapshot {
  option_symbol: string;
  underlying_symbol: string;
  snapshot_time: string;
  inserted_at: string;
  payload: Record<string, unknown>;
}

export interface SnapshotFilters {
  symbol: string;
  optionType: "all" | "call" | "put";
  strikeMin: number | null;
  strikeMax: number | null;
  expiration: string | null;
  timeWindowMinutes: number;
}

const DEFAULT_FILTERS: SnapshotFilters = {
  symbol: "SPY",
  optionType: "all",
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
      const params = new URLSearchParams();
      params.set("symbol", filters.symbol);
      if (filters.expiration) params.set("expiry", filters.expiration);
      const resp = await apiFetch<{ snapshots: OptionSnapshot[] }>(`/market/options/snapshots?${params.toString()}`);
      const data = Array.isArray(resp.snapshots) ? resp.snapshots : [];

      // Client-side filtering (API stubs may not filter yet).
      const filtered = data.filter((s) => {
        const p = s.payload || {};
        const optionType = (p as any).option_type as string | undefined;
        const strike = typeof (p as any).strike === "number" ? ((p as any).strike as number) : null;
        const expiration = typeof (p as any).expiration === "string" ? ((p as any).expiration as string) : null;

        if (filters.optionType !== "all" && optionType !== filters.optionType) return false;
        if (filters.strikeMin !== null && strike !== null && strike < filters.strikeMin) return false;
        if (filters.strikeMax !== null && strike !== null && strike > filters.strikeMax) return false;
        if (filters.expiration && expiration && expiration !== filters.expiration) return false;
        return true;
      });

      setSnapshots(filtered);
      setTotalCount(filtered.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch snapshots");
      setSnapshots([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, [filters.symbol, filters.optionType, filters.strikeMin, filters.strikeMax, filters.expiration, filters.timeWindowMinutes]);

  const updateFilters = (newFilters: Partial<SnapshotFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const availableExpirations = useMemo(() => {
    const exps = new Set<string>();
    snapshots.forEach((s) => {
      const exp = (s.payload as any)?.expiration;
      if (typeof exp === "string" && exp) exps.add(exp);
    });
    return Array.from(exps).sort();
  }, [snapshots]);

  return { snapshots, filters, updateFilters, loading, error, totalCount, availableExpirations, refresh: fetchSnapshots };
}

