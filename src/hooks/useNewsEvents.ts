import { useState, useEffect } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '@/integrations/supabase/client';

export interface NewsEvent {
  id: string;
  source: string;
  headline: string;
  body: string | null;
  url: string | null;
  symbol: string | null;
  category: string | null;
  sentiment: string | null;
  importance: number | null;
  event_ts: string | null;
  received_at: string;
}

export interface NewsFilters {
  source: string | null;
  symbol: string | null;
  limit: number;
}

export function useNewsEvents(initialFilters?: Partial<NewsFilters>) {
  const [filters, setFilters] = useState<NewsFilters>({
    source: null,
    symbol: null,
    limit: 100,
    ...initialFilters
  });
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        throw new Error('Supabase is not configured.');
      }

      const supabase = getSupabaseClient();
      let query = supabase
        .from('news_events')
        .select('id, source, headline, body, url, symbol, category, sentiment, importance, event_ts, received_at')
        .order('received_at', { ascending: false })
        .limit(filters.limit);

      if (filters.source) {
        query = query.eq('source', filters.source);
      }

      if (filters.symbol) {
        query = query.eq('symbol', filters.symbol);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setEvents((data || []) as NewsEvent[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch news events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const updateFilters = (newFilters: Partial<NewsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    events,
    filters,
    updateFilters,
    loading,
    error,
    refresh: fetchEvents
  };
}
