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
    updateStreamStatus(id, 'connecting');
    setTimeout(() => updateStreamStatus(id, 'connected'), 1500);
  }, [updateStreamStatus]);

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
      getAggregateStats
    }}>
      {children}
    </DataStreamContext.Provider>
  );
};
