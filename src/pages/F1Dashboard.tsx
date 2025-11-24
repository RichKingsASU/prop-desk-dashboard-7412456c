import { useState } from "react";
import { WatchlistTower } from "@/components/f1/WatchlistTower";
import { TelemetryChart } from "@/components/f1/TelemetryChart";
import { BattleStation } from "@/components/f1/BattleStation";
import { RadioFeed } from "@/components/f1/RadioFeed";
import { VitalsBar } from "@/components/f1/VitalsBar";
import { DashboardHeader } from "@/components/DashboardHeader";

const F1Dashboard = () => {
  const [currentSymbol, setCurrentSymbol] = useState("SPY");

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
      />

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Sidebar - Watchlist Tower (2 cols) */}
        <div className="col-span-2">
          <WatchlistTower onSymbolClick={setCurrentSymbol} />
        </div>

        {/* Center - Telemetry Chart (7 cols) */}
        <div className="col-span-7">
          <TelemetryChart {...chartData} />
        </div>

        {/* Right Panel - Battle Station + Radio Feed (3 cols) */}
        <div className="col-span-3 space-y-4">
          {/* Battle Station - Top */}
          <div className="h-[calc(50%-0.5rem)]">
            <BattleStation symbol={currentSymbol} />
          </div>

          {/* Radio Feed - Bottom */}
          <div className="h-[calc(50%-0.5rem)]">
            <RadioFeed />
          </div>
        </div>
      </div>

      {/* Bottom Bar - Vitals */}
      <div className="px-4 pb-4">
        <VitalsBar
          equity={accountData.equity}
          buyingPower={accountData.buyingPower}
          maxBuyingPower={accountData.maxBuyingPower}
          dayPnl={accountData.dayPnl}
          dayPnlPct={accountData.dayPnlPct}
        />
      </div>
    </div>
  );
};

export default F1Dashboard;
