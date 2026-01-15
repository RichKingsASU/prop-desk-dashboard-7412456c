import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ExchangeStatus = "online" | "offline" | "degraded" | "unknown";

export interface Exchange {
  id: string;
  displayName: string;
  status: ExchangeStatus;
  lastCheckAt: Date | null;
  streams: string[];
}

interface ExchangeContextType {
  exchanges: Exchange[];
  selectedExchangeId: string | null;
  setSelectedExchangeId: (id: string | null) => void;
  getExchangeById: (id: string) => Exchange | undefined;
  refreshAll: () => Promise<void>;
}

const ExchangeContext = createContext<ExchangeContextType | null>(null);

export function useExchanges() {
  const ctx = useContext(ExchangeContext);
  if (!ctx) throw new Error("useExchanges must be used within ExchangeProvider");
  return ctx;
}

export const ExchangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedExchangeId, setSelectedExchangeId] = useState<string | null>("api");
  const [exchanges, setExchanges] = useState<Exchange[]>([]);

  useEffect(() => {
    setExchanges([
      {
        id: "api",
        displayName: "API",
        status: "unknown",
        lastCheckAt: null,
        streams: ["market-data-1m", "live-quotes", "news-events", "options-flow"],
      },
      {
        id: "alpaca",
        displayName: "Alpaca",
        status: "unknown",
        lastCheckAt: null,
        streams: [],
      },
    ]);
  }, []);

  const getExchangeById = useMemo(() => {
    return (id: string) => exchanges.find((e) => e.id === id);
  }, [exchanges]);

  const refreshAll = async () => {
    // TODO: query API/system status endpoints.
    setExchanges((prev) => prev.map((e) => ({ ...e, lastCheckAt: new Date() })));
  };

  return (
    <ExchangeContext.Provider value={{ exchanges, selectedExchangeId, setSelectedExchangeId, getExchangeById, refreshAll }}>
      {children}
    </ExchangeContext.Provider>
  );
};

