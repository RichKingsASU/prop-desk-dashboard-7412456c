import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <Card className="p-4 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-8 bg-muted rounded"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">Account Info</h3>
        <div className="flex items-center gap-2">
          <span className="number-mono text-sm">{data.account_id}</span>
          <Badge
            variant="outline"
            className={data.environment === "production" ? "bg-production/10 text-production border-production" : "bg-sandbox/10 text-sandbox border-sandbox"}
          >
            {data.environment}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{data.market}</p>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Equity & P/L</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground">Equity</span>
            <span className="number-mono text-lg font-semibold">
              ${data.equity.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-muted-foreground">Day P/L</span>
            <span className={`number-mono font-medium ${data.day_pnl >= 0 ? "bull-text" : "bear-text"}`}>
              {data.day_pnl >= 0 ? "+" : ""}${data.day_pnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs ml-1">({data.day_pnl_pct >= 0 ? "+" : ""}{data.day_pnl_pct.toFixed(2)}%)</span>
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Unrealized</span>
            <span className={`number-mono ${data.unrealized_pnl >= 0 ? "bull-text" : "bear-text"}`}>
              {data.unrealized_pnl >= 0 ? "+" : ""}${data.unrealized_pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Realized</span>
            <span className={`number-mono ${data.realized_pnl >= 0 ? "bull-text" : "bear-text"}`}>
              {data.realized_pnl >= 0 ? "+" : ""}${data.realized_pnl.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Liquidity</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground font-medium">Settled Cash</span>
            <span className="number-mono font-semibold text-sm text-foreground">
              ${data.settled_cash.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Buying Power</span>
            <span className="number-mono">
              ${data.buying_power.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Margin Available</span>
            <span className="number-mono">
              ${data.margin_available.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Portfolio Greeks</h3>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex-1 justify-center">
            <span className="text-xs">Δ {data.portfolio_delta.toFixed(1)}</span>
          </Badge>
          <Badge variant="outline" className="flex-1 justify-center">
            <span className="text-xs">Θ {data.portfolio_theta.toFixed(1)}</span>
          </Badge>
          <Badge variant="outline" className="flex-1 justify-center">
            <span className="text-xs">ν {data.portfolio_vega.toFixed(1)}</span>
          </Badge>
        </div>
      </div>
    </Card>
  );
};
