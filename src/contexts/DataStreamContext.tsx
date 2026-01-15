import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

export type StreamType = "price" | "options" | "news" | "level2" | "trades" | "account";
export type StreamStatus = "connected" | "disconnected" | "connecting" | "error" | "paused";

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
  // Real WebSocket connection metadata (optional)
  url?: string;
  protocols?: string[];
  isReal?: boolean;
}

export interface StreamMetricsSnapshot {
  timestamp: Date;
  totalMessagesPerSecond: number;
  streamMetrics: Record<string, number>;
}

interface DataStreamContextType {
  streams: DataStream[];
  metricsHistory: StreamMetricsSnapshot[];
  registerStream: (stream: Omit<DataStream, "messageCount" | "messagesPerSecond" | "errorCount" | "reconnectAttempts">) => void;
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
  if (!context) throw new Error("useDataStreams must be used within DataStreamProvider");
  return context;
};

const DEFAULT_STREAMS: Omit<
  DataStream,
  "messageCount" | "messagesPerSecond" | "errorCount" | "reconnectAttempts"
>[] = [
  {
    id: "market-data-1m",
    name: "Market Data (1m)",
    type: "price",
    exchange: "api",
    symbols: ["SPY", "AAPL", "TSLA"],
    status: "disconnected",
    lastMessage: null,
    latencyMs: 0,
    lastError: null,
    connectedAt: null,
  },
  {
    id: "live-quotes",
    name: "Live Quotes",
    type: "level2",
    exchange: "api",
    symbols: ["*"],
    status: "disconnected",
    lastMessage: null,
    latencyMs: 0,
    lastError: null,
    connectedAt: null,
  },
  {
    id: "news-events",
    name: "News Events",
    type: "news",
    exchange: "api",
    symbols: ["*"],
    status: "disconnected",
    lastMessage: null,
    latencyMs: 0,
    lastError: null,
    connectedAt: null,
  },
  {
    id: "options-flow",
    name: "Options Flow",
    type: "options",
    exchange: "api",
    symbols: ["*"],
    status: "disconnected",
    lastMessage: null,
    latencyMs: 0,
    lastError: null,
    connectedAt: null,
  },
];

export const DataStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [streams, setStreams] = useState<DataStream[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<StreamMetricsSnapshot[]>([]);
  const messageCountsRef = useRef<Record<string, number[]>>({});

  // Initialize streams (API-backed; real connections are wired separately).
  useEffect(() => {
    const initialStreams = DEFAULT_STREAMS.map((s) => ({
      ...s,
      messageCount: 0,
      messagesPerSecond: 0,
      errorCount: 0,
      reconnectAttempts: 0,
    }));
    setStreams(initialStreams);
  }, []);

  // Calculate messages per second every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      setStreams((prev) =>
        prev.map((stream) => {
          const counts = messageCountsRef.current[stream.id] || [];
          const recentCounts = counts.filter((t) => now - t < 1000);
          messageCountsRef.current[stream.id] = recentCounts;
          return { ...stream, messagesPerSecond: recentCounts.length };
        }),
      );

      setMetricsHistory((prev) => {
        const streamMetrics: Record<string, number> = {};
        let totalMps = 0;

        Object.entries(messageCountsRef.current).forEach(([id, counts]) => {
          const mps = counts.filter((t) => now - t < 1000).length;
          streamMetrics[id] = mps;
          totalMps += mps;
        });

        const snapshot: StreamMetricsSnapshot = {
          timestamp: new Date(),
          totalMessagesPerSecond: totalMps,
          streamMetrics,
        };

        return [...prev.slice(-300), snapshot];
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const recordMessageInternal = useCallback((streamId: string, latencyMs?: number) => {
    const now = Date.now();
    if (!messageCountsRef.current[streamId]) messageCountsRef.current[streamId] = [];
    messageCountsRef.current[streamId].push(now);

    setStreams((prev) =>
      prev.map((s) =>
        s.id === streamId
          ? {
              ...s,
              lastMessage: new Date(),
              messageCount: s.messageCount + 1,
              latencyMs: latencyMs ?? s.latencyMs,
            }
          : s,
      ),
    );
  }, []);

  const registerStream = useCallback(
    (stream: Omit<DataStream, "messageCount" | "messagesPerSecond" | "errorCount" | "reconnectAttempts">) => {
      setStreams((prev) => [
        ...prev,
        { ...stream, messageCount: 0, messagesPerSecond: 0, errorCount: 0, reconnectAttempts: 0 },
      ]);
      messageCountsRef.current[stream.id] = [];
    },
    [],
  );

  const unregisterStream = useCallback((id: string) => {
    setStreams((prev) => prev.filter((s) => s.id !== id));
    delete messageCountsRef.current[id];
  }, []);

  const updateStreamStatus = useCallback((id: string, status: StreamStatus, error?: string) => {
    setStreams((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status,
              lastError: error || s.lastError,
              errorCount: error ? s.errorCount + 1 : s.errorCount,
              reconnectAttempts: status === "connecting" ? s.reconnectAttempts + 1 : s.reconnectAttempts,
              connectedAt: status === "connected" && s.status !== "connected" ? new Date() : s.connectedAt,
            }
          : s,
      ),
    );
  }, []);

  const recordMessage = useCallback((id: string, latencyMs?: number) => recordMessageInternal(id, latencyMs), [
    recordMessageInternal,
  ]);

  const pauseStream = useCallback((id: string) => updateStreamStatus(id, "paused"), [updateStreamStatus]);
  const resumeStream = useCallback((id: string) => updateStreamStatus(id, "connected"), [updateStreamStatus]);

  const reconnectStream = useCallback(
    (id: string) => {
      updateStreamStatus(id, "connecting");
      setTimeout(() => updateStreamStatus(id, "connected"), 750);
    },
    [updateStreamStatus],
  );

  const reconnectAll = useCallback(() => {
    streams.forEach((s) => reconnectStream(s.id));
  }, [streams, reconnectStream]);

  const pauseAll = useCallback(() => {
    streams.forEach((s) => pauseStream(s.id));
  }, [streams, pauseStream]);

  const resumeAll = useCallback(() => {
    streams.forEach((s) => resumeStream(s.id));
  }, [streams, resumeStream]);

  const getAggregateStats = useCallback(() => {
    return {
      totalStreams: streams.length,
      connected: streams.filter((s) => s.status === "connected").length,
      errors: streams.filter((s) => s.status === "error").length,
      totalMps: streams.reduce((sum, s) => sum + s.messagesPerSecond, 0),
    };
  }, [streams]);

  const connectRealStream = useCallback(
    (id: string, url: string, symbols: string[], protocols?: string[]) => {
      setStreams((prev) => prev.map((s) => (s.id === id ? { ...s, url, protocols, isReal: true } : s)));
      updateStreamStatus(id, "connected");

      // Placeholder: real WS management lives in WebSocketManager.
      if (symbols.length > 0) recordMessageInternal(id);
    },
    [updateStreamStatus, recordMessageInternal],
  );

  const disconnectRealStream = useCallback(
    (id: string) => {
      setStreams((prev) => prev.map((s) => (s.id === id ? { ...s, isReal: false, url: undefined, protocols: undefined } : s)));
      updateStreamStatus(id, "disconnected");
    },
    [updateStreamStatus],
  );

  return (
    <DataStreamContext.Provider
      value={{
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
        disconnectRealStream,
      }}
    >
      {children}
    </DataStreamContext.Provider>
  );
};

