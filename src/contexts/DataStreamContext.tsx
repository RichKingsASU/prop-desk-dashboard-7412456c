import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

export type StreamType = 'price' | 'options' | 'news' | 'level2' | 'trades' | 'account';
export type StreamStatus = 'connected' | 'disconnected' | 'connecting' | 'error' | 'paused';

export interface DataStream {
  id: string;
  name: string;
  type: StreamType;
  exchange: string;
  symbols: string[];
  status: StreamStatus;
  lastMessage: Date | null;
  messageCount: number;
  messagesPerSecond: number;
  latencyMs: number;
  errorCount: number;
  lastError: string | null;
  reconnectAttempts: number;
  connectedAt: Date | null;
  // New fields for real WebSocket connections
  url?: string;
  protocols?: string[];
  isReal?: boolean; // true = real WebSocket, false = mock
}

export interface StreamMetricsSnapshot {
  timestamp: Date;
  totalMessagesPerSecond: number;
  streamMetrics: Record<string, number>;
}

interface DataStreamContextType {
  streams: DataStream[];
  metricsHistory: StreamMetricsSnapshot[];
  registerStream: (stream: Omit<DataStream, 'messageCount' | 'messagesPerSecond' | 'errorCount' | 'reconnectAttempts'>) => void;
  unregisterStream: (id: string) => void;
  updateStreamStatus: (id: string, status: StreamStatus, error?: string) => void;
  recordMessage: (id: string, latencyMs?: number) => void;
  pauseStream: (id: string) => void;
  resumeStream: (id: string) => void;
  reconnectStream: (id: string) => void;
  reconnectAll: () => void;
  pauseAll: () => void;
  resumeAll: () => void;
  getAggregateStats: () => { totalStreams: number; connected: number; errors: number; totalMps: number };
  connectRealStream: (id: string, url: string, symbols: string[], protocols?: string[]) => void;
  disconnectRealStream: (id: string) => void;
}

const DataStreamContext = createContext<DataStreamContextType | null>(null);

export const useDataStreams = () => {
  const context = useContext(DataStreamContext);
  if (!context) throw new Error('useDataStreams must be used within DataStreamProvider');
  return context;
};

export const DataStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [streams, setStreams] = useState<DataStream[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<StreamMetricsSnapshot[]>([]);
  const messageCountsRef = useRef<Record<string, number[]>>({});

  // Calculate messages per second every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      setStreams(prev => prev.map(stream => {
        const counts = messageCountsRef.current[stream.id] || [];
        const recentCounts = counts.filter(t => now - t < 1000);
        messageCountsRef.current[stream.id] = recentCounts;
        return { ...stream, messagesPerSecond: recentCounts.length };
      }));

      // Record metrics snapshot
      setMetricsHistory(prev => {
        const streamMetrics: Record<string, number> = {};
        let totalMps = 0;
        
        Object.entries(messageCountsRef.current).forEach(([id, counts]) => {
          const mps = counts.filter(t => now - t < 1000).length;
          streamMetrics[id] = mps;
          totalMps += mps;
        });

        const snapshot: StreamMetricsSnapshot = {
          timestamp: new Date(),
          totalMessagesPerSecond: totalMps,
          streamMetrics
        };

        return [...prev.slice(-300), snapshot]; // Keep 5 minutes of history
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialize with mock streams
  useEffect(() => {
    const mockStreams: DataStream[] = [
      {
        id: 'price-polygon',
        name: 'Price Stream',
        type: 'price',
        exchange: 'polygon',
        symbols: ['SPY', 'AAPL', 'TSLA', 'NVDA', 'AMD'],
        status: 'connected',
        lastMessage: new Date(),
        messageCount: 24500,
        messagesPerSecond: 245,
        latencyMs: 8,
        errorCount: 0,
        lastError: null,
        reconnectAttempts: 0,
        connectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'options-opra',
        name: 'Options Flow',
        type: 'options',
        exchange: 'opra',
        symbols: ['SPY', 'QQQ'],
        status: 'connected',
        lastMessage: new Date(),
        messageCount: 8900,
        messagesPerSecond: 89,
        latencyMs: 15,
        errorCount: 0,
        lastError: null,
        reconnectAttempts: 0,
        connectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'news-benzinga',
        name: 'News Feed',
        type: 'news',
        exchange: 'benzinga',
        symbols: ['*'],
        status: 'connected',
        lastMessage: new Date(Date.now() - 12000),
        messageCount: 180,
        messagesPerSecond: 3,
        latencyMs: 120,
        errorCount: 2,
        lastError: 'Timeout on request',
        reconnectAttempts: 1,
        connectedAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        id: 'account-tda',
        name: 'Account Updates',
        type: 'account',
        exchange: 'tda',
        symbols: ['POSITIONS', 'BALANCES', 'ORDERS'],
        status: 'connected',
        lastMessage: new Date(Date.now() - 3000),
        messageCount: 720,
        messagesPerSecond: 1,
        latencyMs: 45,
        errorCount: 0,
        lastError: null,
        reconnectAttempts: 0,
        connectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 'level2-polygon',
        name: 'Level 2 Depth',
        type: 'level2',
        exchange: 'polygon',
        symbols: ['SPY'],
        status: 'connected',
        lastMessage: new Date(),
        messageCount: 45000,
        messagesPerSecond: 450,
        latencyMs: 5,
        errorCount: 0,
        lastError: null,
        reconnectAttempts: 0,
        connectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    ];
    setStreams(mockStreams);
  }, []);

  const registerStream = useCallback((stream: Omit<DataStream, 'messageCount' | 'messagesPerSecond' | 'errorCount' | 'reconnectAttempts'>) => {
    setStreams(prev => [...prev, { ...stream, messageCount: 0, messagesPerSecond: 0, errorCount: 0, reconnectAttempts: 0 }]);
    messageCountsRef.current[stream.id] = [];
  }, []);

  const unregisterStream = useCallback((id: string) => {
    setStreams(prev => prev.filter(s => s.id !== id));
    delete messageCountsRef.current[id];
  }, []);

  const updateStreamStatus = useCallback((id: string, status: StreamStatus, error?: string) => {
    setStreams(prev => prev.map(s => 
      s.id === id ? { 
        ...s, 
        status, 
        lastError: error || s.lastError,
        errorCount: error ? s.errorCount + 1 : s.errorCount,
        reconnectAttempts: status === 'connecting' ? s.reconnectAttempts + 1 : s.reconnectAttempts,
        connectedAt: status === 'connected' && s.status !== 'connected' ? new Date() : s.connectedAt
      } : s
    ));
  }, []);

  const recordMessage = useCallback((id: string, latencyMs?: number) => {
    const now = Date.now();
    if (!messageCountsRef.current[id]) messageCountsRef.current[id] = [];
    messageCountsRef.current[id].push(now);
    
    setStreams(prev => prev.map(s => 
      s.id === id ? { 
        ...s, 
        lastMessage: new Date(), 
        messageCount: s.messageCount + 1,
        latencyMs: latencyMs ?? s.latencyMs
      } : s
    ));
  }, []);

  const pauseStream = useCallback((id: string) => updateStreamStatus(id, 'paused'), [updateStreamStatus]);
  const resumeStream = useCallback((id: string) => updateStreamStatus(id, 'connected'), [updateStreamStatus]);
  
  const reconnectStream = useCallback((id: string) => {
    const stream = streams.find(s => s.id === id);
    updateStreamStatus(id, 'connecting');
    
    // If it's a real WebSocket stream, use the WebSocket manager
    if (stream?.isReal && stream.url) {
      import('@/services/WebSocketManager').then(({ wsManager }) => {
        wsManager.reconnect(id);
      });
    } else {
      // Mock reconnection
      setTimeout(() => updateStreamStatus(id, 'connected'), 1500);
    }
  }, [streams, updateStreamStatus]);

  const reconnectAll = useCallback(() => {
    streams.forEach(s => reconnectStream(s.id));
  }, [streams, reconnectStream]);

  const pauseAll = useCallback(() => {
    streams.forEach(s => pauseStream(s.id));
  }, [streams, pauseStream]);

  const resumeAll = useCallback(() => {
    streams.forEach(s => resumeStream(s.id));
  }, [streams, resumeStream]);

  const getAggregateStats = useCallback(() => {
    return {
      totalStreams: streams.length,
      connected: streams.filter(s => s.status === 'connected').length,
      errors: streams.filter(s => s.status === 'error').length,
      totalMps: streams.reduce((sum, s) => sum + s.messagesPerSecond, 0)
    };
  }, [streams]);

  const connectRealStream = useCallback((id: string, url: string, symbols: string[], protocols?: string[]) => {
    import('@/services/WebSocketManager').then(({ wsManager }) => {
      // Update stream to mark as real
      setStreams(prev => prev.map(s => 
        s.id === id ? { ...s, url, protocols, isReal: true } : s
      ));

      // Set up handlers
      wsManager.onStatusChange(id, (status, error) => {
        const streamStatus = status === 'connected' ? 'connected' : 
                            status === 'connecting' ? 'connecting' :
                            status === 'error' ? 'error' : 'disconnected';
        updateStreamStatus(id, streamStatus, error);
      });

      wsManager.onMessage(id, (data, latencyMs) => {
        recordMessage(id, latencyMs);
      });

      // Connect
      wsManager.connect(id, {
        url,
        protocols,
        reconnectInterval: 5000,
        maxReconnectAttempts: 10
      });

      // Subscribe to symbols once connected
      wsManager.onStatusChange(id, (status) => {
        if (status === 'connected' && symbols.length > 0) {
          wsManager.subscribe(id, symbols);
        }
      });
    });
  }, [updateStreamStatus, recordMessage]);

  const disconnectRealStream = useCallback((id: string) => {
    import('@/services/WebSocketManager').then(({ wsManager }) => {
      wsManager.disconnect(id);
      setStreams(prev => prev.map(s => 
        s.id === id ? { ...s, isReal: false, url: undefined, protocols: undefined } : s
      ));
    });
  }, []);

  return (
    <DataStreamContext.Provider value={{
      streams,
      metricsHistory,
      registerStream,
      unregisterStream,
      updateStreamStatus,
      recordMessage,
      pauseStream,
      resumeStream,
      reconnectStream,
      reconnectAll,
      pauseAll,
      resumeAll,
      getAggregateStats,
      connectRealStream,
      disconnectRealStream
    }}>
      {children}
    </DataStreamContext.Provider>
  );
};
