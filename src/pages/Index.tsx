import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { AccountPanel } from "@/components/AccountPanel";
import { BotStatusPanel } from "@/components/BotStatusPanel";
import { MasterControlPanel } from "@/components/MasterControlPanel";
import { KPIGrid } from "@/components/KPIGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

      <div className="flex gap-4 p-4">
        {/* Left Column - Analysis */}
        <div className="flex-1">
          <Tabs defaultValue="kpis" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
              <TabsTrigger value="chart" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Chart
              </TabsTrigger>
              <TabsTrigger value="kpis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                KPIs
              </TabsTrigger>
              <TabsTrigger value="options" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Options Chain
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="chart" className="mt-0">
                <div className="trading-card p-8 h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">Chart visualization coming soon</p>
                    <p className="text-xs text-muted-foreground">Will display candlestick chart with overlays</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="kpis" className="mt-0">
                <KPIGrid data={snapshotData} loading={false} />
              </TabsContent>

              <TabsContent value="options" className="mt-0">
                <div className="trading-card p-8 h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">Options Chain coming soon</p>
                    <p className="text-xs text-muted-foreground">Will display full options chain with Greeks</p>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Right Column - Command & Status */}
        <div className="w-80 space-y-4">
          <AccountPanel data={accountData} loading={false} />
          
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Options Positions</h3>
            <div className="trading-card p-4 text-center text-sm text-muted-foreground">
              No positions
            </div>
          </div>

          <BotStatusPanel data={botStatus} loading={false} />
          
          <MasterControlPanel
            controls={botControls}
            onControlChange={handleControlChange}
            onPanic={handlePanic}
          />

          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">News & Alerts</h3>
            <div className="trading-card p-4 text-center text-sm text-muted-foreground">
              No recent news
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Trade History */}
      <div className="p-4 pt-0">
        <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Trade History</h3>
        <div className="trading-card p-8 text-center text-sm text-muted-foreground">
          No recent trades
        </div>
      </div>
    </div>
  );
};

export default Index;
