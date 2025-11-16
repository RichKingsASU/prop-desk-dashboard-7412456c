import { TrendingUp, TrendingDown } from "lucide-react";

interface TickerItem {
  symbol: string;
  price: number;
  changePct: number;
}

const mockTickerData: TickerItem[] = [
  { symbol: "TSLA", price: 404.35, changePct: 0.59 },
  { symbol: "NVDA", price: 190.17, changePct: 1.77 },
  { symbol: "MSFT", price: 510.18, changePct: 1.37 },
  { symbol: "AAPL", price: 272.41, changePct: -0.20 },
  { symbol: "META", price: 609.46, changePct: -0.07 },
  { symbol: "AMD", price: 246.81, changePct: -0.46 },
  { symbol: "GOOGL", price: 178.23, changePct: 0.82 },
  { symbol: "AMZN", price: 215.67, changePct: 1.15 }
];

export function MarketTicker() {
  return (
    <div className="bg-card border-b border-border py-2 px-4 overflow-x-auto">
      <div className="flex items-center gap-6 min-w-max">
        {mockTickerData.map((item) => {
          const isPositive = item.changePct >= 0;
          
          return (
            <div key={item.symbol} className="flex items-center gap-2">
              <span className="font-semibold text-sm text-foreground">
                {item.symbol}
              </span>
              {isPositive ? (
                <TrendingUp className="h-3 w-3 text-bull" />
              ) : (
                <TrendingDown className="h-3 w-3 text-bear" />
              )}
              <span className="text-sm text-foreground">
                {item.price.toFixed(2)}
              </span>
              <span className={`text-sm font-medium ${isPositive ? 'text-bull' : 'text-bear'}`}>
                ({isPositive ? '+' : ''}{item.changePct.toFixed(2)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
