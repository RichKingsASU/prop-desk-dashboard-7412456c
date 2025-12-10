import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Activity, Loader2, AlertCircle } from "lucide-react";
import { useLiveQuotes } from "@/hooks/useLiveQuotes";

const LiveQuotesWidget = () => {
  const { quotes, loading, error } = useLiveQuotes();

  const formatPrice = (price: number | null) => 
    price !== null ? `$${price.toFixed(2)}` : "—";

  const formatTime = (ts: string) => 
    new Date(ts).toLocaleTimeString();

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-primary" />
            Live Quotes
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Real-time • {quotes.length} symbols
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading quotes...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-8 text-destructive">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No quotes yet. Enable "Persist to Database" in Alpaca Stream Manager.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead className="text-right">Bid</TableHead>
                <TableHead className="text-right">Ask</TableHead>
                <TableHead className="text-right">Last</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quotes.map((quote) => (
                <TableRow key={quote.symbol}>
                  <TableCell className="font-mono font-medium">{quote.symbol}</TableCell>
                  <TableCell className="text-right font-mono">{formatPrice(quote.bid_price)}</TableCell>
                  <TableCell className="text-right font-mono">{formatPrice(quote.ask_price)}</TableCell>
                  <TableCell className="text-right font-mono">{formatPrice(quote.last_trade_price)}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">
                    {formatTime(quote.last_update_ts)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveQuotesWidget;
