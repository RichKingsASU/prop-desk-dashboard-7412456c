import { useEffect, useState } from "react";

export interface TableFreshness {
  tableName: string;
  displayName: string;
  lastRowTimestamp: Date | null;
  rowCountLast15Min: number;
  status: "fresh" | "stale" | "critical" | "unknown";
  loading: boolean;
}

export interface JobHealth {
  jobName: string;
  lastRunAt: Date | null;
  status: "healthy" | "warning" | "critical" | "unknown";
  dataSource: string;
}

export function useDataFreshness() {
  const [tables, setTables] = useState<TableFreshness[]>([
    { tableName: "option_snapshots", displayName: "Options Snapshots", lastRowTimestamp: null, rowCountLast15Min: 0, status: "unknown", loading: false },
    { tableName: "news_events", displayName: "News Events", lastRowTimestamp: null, rowCountLast15Min: 0, status: "unknown", loading: false },
    { tableName: "live_quotes", displayName: "Live Quotes", lastRowTimestamp: null, rowCountLast15Min: 0, status: "unknown", loading: false },
    { tableName: "market_data_1m", displayName: "Market Data 1m", lastRowTimestamp: null, rowCountLast15Min: 0, status: "unknown", loading: false },
  ]);
  const [jobs, setJobs] = useState<JobHealth[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const refresh = async () => {
    // API stubs for freshness endpoints are not implemented yet.
    setLastRefresh(new Date());
  };

  useEffect(() => {
    setJobs([]);
  }, []);

  return { tables, jobs, loading, lastRefresh, refresh };
}

