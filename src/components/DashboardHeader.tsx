import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface DashboardHeaderProps {
  currentSymbol: string;
  onSymbolChange: (symbol: string) => void;
  environment: "production" | "sandbox";
  equity: number;
  dayPnl: number;
  dayPnlPct: number;
}

const SYMBOLS = ["SPY", "QQQ", "IWM", "AAPL", "TSLA", "NVDA", "MSFT", "AMD"];

export const DashboardHeader = ({
  currentSymbol,
  onSymbolChange,
  environment,
  equity,
  dayPnl,
  dayPnlPct,
}: DashboardHeaderProps) => {
  const [timeToClose, setTimeToClose] = useState("");
  const [marketStatus, setMarketStatus] = useState<"open" | "closed">("open");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const marketClose = new Date(now);
      marketClose.setHours(16, 0, 0, 0);

      if (now > marketClose) {
        setMarketStatus("closed");
        const nextOpen = new Date(now);
        nextOpen.setDate(nextOpen.getDate() + 1);
        nextOpen.setHours(9, 30, 0, 0);
        const diff = nextOpen.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeToClose(`Next Open in ${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`);
      } else {
        setMarketStatus("open");
        const diff = marketClose.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeToClose(`${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")} to Close`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Pro Day Trading Dashboard</h1>
          <Badge
            variant="outline"
            className={environment === "production" ? "bg-production/10 text-production border-production" : "bg-sandbox/10 text-sandbox border-sandbox"}
          >
            {environment.toUpperCase()}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <Select value={currentSymbol} onValueChange={onSymbolChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SYMBOLS.map((symbol) => (
                <SelectItem key={symbol} value={symbol}>
                  {symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Equity</div>
            <div className="number-mono text-sm font-medium">
              ${equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Day P/L</div>
            <div className={`number-mono text-sm font-medium ${dayPnl >= 0 ? "bull-text" : "bear-text"}`}>
              ${dayPnl >= 0 ? "+" : ""}
              {dayPnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="ml-1">({dayPnlPct >= 0 ? "+" : ""}{dayPnlPct.toFixed(2)}%)</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div className="number-mono">
              <div className="text-xs text-muted-foreground">{marketStatus === "open" ? "Time to Close" : "Market Closed"}</div>
              <div className="font-medium">{timeToClose}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
