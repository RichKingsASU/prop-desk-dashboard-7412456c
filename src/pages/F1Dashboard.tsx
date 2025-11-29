import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { WatchlistTower } from "@/components/f1/WatchlistTower";
import { TelemetryChart } from "@/components/f1/TelemetryChart";
import { BattleStation } from "@/components/f1/BattleStation";
import { RadioFeed } from "@/components/f1/RadioFeed";
import { VitalsBar } from "@/components/f1/VitalsBar";
import { IndicatorStrip } from "@/components/f1/IndicatorStrip";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useLayout } from "@/contexts/LayoutContext";

const F1Dashboard = () => {
  const navigate = useNavigate();
  const [currentSymbol, setCurrentSymbol] = useState("SPY");
  const [secondSymbol, setSecondSymbol] = useState("QQQ");
  const [splitMode, setSplitMode] = useState(false);
  const { layout } = useLayout();

  // Dynamic snapshot data for indicator cards
  const [snapshotData, setSnapshotData] = useState({
    rsi_14: 64,
    rsi_zone: "Bullish",
    macd_state: "Bullish",
    rvol: 1.8,
    trend_bias: "Bullish",
    volatility_regime: "Normal",
  });

  // Simulate real-time data updates every 3-5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSnapshotData((prev) => {
        // Simulate RSI fluctuation
        const rsiDelta = (Math.random() - 0.5) * 8;
        const newRSI = Math.max(30, Math.min(85, prev.rsi_14 + rsiDelta));
        
        let rsiZone = "Neutral";
        if (newRSI >= 70) rsiZone = "Overbought";
        else if (newRSI >= 55) rsiZone = "Bullish";
        else if (newRSI <= 30) rsiZone = "Oversold";
        else if (newRSI <= 45) rsiZone = "Bearish";

        // Simulate MACD state changes
        const macdRoll = Math.random();
        let macdState = prev.macd_state;
        if (macdRoll < 0.15) macdState = "Bullish";
        else if (macdRoll < 0.3) macdState = "Bearish";
        else if (macdRoll < 0.45) macdState = "Neutral";

        // Simulate RVOL spikes
        const rvolDelta = (Math.random() - 0.5) * 0.4;
        const newRVOL = Math.max(0.5, Math.min(3.5, prev.rvol + rvolDelta));

        // Simulate trend bias
        const trendRoll = Math.random();
        let trendBias = prev.trend_bias;
        if (trendRoll < 0.2) trendBias = "Bullish";
        else if (trendRoll < 0.4) trendBias = "Bearish";
        else if (trendRoll < 0.6) trendBias = "Neutral";

        // Simulate volatility regime
        const volRoll = Math.random();
        let volRegime = prev.volatility_regime;
        if (volRoll < 0.15) volRegime = "High";
        else if (volRoll < 0.3) volRegime = "Low";
        else if (volRoll < 0.5) volRegime = "Normal";

        return {
          rsi_14: Math.round(newRSI),
          rsi_zone: rsiZone,
          macd_state: macdState,
          rvol: newRVOL,
          trend_bias: trendBias,
          volatility_regime: volRegime,
        };
      });
    }, Math.random() * 2000 + 3000); // Random interval 3-5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleOpenConsole = (symbol: string) => {
    navigate(`/console/${symbol}`);
  };

  // Mock data
  const accountData = {
    equity: 125000.50,
    dayPnl: 650.75,
    dayPnlPct: 0.52,
    buyingPower: 200000.00,
    maxBuyingPower: 250000.00,
  };

  const chartData = {
    symbol: currentSymbol,
    currentPrice: 432.15,
    change: 1.23,
    changePct: 0.29,
    openPnL: 165.00,
    positionSize: 10,
  };

  const secondChartData = {
    symbol: secondSymbol,
    currentPrice: 389.50,
    change: -0.85,
    changePct: -0.22,
    openPnL: -45.00,
    positionSize: 5,
  };

  // Dynamic grid layout based on visible components
  const gridClasses = useMemo(() => {
    const hasWatchlist = layout.showWatchlist;
    const hasBattle = layout.showBattleStation;
    const hasRadio = layout.showRadioFeed;
    
    if (!hasWatchlist && !hasBattle && !hasRadio) return "grid-cols-1";
    if (!hasWatchlist && !hasBattle) return "grid-cols-10";
    if (!hasWatchlist && !hasRadio) return "grid-cols-10";
    if (!hasWatchlist) return "grid-cols-10";
    if (!hasBattle && !hasRadio) return "grid-cols-9";
    return "grid-cols-12";
  }, [layout.showWatchlist, layout.showBattleStation, layout.showRadioFeed]);

  const telemetryColSpan = useMemo(() => {
    const hasWatchlist = layout.showWatchlist;
    const hasRight = layout.showBattleStation || layout.showRadioFeed;
    
    if (!hasWatchlist && !hasRight) return "col-span-1";
    if (!hasWatchlist) return "col-span-7";
    if (!hasRight) return "col-span-10";
    return "col-span-7";
  }, [layout.showWatchlist, layout.showBattleStation, layout.showRadioFeed]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <DashboardHeader
        currentSymbol={currentSymbol}
        onSymbolChange={setCurrentSymbol}
        environment="production"
        equity={accountData.equity}
        dayPnl={accountData.dayPnl}
        dayPnlPct={accountData.dayPnlPct}
        splitMode={splitMode}
        onSplitModeToggle={() => setSplitMode(!splitMode)}
        secondSymbol={secondSymbol}
        onSecondSymbolChange={setSecondSymbol}
      />

      {/* Top Bar - Vitals */}
      {layout.showVitalsBar && (
        <div className="px-4 pt-4 animate-fade-in">
          <VitalsBar
            equity={accountData.equity}
            buyingPower={accountData.buyingPower}
            maxBuyingPower={accountData.maxBuyingPower}
            dayPnl={accountData.dayPnl}
            dayPnlPct={accountData.dayPnlPct}
          />
        </div>
      )}

      {/* Indicator Strip */}
      {layout.showIndicatorStrip && (
        <div className="animate-fade-in">
          <IndicatorStrip snapshotData={snapshotData} />
        </div>
      )}

      {/* Main Grid Layout */}
      <div className={`flex-1 grid ${gridClasses} gap-4 p-4 overflow-hidden transition-all duration-300 ease-in-out`}>
        {/* Left Sidebar - Watchlist Tower (2 cols) */}
        {layout.showWatchlist && (
          <div className="col-span-2 animate-fade-in">
            <WatchlistTower 
              onSymbolClick={setCurrentSymbol}
              onSymbolDoubleClick={handleOpenConsole}
            />
          </div>
        )}

        {/* Center - Telemetry Chart (dynamic cols) */}
        {layout.showTelemetry && (
          <div className={`${telemetryColSpan} animate-fade-in transition-all duration-300`}>
            {splitMode ? (
              <div className="grid grid-cols-2 gap-4 h-full">
                <TelemetryChart {...chartData} onOpenConsole={() => handleOpenConsole(chartData.symbol)} />
                <TelemetryChart {...secondChartData} onOpenConsole={() => handleOpenConsole(secondChartData.symbol)} />
              </div>
            ) : (
              <TelemetryChart {...chartData} onOpenConsole={() => handleOpenConsole(chartData.symbol)} />
            )}
          </div>
        )}

        {/* Right Panel - Battle Station + Radio Feed (3 cols) */}
        {(layout.showBattleStation || layout.showRadioFeed) && (
          <div className="col-span-3 space-y-4 animate-fade-in">
            {/* Battle Station - Top */}
            {layout.showBattleStation && (
              <div className={layout.showRadioFeed ? "h-[calc(50%-0.5rem)]" : "h-full"}>
                <BattleStation symbol={currentSymbol} />
              </div>
            )}

            {/* Radio Feed - Bottom */}
            {layout.showRadioFeed && (
              <div className={layout.showBattleStation ? "h-[calc(50%-0.5rem)]" : "h-full"}>
                <RadioFeed />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default F1Dashboard;
