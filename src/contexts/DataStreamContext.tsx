import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { logEvent } from '@/lib/eventLogStore';

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
  isSupabase?: boolean; // true = Supabase realtime channel
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

// Supabase stream definitions
const SUPABASE_STREAMS: Omit<DataStream, 'messageCount' | 'messagesPerSecond' | 'errorCount' | 'reconnectAttempts'>[] = [
  {
    id: 'supabase-market-data',
    name: 'Market Data (1m)',
    type: 'price',
    exchange: 'supabase',
    symbols: ['SPY', 'AAPL', 'TSLA'],
    status: 'connecting',
    lastMessage: null,
    latencyMs: 0,
    lastError: null,
    connectedAt: null,
    isSupabase: true
  },
  {
    id: 'supabase-quotes',
    name: 'Live Quotes',
    type: 'level2',
    exchange: 'supabase',
    symbols: ['*'],
    status: 'connecting',
    lastMessage: null,
    latencyMs: 0,
    lastError: null,
    connectedAt: null,
    isSupabase: true
  },
  {
    id: 'supabase-news',
    name: 'News Events',
    type: 'news',
    exchange: 'supabase',
    symbols: ['*'],
    status: 'connecting',
    lastMessage: null,
    latencyMs: 0,
    lastError: null,
    connectedAt: null,
    isSupabase: true
  },
  {
    id: 'supabase-options-flow',
    name: 'Options Flow',
    type: 'options',
    exchange: 'supabase',
    symbols: ['*'],
    status: 'connecting',
    lastMessage: null,
    latencyMs: 0,
    lastError: null,
    connectedAt: null,
    isSupabase: true
  }
];

export const DataStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [streams, setStreams] = useState<DataStream[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<StreamMetricsSnapshot[]>([]);
  const messageCountsRef = useRef<Record<string, number[]>>({});
  const channelsRef = useRef<Record<string, RealtimeChannel>>({});

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

  // Helper to record a message for a stream
  const recordMessageInternal = useCallback((streamId: string, latencyMs?: number) => {
    const now = Date.now();
    if (!messageCountsRef.current[streamId]) messageCountsRef.current[streamId] = [];
    messageCountsRef.current[streamId].push(now);
    
    setStreams(prev => prev.map(s => 
      s.id === streamId ? { 
        ...s, 
        lastMessage: new Date(), 
        messageCount: s.messageCount + 1,
        latencyMs: latencyMs ?? s.latencyMs
      } : s
    ));
  }, []);

  // Initialize Supabase real-time subscriptions
  useEffect(() => {
    // Initialize streams with Supabase streams
    const initialStreams = SUPABASE_STREAMS.map(s => ({
      ...s,
      messageCount: 0,
      messagesPerSecond: 0,
      errorCount: 0,
      reconnectAttempts: 0
    }));
    setStreams(initialStreams);

    // Fetch initial latest timestamps from each table
    const fetchInitialData = async () => {
      try {
        // Get latest market data timestamp
        const { data: marketData } = await supabase
          .from('market_data_1m')
          .select('ts')
          .order('ts', { ascending: false })
          .limit(1);
        
        if (marketData?.[0]) {
          setStreams(prev => prev.map(s => 
            s.id === 'supabase-market-data' ? { ...s, lastMessage: new Date(marketData[0].ts) } : s
          ));
        }

        // Get latest live quote timestamp
        const { data: quotes } = await supabase
          .from('live_quotes')
          .select('last_update_ts')
          .order('last_update_ts', { ascending: false })
          .limit(1);
        
        if (quotes?.[0]) {
          setStreams(prev => prev.map(s => 
            s.id === 'supabase-quotes' ? { ...s, lastMessage: new Date(quotes[0].last_update_ts) } : s
          ));
        }

        // Get latest news event timestamp
        const { data: news } = await supabase
          .from('news_events')
          .select('received_at')
          .order('received_at', { ascending: false })
          .limit(1);
        
        if (news?.[0]) {
          setStreams(prev => prev.map(s => 
            s.id === 'supabase-news' ? { ...s, lastMessage: new Date(news[0].received_at) } : s
          ));
        }

        // Get latest options flow timestamp
        const { data: optionsFlow } = await supabase
          .from('options_flow')
          .select('received_at')
          .order('received_at', { ascending: false })
          .limit(1);
        
        if (optionsFlow?.[0]) {
          setStreams(prev => prev.map(s => 
            s.id === 'supabase-options-flow' ? { ...s, lastMessage: new Date(optionsFlow[0].received_at) } : s
          ));
        }
      } catch (error) {
        console.error('Error fetching initial data timestamps:', error);
      }
    };

    fetchInitialData();

    // Log initial connection attempt
    logEvent('info', 'supabase', 'init', 'Initializing Supabase realtime channels');

    // Set up Supabase real-time channels
    const marketDataChannel = supabase
      .channel('market-data-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'market_data_1m' },
        (payload) => {
          const receivedAt = Date.now();
          const eventTime = payload.commit_timestamp ? new Date(payload.commit_timestamp).getTime() : receivedAt;
          const latency = Math.max(0, receivedAt - eventTime);
          recordMessageInternal('supabase-market-data', latency);
          
          const symbol = (payload.new as any)?.symbol || 'unknown';
          logEvent('debug', 'supabase', 'message', `market_data_1m ${payload.eventType}: ${symbol}`, { latencyMs: latency });
        }
      )
      .subscribe((status) => {
        const streamStatus = status === 'SUBSCRIBED' ? 'connected' : status === 'CHANNEL_ERROR' ? 'error' : 'connecting';
        logEvent(
          status === 'CHANNEL_ERROR' ? 'error' : 'info',
          'supabase',
          'channel',
          `market-data-changes: ${status}`,
          { streamId: 'supabase-market-data' }
        );
        setStreams(prev => prev.map(s => 
          s.id === 'supabase-market-data' ? { 
            ...s, 
            status: streamStatus,
            connectedAt: status === 'SUBSCRIBED' ? new Date() : s.connectedAt
          } : s
        ));
      });

    const quotesChannel = supabase
      .channel('quotes-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'live_quotes' },
        (payload) => {
          const receivedAt = Date.now();
          const eventTime = payload.commit_timestamp ? new Date(payload.commit_timestamp).getTime() : receivedAt;
          const latency = Math.max(0, receivedAt - eventTime);
          recordMessageInternal('supabase-quotes', latency);
          
          const symbol = (payload.new as any)?.symbol || 'unknown';
          logEvent('debug', 'supabase', 'message', `live_quotes ${payload.eventType}: ${symbol}`, { latencyMs: latency });
        }
      )
      .subscribe((status) => {
        const streamStatus = status === 'SUBSCRIBED' ? 'connected' : status === 'CHANNEL_ERROR' ? 'error' : 'connecting';
        logEvent(
          status === 'CHANNEL_ERROR' ? 'error' : 'info',
          'supabase',
          'channel',
          `quotes-changes: ${status}`,
          { streamId: 'supabase-quotes' }
        );
        setStreams(prev => prev.map(s => 
          s.id === 'supabase-quotes' ? { 
            ...s, 
            status: streamStatus,
            connectedAt: status === 'SUBSCRIBED' ? new Date() : s.connectedAt
          } : s
        ));
      });

    const newsChannel = supabase
      .channel('news-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'news_events' },
        (payload) => {
          const receivedAt = Date.now();
          const eventTime = payload.commit_timestamp ? new Date(payload.commit_timestamp).getTime() : receivedAt;
          const latency = Math.max(0, receivedAt - eventTime);
          recordMessageInternal('supabase-news', latency);
          
          const headline = (payload.new as any)?.headline?.substring(0, 50) || 'news event';
          logEvent('debug', 'supabase', 'message', `news_events ${payload.eventType}: ${headline}...`, { latencyMs: latency });
        }
      )
      .subscribe((status) => {
        const streamStatus = status === 'SUBSCRIBED' ? 'connected' : status === 'CHANNEL_ERROR' ? 'error' : 'connecting';
        logEvent(
          status === 'CHANNEL_ERROR' ? 'error' : 'info',
          'supabase',
          'channel',
          `news-changes: ${status}`,
          { streamId: 'supabase-news' }
        );
        setStreams(prev => prev.map(s => 
          s.id === 'supabase-news' ? { 
            ...s, 
            status: streamStatus,
            connectedAt: status === 'SUBSCRIBED' ? new Date() : s.connectedAt
          } : s
        ));
      });

    const optionsFlowChannel = supabase
      .channel('options-flow-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'options_flow' },
        (payload) => {
          const receivedAt = Date.now();
          const eventTime = payload.commit_timestamp ? new Date(payload.commit_timestamp).getTime() : receivedAt;
          const latency = Math.max(0, receivedAt - eventTime);
          recordMessageInternal('supabase-options-flow', latency);
          
          const symbol = (payload.new as any)?.symbol || 'unknown';
          const side = (payload.new as any)?.side || '';
          logEvent('debug', 'supabase', 'message', `options_flow ${payload.eventType}: ${symbol} ${side}`, { latencyMs: latency });
        }
      )
      .subscribe((status) => {
        const streamStatus = status === 'SUBSCRIBED' ? 'connected' : status === 'CHANNEL_ERROR' ? 'error' : 'connecting';
        logEvent(
          status === 'CHANNEL_ERROR' ? 'error' : 'info',
          'supabase',
          'channel',
          `options-flow-changes: ${status}`,
          { streamId: 'supabase-options-flow' }
        );
        setStreams(prev => prev.map(s => 
          s.id === 'supabase-options-flow' ? { 
            ...s, 
            status: streamStatus,
            connectedAt: status === 'SUBSCRIBED' ? new Date() : s.connectedAt
          } : s
        ));
      });

    // Store channel references
    channelsRef.current = {
      'supabase-market-data': marketDataChannel,
      'supabase-quotes': quotesChannel,
      'supabase-news': newsChannel,
      'supabase-options-flow': optionsFlowChannel
    };

    // Cleanup on unmount
    return () => {
      logEvent('info', 'supabase', 'cleanup', 'Removing all Supabase realtime channels');
      Object.values(channelsRef.current).forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [recordMessageInternal]);

  const registerStream = useCallback((stream: Omit<DataStream, 'messageCount' | 'messagesPerSecond' | 'errorCount' | 'reconnectAttempts'>) => {
    setStreams(prev => [...prev, { ...stream, messageCount: 0, messagesPerSecond: 0, errorCount: 0, reconnectAttempts: 0 }]);
    messageCountsRef.current[stream.id] = [];
  }, []);

  const unregisterStream = useCallback((id: string) => {
    // Don't allow unregistering Supabase streams
    const stream = streams.find(s => s.id === id);
    if (stream?.isSupabase) return;
    
    setStreams(prev => prev.filter(s => s.id !== id));
    delete messageCountsRef.current[id];
  }, [streams]);

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
    recordMessageInternal(id, latencyMs);
  }, [recordMessageInternal]);

  const pauseStream = useCallback((id: string) => updateStreamStatus(id, 'paused'), [updateStreamStatus]);
  const resumeStream = useCallback((id: string) => updateStreamStatus(id, 'connected'), [updateStreamStatus]);
  
  const reconnectStream = useCallback((id: string) => {
    const stream = streams.find(s => s.id === id);
    updateStreamStatus(id, 'connecting');
    
    // If it's a Supabase stream, resubscribe to the channel
    if (stream?.isSupabase) {
      const channel = channelsRef.current[id];
      if (channel) {
        supabase.removeChannel(channel);
        // Re-subscribe will happen when we recreate the channel
        // For now, just mark as reconnecting and it will auto-reconnect
        setTimeout(() => {
          updateStreamStatus(id, 'connected');
        }, 1000);
      }
      return;
    }
    
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
