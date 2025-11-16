import { useEffect, useRef, useState } from 'react';

interface PriceUpdate {
  symbol: string;
  price: number;
  change: number;
  change_pct: number;
  timestamp: string;
}

export const useRealtimePrice = (symbol: string, onPriceUpdate: (update: PriceUpdate) => void) => {
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const connect = () => {
      // Mock WebSocket connection - replace with actual WebSocket endpoint
      // For now, simulate real-time updates every 2-3 seconds
      const mockInterval = setInterval(() => {
        const mockUpdate: PriceUpdate = {
          symbol,
          price: 432.15 + (Math.random() - 0.5) * 2,
          change: 1.23 + (Math.random() - 0.5) * 0.5,
          change_pct: 0.29 + (Math.random() - 0.5) * 0.1,
          timestamp: new Date().toISOString(),
        };
        onPriceUpdate(mockUpdate);
      }, 2000);

      setConnected(true);

      // Cleanup function
      return () => {
        clearInterval(mockInterval);
      };

      /* Actual WebSocket implementation (when backend is ready):
      try {
        const ws = new WebSocket(`wss://your-api.com/ws/price/${symbol}`);
        
        ws.onopen = () => {
          console.log(`WebSocket connected for ${symbol}`);
          setConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const update: PriceUpdate = JSON.parse(event.data);
            onPriceUpdate(update);
          } catch (error) {
            console.error('Failed to parse price update:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected, attempting reconnect...');
          setConnected(false);
          
          // Attempt to reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000);
        };

        wsRef.current = ws;

        return () => {
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          if (wsRef.current) {
            wsRef.current.close();
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
      }
      */
    };

    const cleanup = connect();

    return () => {
      if (cleanup) cleanup();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol, onPriceUpdate]);

  return { connected };
};
