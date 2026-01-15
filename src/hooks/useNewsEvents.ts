import { useState, useEffect } from "react";
import { apiFetch } from "@/services/apiClient";

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
    ...initialFilters,
  });
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.symbol) params.set("symbols", filters.symbol);
      if (filters.limit) params.set("limit", String(filters.limit));
      const resp = await apiFetch<{ news: NewsEvent[] }>(`/market/news?${params.toString()}`);
      setEvents(Array.isArray(resp.news) ? resp.news : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch news events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filters.source, filters.symbol, filters.limit]);

  const updateFilters = (newFilters: Partial<NewsFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return { events, filters, updateFilters, loading, error, refresh: fetchEvents };
}

