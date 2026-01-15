import { useState, useEffect } from 'react';
import { client } from '@/integrations/backend/client';

export interface TableFreshness {
  tableName: string;
  displayName: string;
  lastRowTimestamp: Date | null;
  /**
   * Optional metric if backend provides it.
   * Note: client must NOT query DB for counts.
   */
  rowCountLast15Min: number | null;
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

function coerceDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Try to extract a "last updated" timestamp for a given source/table from an arbitrary backend payload.
 * The backend shape is not guaranteed, so we attempt a few common patterns.
 */
function extractLastTimestamp(raw: unknown, nameCandidates: string[]): Date | null {
  const timestampKeys = [
    'last_row_timestamp',
    'lastRowTimestamp',
    'last_update_ts',
    'lastUpdateTs',
    'last_update',
    'lastUpdate',
    'last_ts',
    'lastTs',
    'ts',
    'timestamp',
    'time',
    'inserted_at',
    'created_at',
    'updated_at',
    'received_at',
    'last_run_at',
    'lastRunAt',
    'last_heartbeat',
    'heartbeat',
  ];

  const candidatesLower = new Set(nameCandidates.map((c) => c.toLowerCase()));
  const visited = new WeakSet<object>();

  const tryReadTimestampFromObject = (obj: Record<string, unknown>) => {
    for (const k of timestampKeys) {
      if (k in obj) {
        const d = coerceDate(obj[k]);
        if (d) return d;
      }
    }
    return null;
  };

  const walk = (node: unknown, depth: number): Date | null => {
    if (!node || depth > 6) return null;

    if (Array.isArray(node)) {
      for (const item of node) {
        const d = walk(item, depth + 1);
        if (d) return d;
      }
      return null;
    }

    if (typeof node !== 'object') return null;
    if (visited.has(node as object)) return null;
    visited.add(node as object);

    const obj = node as Record<string, unknown>;

    // 1) Direct match: object has a property named like the source/table.
    for (const [k, v] of Object.entries(obj)) {
      if (!k) continue;
      const keyLower = k.toLowerCase();
      if (candidatesLower.has(keyLower)) {
        // Value might be a timestamp directly or a nested object.
        const direct = coerceDate(v);
        if (direct) return direct;
        if (v && typeof v === 'object') {
          const nested = tryReadTimestampFromObject(v as Record<string, unknown>);
          if (nested) return nested;
        }
      }
    }

    // 2) If this object itself looks like a source record, read known timestamp keys.
    const here = tryReadTimestampFromObject(obj);
    if (here) return here;

    // 3) Recurse into nested objects.
    for (const v of Object.values(obj)) {
      const d = walk(v, depth + 1);
      if (d) return d;
    }

    return null;
  };

  return walk(raw, 0);
}

function extractCount15m(raw: unknown, nameCandidates: string[]): number | null {
  const countKeys = ['rowCountLast15Min', 'row_count_last_15m', 'rows_last_15m', 'count_15m', 'countLast15Min'];
  const candidatesLower = new Set(nameCandidates.map((c) => c.toLowerCase()));
  const visited = new WeakSet<object>();

  const walk = (node: unknown, depth: number): number | null => {
    if (!node || depth > 6) return null;
    if (Array.isArray(node)) {
      for (const item of node) {
        const n = walk(item, depth + 1);
        if (n != null) return n;
      }
      return null;
    }
    if (typeof node !== 'object') return null;
    if (visited.has(node as object)) return null;
    visited.add(node as object);

    const obj = node as Record<string, unknown>;

    for (const [k, v] of Object.entries(obj)) {
      const keyLower = k.toLowerCase();
      if (candidatesLower.has(keyLower) && v && typeof v === 'object') {
        const nested = v as Record<string, unknown>;
        for (const ck of countKeys) {
          if (ck in nested) {
            const n = coerceNumber(nested[ck]);
            if (n != null) return n;
          }
        }
      }
    }

    for (const ck of countKeys) {
      if (ck in obj) {
        const n = coerceNumber(obj[ck]);
        if (n != null) return n;
      }
    }

    for (const v of Object.values(obj)) {
      const n = walk(v, depth + 1);
      if (n != null) return n;
    }

    return null;
  };

  return walk(raw, 0);
}

function coerceJobsFromBackend(raw: unknown): JobHealth[] | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const arr =
    (Array.isArray((r as any).jobs) ? (r as any).jobs : null) ??
    (Array.isArray((r as any).job_health) ? (r as any).job_health : null) ??
    (Array.isArray((r as any).health) ? (r as any).health : null) ??
    null;

  if (!Array.isArray(arr) || arr.length === 0) return null;

  const normalizeStatus = (s: unknown): JobHealth['status'] => {
    if (typeof s !== 'string') return 'unknown';
    const v = s.toLowerCase();
    if (['healthy', 'ok', 'good', 'pass', 'passing'].includes(v)) return 'healthy';
    if (['warning', 'warn', 'degraded', 'stale'].includes(v)) return 'warning';
    if (['critical', 'error', 'down', 'failed', 'failing'].includes(v)) return 'critical';
    return 'unknown';
  };

  const jobs: JobHealth[] = arr
    .map((item: any, idx: number) => {
      const nameRaw = item?.jobName ?? item?.job_name ?? item?.name ?? item?.id ?? null;
      const jobName = typeof nameRaw === 'string' ? nameRaw : `Job ${idx + 1}`;

      const sourceRaw = item?.dataSource ?? item?.data_source ?? item?.source ?? item?.table ?? null;
      const dataSource = typeof sourceRaw === 'string' ? sourceRaw : '';

      const tsRaw =
        item?.lastRunAt ??
        item?.last_run_at ??
        item?.last_run ??
        item?.last_success_at ??
        item?.updated_at ??
        item?.timestamp ??
        null;
      const lastRunAt = coerceDate(tsRaw);

      const status = normalizeStatus(item?.status ?? item?.state ?? item?.health);

      return { jobName, dataSource, lastRunAt, status } as JobHealth;
    })
    .filter((j) => j.jobName.length > 0);

  return jobs.length ? jobs : null;
}

export function useDataFreshness() {
  const tableDefs = [
    {
      tableName: 'alpaca_option_snapshots',
      displayName: 'Options Snapshots',
      candidates: ['alpaca_option_snapshots', 'options_snapshots', 'option_snapshots', 'options'],
    },
    { tableName: 'news_events', displayName: 'News Events', candidates: ['news_events', 'news', 'news_feed'] },
    { tableName: 'live_quotes', displayName: 'Live Quotes', candidates: ['live_quotes', 'quotes', 'l1', 'l1_quotes'] },
    { tableName: 'market_data_1m', displayName: 'Market Data 1m', candidates: ['market_data_1m', 'bars_1m', 'bars', 'ohlcv_1m'] },
  ] as const;

  const [tables, setTables] = useState<TableFreshness[]>(
    tableDefs.map((t) => ({
      tableName: t.tableName,
      displayName: t.displayName,
      lastRowTimestamp: null,
      rowCountLast15Min: null,
      status: 'unknown',
      loading: true,
    }))
  );
  
  const [jobs, setJobs] = useState<JobHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchFreshness = async () => {
    setLoading(true);
    try {
      const statusRaw = await client.getSystemStatus();

      const updates: TableFreshness[] = tableDefs.map((def) => {
        const lastTs = extractLastTimestamp(statusRaw, [def.tableName, ...def.candidates]);
        const count15m = extractCount15m(statusRaw, [def.tableName, ...def.candidates]);
        return {
          tableName: def.tableName,
          displayName: def.displayName,
          lastRowTimestamp: lastTs,
          rowCountLast15Min: count15m,
          status: getStatus(lastTs),
          loading: false,
        };
      });

      setTables(updates);

      const backendJobs = coerceJobsFromBackend(statusRaw);
      if (backendJobs && backendJobs.length) {
        setJobs(backendJobs);
      } else {
        // Fallback: derive job health from backend-provided data timestamps.
        const lookup = new Map(updates.map((t) => [t.tableName, t]));
        const toJobStatus = (s: TableFreshness['status']): JobHealth['status'] =>
          s === 'fresh' ? 'healthy' : s === 'stale' ? 'warning' : s === 'critical' ? 'critical' : 'unknown';

        const derivedJobs: JobHealth[] = [
          {
            jobName: 'Options Snapshot Collector',
            lastRunAt: lookup.get('alpaca_option_snapshots')?.lastRowTimestamp ?? null,
            status: toJobStatus(lookup.get('alpaca_option_snapshots')?.status ?? 'unknown'),
            dataSource: 'alpaca_option_snapshots',
          },
          {
            jobName: 'News Feed Processor',
            lastRunAt: lookup.get('news_events')?.lastRowTimestamp ?? null,
            status: toJobStatus(lookup.get('news_events')?.status ?? 'unknown'),
            dataSource: 'news_events',
          },
          {
            jobName: 'Quote Streamer',
            lastRunAt: lookup.get('live_quotes')?.lastRowTimestamp ?? null,
            status: toJobStatus(lookup.get('live_quotes')?.status ?? 'unknown'),
            dataSource: 'live_quotes',
          },
          {
            jobName: 'Bar Aggregator',
            lastRunAt: lookup.get('market_data_1m')?.lastRowTimestamp ?? null,
            status: toJobStatus(lookup.get('market_data_1m')?.status ?? 'unknown'),
            dataSource: 'market_data_1m',
          },
        ];
        setJobs(derivedJobs);
      }
    } catch (e) {
      console.warn('[useDataFreshness] Failed to fetch backend system status:', e);
      // Mark loading as complete but keep unknown statuses.
      setTables((prev) => prev.map((t) => ({ ...t, loading: false, status: 'unknown' })));
      setJobs([]);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  };

  useEffect(() => {
    fetchFreshness();
    const interval = setInterval(fetchFreshness, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return { tables, jobs, loading, lastRefresh, refresh: fetchFreshness };
}
