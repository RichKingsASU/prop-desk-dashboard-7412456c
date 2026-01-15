import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';

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
    // TODO(api): Backend must provide freshness summaries in GET /system/state so the UI
    // does not query DB tables directly.
    const state = await apiClient.getSystemState();

    const freshnessByName: Record<
      string,
      { last_ts?: string | null; count_15m?: number | null }
    > = (state as any)?.data_freshness || (state as any)?.dataFreshness || {};

    const updates: TableFreshness[] = tables.map((t) => {
      const entry = freshnessByName[t.tableName] || {};
      const lastTs = entry.last_ts ? new Date(entry.last_ts) : null;
      const rowCountLast15Min = typeof entry.count_15m === "number" ? entry.count_15m : 0;
      return {
        ...t,
        lastRowTimestamp: lastTs,
        rowCountLast15Min,
        status: getStatus(lastTs),
        loading: false,
      };
    });

    setTables(updates);

    // Derive job health from data freshness
    const derivedJobs: JobHealth[] = [
      {
        jobName: 'Options Snapshot Collector',
        lastRunAt: updates.find(t => t.tableName === 'alpaca_option_snapshots')?.lastRowTimestamp || null,
        status: updates.find(t => t.tableName === 'alpaca_option_snapshots')?.status === 'fresh' ? 'healthy' 
              : updates.find(t => t.tableName === 'alpaca_option_snapshots')?.status === 'stale' ? 'warning' 
              : updates.find(t => t.tableName === 'alpaca_option_snapshots')?.status === 'critical' ? 'critical' 
              : 'unknown',
        dataSource: 'alpaca_option_snapshots'
      },
      {
        jobName: 'News Feed Processor',
        lastRunAt: updates.find(t => t.tableName === 'news_events')?.lastRowTimestamp || null,
        status: updates.find(t => t.tableName === 'news_events')?.status === 'fresh' ? 'healthy'
              : updates.find(t => t.tableName === 'news_events')?.status === 'stale' ? 'warning'
              : updates.find(t => t.tableName === 'news_events')?.status === 'critical' ? 'critical'
              : 'unknown',
        dataSource: 'news_events'
      },
      {
        jobName: 'Quote Streamer',
        lastRunAt: updates.find(t => t.tableName === 'live_quotes')?.lastRowTimestamp || null,
        status: updates.find(t => t.tableName === 'live_quotes')?.status === 'fresh' ? 'healthy'
              : updates.find(t => t.tableName === 'live_quotes')?.status === 'stale' ? 'warning'
              : updates.find(t => t.tableName === 'live_quotes')?.status === 'critical' ? 'critical'
              : 'unknown',
        dataSource: 'live_quotes'
      },
      {
        jobName: 'Bar Aggregator',
        lastRunAt: updates.find(t => t.tableName === 'market_data_1m')?.lastRowTimestamp || null,
        status: updates.find(t => t.tableName === 'market_data_1m')?.status === 'fresh' ? 'healthy'
              : updates.find(t => t.tableName === 'market_data_1m')?.status === 'stale' ? 'warning'
              : updates.find(t => t.tableName === 'market_data_1m')?.status === 'critical' ? 'critical'
              : 'unknown',
        dataSource: 'market_data_1m'
      },
    ];

    setJobs(derivedJobs);
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
