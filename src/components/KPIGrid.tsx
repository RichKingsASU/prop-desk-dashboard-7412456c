import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, BarChart3, AlertCircle } from "lucide-react";

interface SnapshotData {
  symbol: string;
  last_price: number;
  last_price_change: number;
  last_price_change_pct: number;
  timestamp: string;
  trend_bias: string;
  vwap: number;
  vwap_position_pct: number;
  trend_strength_score: number;
  rvol: number;
  rsi_14: number;
  rsi_zone: string;
  macd_state: string;
  macd: number;
  macd_signal: number;
  macd_hist: number;
  atr_14: number;
  atr_pct: number;
  volatility_regime: string;
  bb_state: string;
  bb_width_pct: number;
  distance_prev_high_pct: number;
  distance_prev_low_pct: number;
  opening_range_status: string;
  premarket_context: string;
  day_bias: string;
  setup_quality_score: number;
}

interface KPIGridProps {
  data: SnapshotData | null;
  loading: boolean;
}

export const KPIGrid = ({ data, loading }: KPIGridProps) => {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const getBiasColor = (bias: string) => {
    if (bias.toLowerCase().includes("bullish")) return "bull-text";
    if (bias.toLowerCase().includes("bearish")) return "bear-text";
    return "neutral-text";
  };

  const getQualityColor = (score: number) => {
    if (score >= 70) return "bull-text";
    if (score >= 40) return "text-warning";
    return "bear-text";
  };

  return (
    <div className="space-y-6">
      {/* Composite Cluster */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Composite</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card className={`p-4 ${data.day_bias.toLowerCase().includes("bullish") ? "bg-bull/5 border-bull/20" : data.day_bias.toLowerCase().includes("bearish") ? "bg-bear/5 border-bear/20" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Day Bias</span>
              {data.day_bias.toLowerCase().includes("bullish") ? (
                <TrendingUp className="h-4 w-4 text-bull" />
              ) : (
                <TrendingDown className="h-4 w-4 text-bear" />
              )}
            </div>
            <div className={`text-2xl font-bold ${getBiasColor(data.day_bias)}`}>{data.day_bias}</div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Setup Quality</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={`text-2xl font-bold number-mono ${getQualityColor(data.setup_quality_score)}`}>
              {data.setup_quality_score}
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Trend Cluster */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Trend</h3>
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-2">Trend Bias</div>
            <Badge className={data.trend_bias.toLowerCase().includes("bullish") ? "bg-bull text-bull-foreground" : "bg-bear text-bear-foreground"}>
              {data.trend_bias}
            </Badge>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-2">VWAP Position</div>
            <div className={`number-mono text-lg font-semibold ${data.vwap_position_pct >= 0 ? "bull-text" : "bear-text"}`}>
              {data.vwap_position_pct >= 0 ? "+" : ""}{data.vwap_position_pct.toFixed(2)}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">VWAP: ${data.vwap.toFixed(2)}</div>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-2">Trend Strength</div>
            <div className={`number-mono text-lg font-semibold ${getQualityColor(data.trend_strength_score)}`}>
              {data.trend_strength_score}
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Momentum & Liquidity */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Momentum & Liquidity</h3>
        <div className="grid grid-cols-3 gap-4">
          <Card className={`p-4 ${data.rvol >= 2.0 ? "border-info ring-1 ring-info/20" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">RVOL</span>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className={`number-mono text-2xl font-bold ${data.rvol >= 2.0 ? "text-info" : ""}`}>
              {data.rvol.toFixed(1)}×
            </div>
            <div className="text-xs text-muted-foreground mt-1">vs intraday avg</div>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-2">RSI Zone</div>
            <Badge variant="outline">{data.rsi_zone}</Badge>
            <div className="text-xs text-muted-foreground mt-2">RSI(14): {data.rsi_14}</div>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-2">MACD Momentum</div>
            <Badge variant="outline" className={data.macd_state.toLowerCase().includes("bullish") ? "border-bull text-bull" : "border-bear text-bear"}>
              {data.macd_state}
            </Badge>
            <div className="text-xs text-muted-foreground mt-2 number-mono">Hist: {data.macd_hist.toFixed(2)}</div>
          </Card>
        </div>
      </div>

      {/* Volatility */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Volatility</h3>
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Regime</span>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <Badge variant="outline">{data.volatility_regime}</Badge>
            <div className="text-xs text-muted-foreground mt-2 number-mono">ATR%: {data.atr_pct.toFixed(2)}%</div>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-2">ATR Stop Guide</div>
            <div className="space-y-1 text-xs number-mono">
              <div>Tight: ${(data.atr_14 * 0.5).toFixed(2)}</div>
              <div>Standard: ${(data.atr_14 * 1.0).toFixed(2)}</div>
              <div>Loose: ${(data.atr_14 * 1.5).toFixed(2)}</div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-2">Bollinger State</div>
            <Badge variant="outline">{data.bb_state}</Badge>
            <div className="text-xs text-muted-foreground mt-2 number-mono">Width: {data.bb_width_pct.toFixed(1)}%</div>
          </Card>
        </div>
      </div>

      {/* Structure & Levels */}
      <div>
        <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Structure & Levels</h3>
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-2">Range vs Yesterday</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">To Prev High:</span>
                <span className="number-mono bear-text">+{data.distance_prev_high_pct.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To Prev Low:</span>
                <span className="number-mono bull-text">-{data.distance_prev_low_pct.toFixed(2)}%</span>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-2">Opening Range</div>
            <Badge variant="outline" className="text-xs">{data.opening_range_status}</Badge>
          </Card>

          <Card className="p-4">
            <div className="text-xs text-muted-foreground mb-2">Premarket Context</div>
            <div className="text-sm font-medium">{data.premarket_context}</div>
          </Card>
        </div>
      </div>
    </div>
  );
};
