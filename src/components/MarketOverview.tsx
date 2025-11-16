import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface MarketSymbol {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  data: { value: number }[];
}

const mockMarketData: MarketSymbol[] = [
  {
    symbol: "SPY",
    name: "S&P 500",
    price: 6734.11,
    change: -3.38,
    changePct: -0.05,
    data: Array.from({ length: 20 }, (_, i) => ({
      value: 6737 + Math.sin(i * 0.5) * 15 + (i * 0.3)
    }))
  },
  {
    symbol: "QQQ",
    name: "Nasdaq",
    price: 60.09,
    change: 1.40,
    changePct: 2.39,
    data: Array.from({ length: 20 }, (_, i) => ({
      value: 58 + Math.sin(i * 0.4) * 2 + (i * 0.1)
    }))
  },
  {
    symbol: "VIX",
    name: "Volatility",
    price: 19.83,
    change: -0.17,
    changePct: -0.85,
    data: Array.from({ length: 20 }, (_, i) => ({
      value: 20 - Math.sin(i * 0.6) * 1.5 - (i * 0.02)
    }))
  },
  {
    symbol: "GLD",
    name: "Gold",
    price: 4094.25,
    change: -100.3,
    changePct: -2.39,
    data: Array.from({ length: 20 }, (_, i) => ({
      value: 4194 - Math.sin(i * 0.3) * 50 - (i * 5)
    }))
  }
];

export function MarketOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {mockMarketData.map((market) => {
        const isPositive = market.change >= 0;
        const strokeColor = isPositive ? "hsl(var(--bull))" : "hsl(var(--bear))";
        
        return (
          <Card key={market.symbol} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm text-foreground">
                    {market.name}
                  </h3>
                  {isPositive ? (
                    <TrendingUp className="h-3 w-3 text-bull" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-bear" />
                  )}
                </div>
                <div className="text-xl font-bold text-foreground">
                  {market.price.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
                <div className={`text-sm font-medium ${isPositive ? 'text-bull' : 'text-bear'}`}>
                  {isPositive ? '+' : ''}{market.change.toFixed(2)} ({isPositive ? '+' : ''}{market.changePct.toFixed(2)}%)
                </div>
              </div>
              <div className="w-24 h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={market.data}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={strokeColor}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
