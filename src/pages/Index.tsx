import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MarketOverview } from "@/components/MarketOverview";
import { MarketTicker } from "@/components/MarketTicker";
import { AccountPanel } from "@/components/AccountPanel";
import { BotStatusPanel } from "@/components/BotStatusPanel";
import { MasterControlPanel } from "@/components/MasterControlPanel";
import { KPIGrid } from "@/components/KPIGrid";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const Index = () => {
  const [currentSymbol, setCurrentSymbol] = useState("SPY");
  const [accountData, setAccountData] = useState<any>(null);
  const [botStatus, setBotStatus] = useState<any>(null);
  const [snapshotData, setSnapshotData] = useState<any>(null);
  const [botControls, setBotControls] = useState({
    bot_enabled: true,
    buying_enabled: true,
    selling_enabled: true,
  });

  // Mock data fetching - replace with actual API calls
  useEffect(() => {
    // Mock account data
    setAccountData({
      account_id: "XYZ123",
      environment: "production" as const,
      market: "US Equities & Options",
      equity: 125000.50,
      day_pnl: 650.75,
      day_pnl_pct: 0.52,
      unrealized_pnl: 300.10,
      realized_pnl: 350.65,
      settled_cash: 40000.00,
      buying_power: 200000.00,
      margin_available: 150000.00,
      portfolio_delta: 35.2,
      portfolio_theta: -18.5,
      portfolio_vega: 42.3,
    });

    // Mock bot status
    setBotStatus({
      status: "in_trade" as const,
      current_symbol: "SPY",
      current_side: "long" as const,
      entry_price: 430.50,
      current_price: 432.15,
      position_size: 10,
      pnl_open: 165.00,
    });

    // Mock snapshot data
    setSnapshotData({
      symbol: currentSymbol,
      last_price: 432.15,
      last_price_change: 1.23,
      last_price_change_pct: 0.29,
      timestamp: new Date().toISOString(),
      trend_bias: "Bullish",
      vwap: 430.80,
      vwap_position_pct: 0.31,
      trend_strength_score: 82,
      rvol: 2.8,
      rsi_14: 64,
      rsi_zone: "Bullish",
      macd_state: "Bullish",
      macd: 0.45,
      macd_signal: 0.33,
      macd_hist: 0.12,
      atr_14: 1.25,
      atr_pct: 0.85,
      volatility_regime: "High",
      bb_state: "Expanded",
      bb_width_pct: 3.1,
      distance_prev_high_pct: 1.8,
      distance_prev_low_pct: 3.4,
      opening_range_status: "Above ORH",
      premarket_context: "Trading above PM High",
      day_bias: "Bullish",
      setup_quality_score: 78,
    });
  }, [currentSymbol]);

  const handleSymbolChange = (symbol: string) => {
    setCurrentSymbol(symbol);
    toast.info(`Switched to ${symbol}`);
  };

  const handleControlChange = (controls: typeof botControls) => {
    setBotControls(controls);
    toast.success("Bot controls updated");
    // TODO: POST to /api/bot/set_controls
  };

  const handlePanic = () => {
    toast.error("PANIC EXECUTED - All positions liquidated");
    setBotStatus({ status: "flat" as const });
    setBotControls({
      bot_enabled: false,
      buying_enabled: false,
      selling_enabled: false,
    });
    // TODO: POST to /api/bot/panic
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        currentSymbol={currentSymbol}
        onSymbolChange={handleSymbolChange}
        environment={accountData?.environment || "production"}
        equity={accountData?.equity || 0}
        dayPnl={accountData?.day_pnl || 0}
        dayPnlPct={accountData?.day_pnl_pct || 0}
      />

      {/* Market Ticker Strip */}
      <MarketTicker />

      <div className="p-4 space-y-4">
        {/* Top Row - Market Overview */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-foreground">Market Overview</h2>
          <MarketOverview />
        </div>

        {/* KPIs Grid */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-foreground">Market Analysis</h2>
          <KPIGrid data={snapshotData} loading={!snapshotData} />
        </div>

        {/* Middle Row - Chart & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chart & Options Section - 2/3 width */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-3 text-foreground">Intraday Chart</h2>
              <Card className="p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">Chart visualization coming soon</p>
                  <p className="text-xs text-muted-foreground">Will display candlestick chart with overlays</p>
                </div>
              </Card>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-3 text-foreground">Options Chain</h2>
              <Card className="p-8 h-96 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">Options Chain coming soon</p>
                  <p className="text-xs text-muted-foreground">Will display full options chain with Greeks</p>
                </div>
              </Card>
            </div>
          </div>

          {/* Command & Status Column - 1/3 width */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Account & Risk</h3>
              <AccountPanel data={accountData} loading={false} />
            </div>

            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Options Positions</h3>
              <Card className="p-4 text-center text-sm text-muted-foreground">
                No positions
              </Card>
            </div>
            
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Bot Status</h3>
              <BotStatusPanel data={botStatus} loading={false} />
            </div>
            
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Master Controls</h3>
              <MasterControlPanel
                controls={botControls}
                onControlChange={handleControlChange}
                onPanic={handlePanic}
              />
            </div>

            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">News & Alerts</h3>
              <Card className="p-4 text-center text-sm text-muted-foreground">
                No recent news
              </Card>
            </div>
          </div>
        </div>

        {/* Bottom - Trade History */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Trade History</h3>
          <Card className="p-8 text-center text-sm text-muted-foreground">
            No recent trades
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
