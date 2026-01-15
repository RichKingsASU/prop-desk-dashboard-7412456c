import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Loader2, AlertCircle } from "lucide-react";
import { client } from "@/integrations/backend/client";

interface MarketBar {
  symbol: string;
  ts: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function coerceNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function coerceString(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function toIso(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v;
  if (typeof v === "number") return new Date(v).toISOString();
  if (v instanceof Date) return v.toISOString();
  return null;
}

function coerceBars1m(raw: unknown): MarketBar[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as any).bars)
    ? (raw as any).bars
    : raw && typeof raw === "object" && Array.isArray((raw as any).data)
    ? (raw as any).data
    : [];

  const bars: MarketBar[] = arr
    .map((item: any) => {
      const symbol = coerceString(item?.symbol ?? item?.S) ?? null;
      const ts = toIso(item?.ts ?? item?.t ?? item?.time ?? item?.timestamp) ?? null;
      const open = coerceNumber(item?.open ?? item?.o);
      const high = coerceNumber(item?.high ?? item?.h);
      const low = coerceNumber(item?.low ?? item?.l);
      const close = coerceNumber(item?.close ?? item?.c);
      const volume = coerceNumber(item?.volume ?? item?.v) ?? 0;
      if (!symbol || !ts || open == null || high == null || low == null || close == null) return null;
      return { symbol, ts, open, high, low, close, volume };
    })
    .filter(Boolean) as MarketBar[];

  return bars.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
}

const MarketDataWidget = () => {
  const [bars, setBars] = useState<MarketBar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBars = async () => {
      try {
        const raw = await client.getMarketBars1m({ limit: 200 });
        setBars(coerceBars1m(raw).slice(0, 200));
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch market data");
      } finally {
        setLoading(false);
      }
    };

    fetchBars();
    const id = window.setInterval(fetchBars, 10_000);
    return () => window.clearInterval(id);
  }, []);

  const formatPrice = (price: number) => `$${price.toFixed(2)}`;
  const formatVolume = (vol: number) => vol.toLocaleString();
  const formatTime = (ts: string) => {
    const date = new Date(ts);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Recent 1-Minute Bars
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {bars.length} rows
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading market data...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        ) : bars.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No market data yet.
          </div>
        ) : (
          <div className="max-h-96 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                  <TableHead className="text-right">High</TableHead>
                  <TableHead className="text-right">Low</TableHead>
                  <TableHead className="text-right">Close</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bars.map((bar, idx) => (
                  <TableRow key={`${bar.symbol}-${bar.ts}-${idx}`}>
                    <TableCell className="font-mono font-medium">{bar.symbol}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatTime(bar.ts)}</TableCell>
                    <TableCell className="text-right font-mono">{formatPrice(bar.open)}</TableCell>
                    <TableCell className="text-right font-mono">{formatPrice(bar.high)}</TableCell>
                    <TableCell className="text-right font-mono">{formatPrice(bar.low)}</TableCell>
                    <TableCell className="text-right font-mono">{formatPrice(bar.close)}</TableCell>
                    <TableCell className="text-right font-mono">{formatVolume(bar.volume)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketDataWidget;
