import { useEffect, useRef } from "react";
import { createChart, ColorType } from "lightweight-charts";
import { Card } from "@/components/ui/card";

interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TradingViewChartProps {
  symbol: string;
  data?: CandleData[];
}

export function TradingViewChart({ symbol, data }: TradingViewChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  // Generate mock intraday data if no data provided
  const mockData: CandleData[] = data || Array.from({ length: 100 }, (_, i) => {
    const timestamp = new Date();
    timestamp.setHours(9, 30, 0, 0); // Market open
    timestamp.setMinutes(timestamp.getMinutes() + i);
    
    const basePrice = 432;
    const variation = Math.sin(i / 10) * 3;
    const open = basePrice + variation + (Math.random() - 0.5);
    const close = open + (Math.random() - 0.5) * 2;
    const high = Math.max(open, close) + Math.random() * 0.5;
    const low = Math.min(open, close) - Math.random() * 0.5;
    
    return {
      time: timestamp.toISOString().split('T')[0] + ' ' + 
            timestamp.toTimeString().split(' ')[0].substring(0, 5),
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 100000) + 50000
    };
  });

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Get CSS variables for theming
    const styles = getComputedStyle(document.documentElement);
    const backgroundColor = styles.getPropertyValue('--background').trim();
    const textColor = styles.getPropertyValue('--foreground').trim();
    const gridColor = styles.getPropertyValue('--border').trim();

    // Create chart
    const chart: any = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: `hsl(${backgroundColor})` },
        textColor: `hsl(${textColor})`,
      },
      grid: {
        vertLines: { color: `hsl(${gridColor})` },
        horzLines: { color: `hsl(${gridColor})` },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: `hsl(${gridColor})`,
      },
      crosshair: {
        mode: 1,
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: `hsl(${styles.getPropertyValue('--bull').trim()})`,
      downColor: `hsl(${styles.getPropertyValue('--bear').trim()})`,
      borderVisible: false,
      wickUpColor: `hsl(${styles.getPropertyValue('--bull').trim()})`,
      wickDownColor: `hsl(${styles.getPropertyValue('--bear').trim()})`,
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Add volume series
    const volumeSeries = chart.addHistogramSeries({
      color: `hsl(${styles.getPropertyValue('--muted-foreground').trim()})`,
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    volumeSeriesRef.current = volumeSeries;

    // Set data
    const chartData = mockData.map(d => ({
      time: d.time as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumeData = mockData.map(d => ({
      time: d.time as any,
      value: d.volume,
      color: d.close >= d.open 
        ? `hsl(${styles.getPropertyValue('--bull').trim()} / 0.5)`
        : `hsl(${styles.getPropertyValue('--bear').trim()} / 0.5)`,
    }));

    candlestickSeries.setData(chartData);
    volumeSeries.setData(volumeData);

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol]);

  return (
    <Card className="p-4">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{symbol}</h3>
            <p className="text-sm text-muted-foreground">Intraday - 1 minute intervals</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs font-medium border border-border rounded hover:bg-accent/50 transition-colors">
              1m
            </button>
            <button className="px-3 py-1 text-xs font-medium border border-border rounded hover:bg-accent/50 transition-colors">
              5m
            </button>
            <button className="px-3 py-1 text-xs font-medium border border-border rounded hover:bg-accent/50 transition-colors">
              15m
            </button>
          </div>
        </div>
      </div>
      <div ref={chartContainerRef} />
    </Card>
  );
}
