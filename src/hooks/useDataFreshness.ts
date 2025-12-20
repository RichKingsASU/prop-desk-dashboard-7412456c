import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    const updates = await Promise.all([
      // alpaca_option_snapshots
      (async () => {
        const [latestRes, countRes] = await Promise.all([
          supabase
            .from('alpaca_option_snapshots')
            .select('inserted_at')
            .order('inserted_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('alpaca_option_snapshots')
            .select('*', { count: 'exact', head: true })
            .gte('inserted_at', fifteenMinutesAgo.toISOString())
        ]);
        
        const lastTs = latestRes.data?.inserted_at ? new Date(latestRes.data.inserted_at) : null;
        return {
          tableName: 'alpaca_option_snapshots',
          displayName: 'Options Snapshots',
          lastRowTimestamp: lastTs,
          rowCountLast15Min: countRes.count || 0,
          status: getStatus(lastTs),
          loading: false
        } as TableFreshness;
      })(),

      // news_events
      (async () => {
        const [latestRes, countRes] = await Promise.all([
          supabase
            .from('news_events')
            .select('received_at')
            .order('received_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('news_events')
            .select('*', { count: 'exact', head: true })
            .gte('received_at', fifteenMinutesAgo.toISOString())
        ]);
        
        const lastTs = latestRes.data?.received_at ? new Date(latestRes.data.received_at) : null;
        return {
          tableName: 'news_events',
          displayName: 'News Events',
          lastRowTimestamp: lastTs,
          rowCountLast15Min: countRes.count || 0,
          status: getStatus(lastTs),
          loading: false
        } as TableFreshness;
      })(),

      // live_quotes
      (async () => {
        const [latestRes, countRes] = await Promise.all([
          supabase
            .from('live_quotes')
            .select('last_update_ts')
            .order('last_update_ts', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('live_quotes')
            .select('*', { count: 'exact', head: true })
            .gte('last_update_ts', fifteenMinutesAgo.toISOString())
        ]);
        
        const lastTs = latestRes.data?.last_update_ts ? new Date(latestRes.data.last_update_ts) : null;
        return {
          tableName: 'live_quotes',
          displayName: 'Live Quotes',
          lastRowTimestamp: lastTs,
          rowCountLast15Min: countRes.count || 0,
          status: getStatus(lastTs),
          loading: false
        } as TableFreshness;
      })(),

      // market_data_1m
      (async () => {
        const [latestRes, countRes] = await Promise.all([
          supabase
            .from('market_data_1m')
            .select('ts')
            .order('ts', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('market_data_1m')
            .select('*', { count: 'exact', head: true })
            .gte('ts', fifteenMinutesAgo.toISOString())
        ]);
        
        const lastTs = latestRes.data?.ts ? new Date(latestRes.data.ts) : null;
        return {
          tableName: 'market_data_1m',
          displayName: 'Market Data 1m',
          lastRowTimestamp: lastTs,
          rowCountLast15Min: countRes.count || 0,
          status: getStatus(lastTs),
          loading: false
        } as TableFreshness;
      })(),
    ]);

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
