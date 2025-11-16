import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, TrendingUp, Wallet } from "lucide-react";

interface AccountData {
  account_id: string;
  environment: "production" | "sandbox";
  market: string;
  equity: number;
  day_pnl: number;
  day_pnl_pct: number;
  unrealized_pnl: number;
  realized_pnl: number;
  settled_cash: number;
  buying_power: number;
  margin_available: number;
  portfolio_delta: number;
  portfolio_theta: number;
  portfolio_vega: number;
}

interface AccountPanelProps {
  data: AccountData | null;
  loading: boolean;
}

export const AccountPanel = ({ data, loading }: AccountPanelProps) => {
  if (loading || !data) {
    return (
      <Card className="p-5 space-y-4">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i}>
              <div className="h-3 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-6 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  const getGreekColor = (value: number, type: 'delta' | 'theta' | 'vega') => {
    if (type === 'delta') {
      if (Math.abs(value) > 50) return value > 0 ? "bull-text" : "bear-text";
      return "text-muted-foreground";
    }
    if (type === 'theta') {
      if (Math.abs(value) > 25) return "text-warning";
      return "text-muted-foreground";
    }
    if (type === 'vega') {
      if (Math.abs(value) > 40) return "text-info";
      return "text-muted-foreground";
    }
    return "text-muted-foreground";
  };

  return (
    <Card className="p-5">
      <div className="space-y-5">
        {/* Account Info */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account Info</h3>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                data.environment === "production" 
                  ? "bg-production/10 text-production border-production" 
                  : "bg-sandbox/10 text-sandbox border-sandbox"
              }`}
            >
              {data.environment.toUpperCase()}
            </Badge>
          </div>
          <div className="space-y-1">
            <div className="number-mono text-sm font-medium">{data.account_id}</div>
            <div className="text-xs text-muted-foreground">{data.market}</div>
          </div>
        </div>

        <Separator />

        {/* Equity & P/L */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Equity & P/L</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Total Equity</span>
              <span className="number-mono text-lg font-bold text-foreground">
                ${data.equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-xs text-muted-foreground">Day P/L</span>
              <div className="text-right">
                <div className={`number-mono font-bold ${data.day_pnl >= 0 ? "bull-text" : "bear-text"}`}>
                  {data.day_pnl >= 0 ? "+" : ""}${Math.abs(data.day_pnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-xs ${data.day_pnl >= 0 ? "bull-text" : "bear-text"}`}>
                  ({data.day_pnl_pct >= 0 ? "+" : ""}{data.day_pnl_pct.toFixed(2)}%)
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Unrealized</div>
                <div className={`number-mono text-sm font-semibold ${data.unrealized_pnl >= 0 ? "bull-text" : "bear-text"}`}>
                  {data.unrealized_pnl >= 0 ? "+" : ""}${Math.abs(data.unrealized_pnl).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Realized</div>
                <div className={`number-mono text-sm font-semibold ${data.realized_pnl >= 0 ? "bull-text" : "bear-text"}`}>
                  {data.realized_pnl >= 0 ? "+" : ""}${Math.abs(data.realized_pnl).toLocaleString("en-US", { minimumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Liquidity */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Liquidity</h3>
          </div>
          <div className="space-y-2.5">
            <div className="bg-primary/5 border border-primary/20 rounded-md p-2.5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Settled Cash</div>
              <div className="number-mono text-base font-bold text-foreground">
                ${data.settled_cash.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Buying Power</span>
              <span className="number-mono font-semibold">
                ${data.buying_power.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Margin Available</span>
              <span className="number-mono font-semibold">
                ${data.margin_available.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Portfolio Greeks */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Portfolio Greeks</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-card border border-border rounded-md p-2.5 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Delta</div>
              <div className={`number-mono text-base font-bold ${getGreekColor(data.portfolio_delta, 'delta')}`}>
                {data.portfolio_delta >= 0 ? "+" : ""}{data.portfolio_delta.toFixed(1)}
              </div>
            </div>
            <div className="bg-card border border-border rounded-md p-2.5 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Theta</div>
              <div className={`number-mono text-base font-bold ${getGreekColor(data.portfolio_theta, 'theta')}`}>
                {data.portfolio_theta.toFixed(1)}
              </div>
            </div>
            <div className="bg-card border border-border rounded-md p-2.5 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Vega</div>
              <div className={`number-mono text-base font-bold ${getGreekColor(data.portfolio_vega, 'vega')}`}>
                {data.portfolio_vega >= 0 ? "+" : ""}{data.portfolio_vega.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
