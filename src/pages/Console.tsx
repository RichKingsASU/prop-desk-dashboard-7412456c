import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Wifi, WifiOff } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StructureMap } from "@/components/console/StructureMap";
import { ExecutionChart } from "@/components/console/ExecutionChart";
import { DecisionStrip } from "@/components/console/DecisionStrip";
import { FlowMomentum } from "@/components/console/FlowMomentum";
import { ConsolePositionCard } from "@/components/console/ConsolePositionCard";
import { MicroNotes } from "@/components/console/MicroNotes";
import { TradeHistoryTable } from "@/components/console/TradeHistoryTable";
import { TrailingStopControl } from "@/components/expert/TrailingStopControl";
import { LiquidityKpi } from "@/components/expert/LiquidityKpi";
import { PerformanceKpi } from "@/components/expert/PerformanceKpi";
import { PerformanceChart } from "@/components/expert/PerformanceChart";
import { RiskCalculator } from "@/components/expert/RiskCalculator";
import { OptionChainSelector } from "@/components/expert/OptionChainSelector";
import { OrderEntryPanel } from "@/components/expert/OrderEntryPanel";
import { BattlegroundMode } from "@/components/expert/BattlegroundMode";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimePrice } from "@/hooks/useRealtimePrice";
import { useTrailingStopAutomation } from "@/hooks/useTrailingStopAutomation";
import { useToast } from "@/hooks/use-toast";
import { StopLossConfig } from "@/utils/stopCalculations";

const Console = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const { toast } = useToast();
  const [snapshotData, setSnapshotData] = useState<any>(null);
  const [levelsData, setLevelsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [trailingStopEnabled, setTrailingStopEnabled] = useState(false);
  const [stopConfig, setStopConfig] = useState<StopLossConfig>({
    type: 'trailing',
    trailingDistance: 1.5,
    trailingUnit: 'atr',
  });
  const [selectedOptionContract, setSelectedOptionContract] = useState<any>(null);
  const [calculatedPositionSize, setCalculatedPositionSize] = useState<number>(0);
  const [battlegroundOpen, setBattlegroundOpen] = useState(false);
  const [battlegroundLevel, setBattlegroundLevel] = useState(236.50);

  // Handle real-time price updates
  const handlePriceUpdate = useCallback((update: any) => {
    setSnapshotData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        last_price: update.price,
        last_price_change: update.change,
        last_price_change_pct: update.change_pct,
        timestamp: update.timestamp,
      };
    });
    setLastUpdate(new Date());
  }, []);

  // WebSocket connection for real-time prices
  const { connected } = useRealtimePrice(symbol || "SPY", handlePriceUpdate);

  // Mock position for trailing stop automation
  const mockPosition = {
    symbol: symbol || "SPY",
    side: 'long' as const,
    entryPrice: 430.50,
    currentPrice: snapshotData?.last_price || 432.15,
    quantity: 100,
  };

  // Trailing stop automation
  const { currentStopLevel, distance } = useTrailingStopAutomation({
    position: mockPosition,
    config: stopConfig,
    enabled: trailingStopEnabled,
    atrValue: snapshotData?.atr_14,
  });

  useEffect(() => {
    // Mock data fetching - replace with actual API calls
    const fetchData = async () => {
      setLoading(true);
      
      // Mock snapshot data
      setSnapshotData({
        symbol: symbol,
        last_price: 432.15,
        last_price_change: 1.23,
        last_price_change_pct: 0.29,
        company_name: symbol === "SPY" ? "SPDR S&P 500 ETF" : `${symbol} Inc.`,
        timestamp: new Date().toISOString(),
        trend_bias: "Bullish",
        vwap: 430.80,
        vwap_position_pct: 0.31,
        trend_strength_score: 82,
        rvol: 2.8,
        rsi_14: 64,
        rsi_zone: "Bullish",
        macd_state: "Bullish",
        volatility_regime: "High",
        bb_state: "Expanded",
        atr_14: 1.25,
        atr_pct: 0.85,
        day_bias: "Bullish",
      });

      // Mock levels data
      setLevelsData({
        prev_day_high: 433.50,
        prev_day_low: 428.20,
        prev_day_close: 430.92,
        premarket_high: 432.80,
        premarket_low: 430.10,
        orh_5m: 432.50,
        orl_5m: 430.50,
        intraday_high: 433.15,
        intraday_low: 429.85,
        daily_high: 440.20,
        daily_low: 425.10,
        hour_4_high: 434.00,
        hour_4_low: 429.50,
        hour_1_high: 433.00,
        hour_1_low: 431.20,
      });

      setLoading(false);
      setLastUpdate(new Date());
    };

    fetchData();

    // Refresh snapshot and levels every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [symbol]);

  // Show connection status changes
  useEffect(() => {
    if (connected) {
      toast({
        title: "Live Data Connected",
        description: "Streaming real-time price updates",
      });
    }
  }, [connected, toast]);

  const currentTime = new Date();
  const hour = currentTime.getHours();
  const session = hour < 9 || (hour === 9 && currentTime.getMinutes() < 30) 
    ? "Pre-Market" 
    : hour >= 16 
    ? "After-Hours" 
    : "Regular";

  return (
    <div className="min-h-screen bg-background">
      {/* Top Symbol Bar */}
      <div className="border-b border-border bg-card">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              
              <div className="border-l border-border pl-4">
                <div className="flex items-baseline gap-3">
                  <h1 className="text-2xl font-bold">{symbol}</h1>
                  {!loading && snapshotData && (
                    <>
                      <span className="text-sm text-muted-foreground">
                        {snapshotData.company_name}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-semibold number-mono">
                          ${snapshotData.last_price.toFixed(2)}
                        </span>
                        <span className={snapshotData.last_price_change >= 0 ? "text-bull" : "text-bear"}>
                          {snapshotData.last_price_change >= 0 ? "+" : ""}
                          {snapshotData.last_price_change.toFixed(2)} (
                          {snapshotData.last_price_change_pct >= 0 ? "+" : ""}
                          {snapshotData.last_price_change_pct.toFixed(2)}%)
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="flex gap-2 mt-2">
                  {!loading && snapshotData && (
                    <>
                      <Badge variant={snapshotData.day_bias === "Bullish" ? "default" : "secondary"}>
                        {snapshotData.day_bias}
                      </Badge>
                      <Badge variant="outline">{session}</Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        {connected ? (
                          <>
                            <Wifi className="h-3 w-3 text-bull" />
                            <span>Live</span>
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-3 w-3 text-muted-foreground" />
                            <span>Delayed</span>
                          </>
                        )}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Updated {new Date(lastUpdate).toLocaleTimeString()}
                      </span>
                    </>
                  )}
                  {loading && (
                    <>
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-16" />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column - Structure Map & Expert Controls */}
          <div className="lg:col-span-3 space-y-4">
            <StructureMap 
              snapshotData={snapshotData} 
              levelsData={levelsData} 
              loading={loading} 
            />
            
            <Button 
              onClick={() => setBattlegroundOpen(true)}
              className="w-full"
              variant="outline"
              size="lg"
            >
              ⚔️ Engage Battleground Mode
            </Button>
            
            {/* Expert Trader Modules */}
            <LiquidityKpi 
              rvol={snapshotData?.rvol}
              ticksPerMinute={350}
              avgTicksPerMinute={120}
              tradesPerMinute={45}
              loading={loading}
            />
            
            <PerformanceKpi 
              winRate={72}
              avgRR={2.3}
              edge={0.34}
              totalTrades={50}
              loading={loading}
            />
            
            <PerformanceChart loading={loading} />
            
            <RiskCalculator 
              symbol={symbol || "SPY"}
              currentPrice={snapshotData?.last_price}
              atrValue={snapshotData?.atr_14}
              loading={loading}
              selectedOption={selectedOptionContract}
              onCalculate={(results) => setCalculatedPositionSize(results.positionSize)}
            />
            
            <OptionChainSelector
              symbol={symbol || "SPY"}
              currentPrice={snapshotData?.last_price}
              loading={loading}
              onSelect={(contract) => {
                setSelectedOptionContract(contract);
              }}
            />
            
            <OrderEntryPanel
              symbol={symbol || "SPY"}
              selectedOption={selectedOptionContract}
              calculatedSize={calculatedPositionSize}
              loading={loading}
            />
          </div>

          {/* Center Column - Execution Chart + Decision Strip */}
          <div className="lg:col-span-6 space-y-4">
            <ExecutionChart 
              symbol={symbol || "SPY"} 
              levelsData={levelsData} 
              currentPrice={snapshotData?.last_price}
              vwap={snapshotData?.vwap}
              atr={snapshotData?.atr_14}
              loading={loading}
            />
            
            <DecisionStrip 
              snapshotData={snapshotData}
              levelsData={levelsData}
              loading={loading}
            />
          </div>

          {/* Right Column - Flow & Position */}
          <div className="lg:col-span-3 space-y-4">
            <FlowMomentum 
              snapshotData={snapshotData} 
              loading={loading} 
            />
            
            <ConsolePositionCard 
              symbol={symbol || "SPY"}
              currentPrice={snapshotData?.last_price}
              levelsData={levelsData}
              loading={loading}
            />
            
            {/* Trailing Stop Control */}
            <TrailingStopControl 
              position={mockPosition}
              atrValue={snapshotData?.atr_14}
              onApply={(config) => {
                setStopConfig(config);
                setTrailingStopEnabled(true);
              }}
            />
            
            {trailingStopEnabled && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Live Stop Monitor</CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Current Stop:</span>
                    <span className="font-mono font-semibold text-foreground">
                      ${currentStopLevel.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Distance:</span>
                    <span className="font-mono text-foreground">
                      {distance.percent.toFixed(2)}% / {distance.atr?.toFixed(2)} ATR
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Risk ($):</span>
                    <span className="font-mono text-foreground">
                      ${distance.dollars.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <MicroNotes 
              defaultSymbol={symbol || "SPY"} 
            />
          </div>
        </div>
      </div>

      {/* Bottom Section - Trade History */}
      <div className="p-6">
        <TradeHistoryTable symbol={symbol} />
      </div>

      {/* Battleground Mode Dialog */}
      <BattlegroundMode 
        open={battlegroundOpen}
        onOpenChange={setBattlegroundOpen}
        symbol={symbol || "SPY"}
        priceLevel={battlegroundLevel}
        currentPrice={snapshotData?.last_price || 432.15}
      />
    </div>
  );
};

export default Console;
