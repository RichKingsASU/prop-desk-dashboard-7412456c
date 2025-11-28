import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { WatchlistTower } from "@/components/f1/WatchlistTower";
import { TelemetryChart } from "@/components/f1/TelemetryChart";
import { BattleStation } from "@/components/f1/BattleStation";
import { RadioFeed } from "@/components/f1/RadioFeed";
import { VitalsBar } from "@/components/f1/VitalsBar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useLayout } from "@/contexts/LayoutContext";

const F1Dashboard = () => {
  const navigate = useNavigate();
  const [currentSymbol, setCurrentSymbol] = useState("SPY");
  const [secondSymbol, setSecondSymbol] = useState("QQQ");
  const [splitMode, setSplitMode] = useState(false);
  const { layout } = useLayout();

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
