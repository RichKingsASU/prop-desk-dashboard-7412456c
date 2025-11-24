import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Flame, Zap } from "lucide-react";

interface WatchlistItem {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
  status: "hot" | "trending" | "normal";
  sparklineData: number[];
}

const mockWatchlist: WatchlistItem[] = [
  { symbol: "SPY", price: 432.15, change: 1.23, changePct: 0.29, volume: 85000000, status: "hot", sparklineData: [430, 431, 430.5, 432, 431.8, 432.15] },
  { symbol: "QQQ", price: 368.50, change: -0.85, changePct: -0.23, volume: 45000000, status: "normal", sparklineData: [369, 368.8, 369.2, 368.5, 368.3, 368.5] },
  { symbol: "AAPL", price: 178.23, change: 2.15, changePct: 1.22, volume: 52000000, status: "trending", sparklineData: [176, 177, 177.5, 178, 178.1, 178.23] },
  { symbol: "TSLA", price: 245.67, change: -3.45, changePct: -1.38, volume: 95000000, status: "hot", sparklineData: [249, 247, 246, 245, 246, 245.67] },
  { symbol: "NVDA", price: 495.30, change: 8.75, changePct: 1.80, volume: 78000000, status: "trending", sparklineData: [487, 490, 492, 494, 495, 495.3] },
  { symbol: "AMD", price: 165.80, change: 1.90, changePct: 1.16, volume: 34000000, status: "normal", sparklineData: [164, 165, 164.5, 165.5, 165.7, 165.8] },
  { symbol: "MSFT", price: 412.45, change: -1.20, changePct: -0.29, volume: 28000000, status: "normal", sparklineData: [413, 412.5, 413, 412.8, 412.3, 412.45] },
];

const MiniSparkline = ({ data }: { data: number[] }) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 60;
    const y = 20 - ((value - min) / range) * 20;
    return `${x},${y}`;
  }).join(" ");

  const isPositive = data[data.length - 1] >= data[0];
  
  return (
    <svg width="60" height="20" className="opacity-70">
      <polyline
        points={points}
        fill="none"
        stroke={isPositive ? "hsl(var(--bull))" : "hsl(var(--bear))"}
        strokeWidth="1.5"
      />
    </svg>
  );
};

export const WatchlistTower = ({ onSymbolClick }: { onSymbolClick?: (symbol: string) => void }) => {
  return (
    <Card className="h-full bg-card/50 backdrop-blur-sm border-white/10">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-sm font-bold uppercase tracking-wider ui-label flex items-center gap-2">
          <div className="w-1 h-4 bg-primary rounded-full" />
          Timing Tower
        </h2>
      </div>
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="p-2 space-y-1">
          {mockWatchlist.map((item) => (
            <div
              key={item.symbol}
              onClick={() => onSymbolClick?.(item.symbol)}
              className="group p-3 rounded-lg bg-background/50 border border-white/5 hover:border-primary/30 hover:bg-background/70 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold number-mono">{item.symbol}</span>
                  {item.status === "hot" && <Flame className="h-3 w-3 text-orange-500" />}
                  {item.status === "trending" && <Zap className="h-3 w-3 text-yellow-500" />}
                </div>
                <MiniSparkline data={item.sparklineData} />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-base font-bold number-mono">${item.price.toFixed(2)}</span>
                <Badge
                  className={`text-xs font-bold number-mono px-2 py-0.5 rounded-full ${
                    item.changePct >= 0
                      ? "bg-bull/20 text-bull border border-bull/30"
                      : "bg-bear/20 text-bear border border-bear/30"
                  }`}
                >
                  {item.changePct >= 0 ? <TrendingUp className="h-3 w-3 mr-1 inline" /> : <TrendingDown className="h-3 w-3 mr-1 inline" />}
                  {item.changePct >= 0 ? "+" : ""}{item.changePct.toFixed(2)}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
