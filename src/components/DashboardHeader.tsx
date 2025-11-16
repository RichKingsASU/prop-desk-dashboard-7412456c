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
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 shadow-sm">
      <div className="flex h-16 items-center justify-between px-6 gap-8">
        {/* Left Section: Title + Environment Badge */}
        <div className="flex items-center gap-3 min-w-fit">
          <h1 className="text-lg font-bold tracking-tight">Pro Day Trading Dashboard</h1>
          <Badge
            className={
              environment === "production"
                ? "bg-production text-production-foreground border-0 px-3 py-1 text-xs font-semibold shadow-lg shadow-production/20"
                : "bg-sandbox text-sandbox-foreground border-0 px-3 py-1 text-xs font-semibold shadow-lg shadow-sandbox/20"
            }
          >
            {environment.toUpperCase()}
          </Badge>
        </div>

        {/* Center Section: Symbol Selector */}
        <div className="flex items-center justify-center flex-1">
          <Select value={currentSymbol} onValueChange={onSymbolChange}>
            <SelectTrigger className="w-40 h-10 border-2 border-border hover:border-primary/50 transition-colors font-semibold text-base bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-[100]">
              {SYMBOLS.map((symbol) => (
                <SelectItem 
                  key={symbol} 
                  value={symbol}
                  className="font-medium hover:bg-accent/50 cursor-pointer"
                >
                  {symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Right Section: Account Summary + Market Time */}
        <div className="flex items-center gap-6 min-w-fit">
          <div className="text-right">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Equity</div>
            <div className="number-mono text-base font-bold text-foreground">
              ${equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          
          <div className="h-8 w-px bg-border" />
          
          <div className="text-right">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Day P/L</div>
            <div className={`number-mono text-base font-bold ${dayPnl >= 0 ? "bull-text" : "bear-text"}`}>
              {dayPnl >= 0 ? "+" : ""}${Math.abs(dayPnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="ml-1.5 text-sm">({dayPnlPct >= 0 ? "+" : ""}{dayPnlPct.toFixed(2)}%)</span>
            </div>
          </div>
          
          <div className="h-8 w-px bg-border" />
          
          <div className="flex flex-col gap-1">
            <Badge
              variant={marketStatus === "open" ? "default" : "secondary"}
              className={`text-xs font-semibold px-2.5 py-1 ${
                marketStatus === "open" 
                  ? "bg-bull/20 text-bull border border-bull/30" 
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {marketStatus === "open" ? "● MARKET OPEN" : "○ MARKET CLOSED"}
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="number-mono font-medium">{timeToClose}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
