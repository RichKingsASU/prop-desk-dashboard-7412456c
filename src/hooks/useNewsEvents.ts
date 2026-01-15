import { useMemo, useState, useEffect } from "react";
import { client } from "@/integrations/backend/client";

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

function coerceString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function coerceNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function toIso(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v;
  if (typeof v === "number") return new Date(v).toISOString();
  if (v instanceof Date) return v.toISOString();
  return null;
}

function coerceNewsEvents(raw: unknown): NewsEvent[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as any).events)
    ? (raw as any).events
    : raw && typeof raw === "object" && Array.isArray((raw as any).news)
    ? (raw as any).news
    : raw && typeof raw === "object" && Array.isArray((raw as any).data)
    ? (raw as any).data
    : [];

  const now = new Date().toISOString();
  const normalized: NewsEvent[] = arr
    .map((item: any, idx: number) => {
      const headline = coerceString(item?.headline ?? item?.title) ?? "";
      if (!headline) return null;

      const symbol =
        coerceString(item?.symbol) ??
        (Array.isArray(item?.symbols) && typeof item.symbols[0] === "string" ? item.symbols[0] : null) ??
        null;

      const receivedAt = toIso(item?.received_at ?? item?.created_at ?? item?.published_at ?? item?.time ?? item?.t) ?? now;
      const eventTs = toIso(item?.event_ts ?? item?.event_time ?? item?.timestamp ?? item?.t) ?? null;

      const id = coerceString(item?.id ?? item?.uuid ?? item?._id) ?? `${receivedAt}-${idx}`;

      return {
        id,
        source: coerceString(item?.source ?? item?.provider ?? item?.feed) ?? "unknown",
        headline,
        body: coerceString(item?.body ?? item?.summary ?? item?.content),
        url: coerceString(item?.url ?? item?.link),
        symbol,
        category: coerceString(item?.category ?? item?.type),
        sentiment: coerceString(item?.sentiment),
        importance: coerceNumber(item?.importance ?? item?.priority),
        event_ts: eventTs,
        received_at: receivedAt,
      };
    })
    .filter(Boolean) as NewsEvent[];

  return normalized.sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());
}

export function useNewsEvents(initialFilters?: Partial<NewsFilters>, options?: { pollMs?: number }) {
  const [filters, setFilters] = useState<NewsFilters>({
    source: null,
    symbol: null,
    limit: 100,
    ...initialFilters,
  });
  const [events, setEvents] = useState<NewsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pollMs = useMemo(() => Math.max(1000, options?.pollMs ?? 20_000), [options?.pollMs]);

  const fetchEvents = async () => {
    setError(null);
    setLoading(true);

    try {
      const raw = await client.getMarketNews({
        symbol: filters.symbol ?? undefined,
        source: filters.source ?? undefined,
        limit: filters.limit,
      });
      setEvents(coerceNewsEvents(raw).slice(0, filters.limit));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch news events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        await fetchEvents();
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
  }, [filters, pollMs]);

  const updateFilters = (newFilters: Partial<NewsFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  return {
    events,
    filters,
    updateFilters,
    loading,
    error,
    refresh: fetchEvents,
  };
}
