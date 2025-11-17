import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { useState, useEffect } from "react";

interface TradeHistoryTableProps {
  symbol: string;
}

interface Trade {
  id: number;
  time: string;
  symbol: string;
  description: string;
  side: "BUY" | "SELL";
  qty: number;
  entryPrice: number;
  exitPrice?: number;
  pnl: number;
  environment: string;
  hasNote: boolean;
}

export const TradeHistoryTable = ({ symbol }: TradeHistoryTableProps) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockTrades: Trade[] = [
      {
        id: 1,
        time: "09:35:12",
        symbol: symbol,
        description: `${symbol} 19Dec25 430C`,
        side: "BUY",
        qty: 5,
        entryPrice: 2.45,
        exitPrice: 2.78,
        pnl: 165,
        environment: "Breakout above PDH",
        hasNote: true,
      },
      {
        id: 2,
        time: "10:42:33",
        symbol: symbol,
        description: `${symbol} 19Dec25 428P`,
        side: "SELL",
        qty: 3,
        entryPrice: 1.85,
        exitPrice: 1.62,
        pnl: 69,
        environment: "Rejection at ORH",
        hasNote: false,
      },
      {
        id: 3,
        time: "11:15:44",
        symbol: symbol,
        description: `${symbol} 19Dec25 432C`,
        side: "BUY",
        qty: 2,
        entryPrice: 3.10,
        pnl: -45,
        environment: "False breakout",
        hasNote: true,
      },
    ];

    setTimeout(() => {
      setTrades(mockTrades);
      setLoading(false);
    }, 500);
  }, [symbol]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades - {symbol}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades - {symbol}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Time</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Side</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Entry</TableHead>
              <TableHead className="text-right">Exit</TableHead>
              <TableHead className="text-right">P&L</TableHead>
              <TableHead>Environment</TableHead>
              <TableHead className="text-center">Journal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  No recent trades for {symbol}
                </TableCell>
              </TableRow>
            ) : (
              trades.map((trade, idx) => (
                <TableRow key={trade.id} className={idx % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                  <TableCell className="font-mono text-xs">{trade.time}</TableCell>
                  <TableCell className="font-semibold">{trade.symbol}</TableCell>
                  <TableCell className="text-sm">{trade.description}</TableCell>
                  <TableCell>
                    <Badge variant={trade.side === "BUY" ? "default" : "secondary"}>
                      {trade.side}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{trade.qty}</TableCell>
                  <TableCell className="text-right font-mono text-sm">${trade.entryPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className={trade.pnl >= 0 ? "text-green-600" : "text-red-600"}>
                      {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{trade.environment}</TableCell>
                  <TableCell className="text-center">
                    {trade.hasNote && (
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <FileText className="h-4 w-4" />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
