import { useState, useEffect } from 'react';

export interface TableFreshness {
  tableName: string;
  displayName: string;
  lastRowTimestamp: Date | null;
  rowCountLast15Min: number;
  status: 'fresh' | 'stale' | 'critical' | 'unknown';
  loading: boolean;
}

export interface JobHealth {
  jobName: string;
  lastRunAt: Date | null;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  dataSource: string;
}

const FRESH_THRESHOLD_MINUTES = 5;
const STALE_THRESHOLD_MINUTES = 15;

function getStatus(lastTimestamp: Date | null): 'fresh' | 'stale' | 'critical' | 'unknown' {
  if (!lastTimestamp) return 'unknown';
  
  const now = new Date();
  const diffMinutes = (now.getTime() - lastTimestamp.getTime()) / (1000 * 60);
  
  if (diffMinutes <= FRESH_THRESHOLD_MINUTES) return 'fresh';
  if (diffMinutes <= STALE_THRESHOLD_MINUTES) return 'stale';
  return 'critical';
}

export function useDataFreshness() {
  const [tables, setTables] = useState<TableFreshness[]>([
    { tableName: 'alpaca_option_snapshots', displayName: 'Options Snapshots', lastRowTimestamp: null, rowCountLast15Min: 0, status: 'unknown', loading: true },
    { tableName: 'news_events', displayName: 'News Events', lastRowTimestamp: null, rowCountLast15Min: 0, status: 'unknown', loading: true },
    { tableName: 'live_quotes', displayName: 'Live Quotes', lastRowTimestamp: null, rowCountLast15Min: 0, status: 'unknown', loading: true },
    { tableName: 'market_data_1m', displayName: 'Market Data 1m', lastRowTimestamp: null, rowCountLast15Min: 0, status: 'unknown', loading: true },
  ]);
  
  const [jobs, setJobs] = useState<JobHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchFreshness = async () => {
    const updates = tables.map(t => ({
      ...t,
      lastRowTimestamp: null,
      rowCountLast15Min: 0,
      status: 'unknown' as const,
      loading: false
    }));

    setTables(updates);
    setJobs(
      updates.map(t => ({
        jobName: t.displayName,
        lastRunAt: null,
        status: 'unknown' as const,
        dataSource: t.tableName
      }))
    );
    setLoading(false);
    setLastRefresh(new Date());
  };

  useEffect(() => {
    fetchFreshness();
    const interval = setInterval(fetchFreshness, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return { tables, jobs, loading, lastRefresh, refresh: fetchFreshness };
}
