import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Wallet, Zap } from "lucide-react";

interface VitalsBarProps {
  equity: number;
  buyingPower: number;
  maxBuyingPower: number;
  dayPnl: number;
  dayPnlPct: number;
}

export const VitalsBar = ({
  equity,
  buyingPower,
  maxBuyingPower,
  dayPnl,
  dayPnlPct,
}: VitalsBarProps) => {
  const buyingPowerPct = (buyingPower / maxBuyingPower) * 100;
  const isProfitable = dayPnl >= 0;

  return (
    <Card className="bg-card/50 backdrop-blur-md border-white/10 border-t-2">
      <div className="px-6 py-3 flex items-center justify-between gap-8">
        {/* Account Equity */}
        <div className="flex items-center gap-3">
          <div className="w-1 h-10 bg-primary rounded-full" />
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground ui-label flex items-center gap-1.5">
              <Wallet className="h-3 w-3" />
              Account Equity
            </div>
            <div className="text-xl font-extrabold number-mono">
              ${equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Buying Power Gauge */}
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground ui-label flex items-center gap-1.5">
              <Zap className="h-3 w-3" />
              Buying Power
            </div>
            <div className="text-sm font-bold number-mono">
              ${buyingPower.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
          </div>
          <Progress
            value={buyingPowerPct}
            className="h-2 bg-background/50"
            indicatorClassName={
              buyingPowerPct > 75
                ? "bg-bull"
                : buyingPowerPct > 40
                ? "bg-yellow-500"
                : "bg-bear"
            }
          />
          <div className="text-xs text-muted-foreground mt-1 number-mono">
            {buyingPowerPct.toFixed(0)}% Available
          </div>
        </div>

        {/* Total Day P&L */}
        <div className="flex items-center gap-3">
          <div className={`w-1 h-10 rounded-full ${isProfitable ? "bg-bull" : "bg-bear"}`} />
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground ui-label flex items-center gap-1.5">
              {isProfitable ? (
                <TrendingUp className="h-3 w-3 text-bull" />
              ) : (
                <TrendingDown className="h-3 w-3 text-bear" />
              )}
              Total Day P&L
            </div>
            <div className={`text-xl font-extrabold number-mono ${isProfitable ? "text-bull" : "text-bear"}`}>
              {dayPnl >= 0 ? "+" : ""}${Math.abs(dayPnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="ml-2 text-base font-bold">
                ({dayPnlPct >= 0 ? "+" : ""}{dayPnlPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
