import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MarketOverview } from "@/components/MarketOverview";
import { MarketTicker } from "@/components/MarketTicker";
import { AccountPanel } from "@/components/AccountPanel";
import { BotStatusPanel } from "@/components/BotStatusPanel";
import { MasterControlPanel } from "@/components/MasterControlPanel";
import { KPIGrid } from "@/components/KPIGrid";
import { TradingViewChart } from "@/components/TradingViewChart";
import { OptionsChain } from "@/components/OptionsChain";
import { OptionsPositionsTable } from "@/components/OptionsPositionsTable";
import { OptionsOrderTicket } from "@/components/OptionsOrderTicket";
import { NewsAlertsPanel } from "@/components/NewsAlertsPanel";
import { TraderNotesWidget } from "@/components/TraderNotesWidget";
import { TradeHistoryTable } from "@/components/TradeHistoryTable";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
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

  const handleOpenConsole = () => {
    navigate(`/console/${currentSymbol}`);
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
        {/* Top Row - Market Overview + Console Button */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Market Overview</h2>
            <Button onClick={handleOpenConsole} size="sm" variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Open Decision Console
            </Button>
          </div>
          <MarketOverview />
        </div>

        {/* Middle Row - Chart & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Chart & Options Section - 2/3 width */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="chart" className="w-full">
              <TabsList className="w-full justify-start mb-4">
                <TabsTrigger value="chart" className="flex-1 max-w-[120px]">Chart</TabsTrigger>
                <TabsTrigger value="kpis" className="flex-1 max-w-[120px]">KPIs</TabsTrigger>
                <TabsTrigger value="options" className="flex-1 max-w-[150px]">Options Chain</TabsTrigger>
              </TabsList>
              
              <TabsContent value="chart" className="mt-0">
                <TradingViewChart symbol={currentSymbol} />
              </TabsContent>
              
              <TabsContent value="kpis" className="mt-0">
                <Card className="p-6">
                  <KPIGrid data={snapshotData} loading={!snapshotData} />
                </Card>
              </TabsContent>
              
              <TabsContent value="options" className="mt-0">
                <OptionsChain symbol={currentSymbol} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Command & Status Column - 1/3 width */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Account & Risk</h3>
              <AccountPanel data={accountData} loading={false} />
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Options Positions</h3>
              <OptionsPositionsTable />
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Bot Status</h3>
              <BotStatusPanel data={botStatus} loading={false} />
            </div>
            
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Master Controls</h3>
              <MasterControlPanel
                controls={botControls}
                onControlChange={handleControlChange}
                onPanic={handlePanic}
              />
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Options Order Ticket</h3>
              <OptionsOrderTicket defaultSymbol={currentSymbol} />
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">News & Alerts</h3>
              <NewsAlertsPanel />
            </div>

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Trader Notes</h3>
              <TraderNotesWidget defaultSymbol={currentSymbol} />
            </div>
          </div>
        </div>

        {/* Bottom - Trade History */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Trade History</h3>
          <TradeHistoryTable />
        </div>
      </div>
    </div>
  );
};

export default Index;
