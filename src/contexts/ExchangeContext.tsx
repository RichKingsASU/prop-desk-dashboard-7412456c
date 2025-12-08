import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type ExchangeType = 'broker' | 'data-provider' | 'options-exchange';
export type ExchangeStatus = 'active' | 'inactive' | 'degraded' | 'maintenance';
export type Capability = 'equities' | 'options' | 'futures' | 'crypto';

export interface RateLimits {
  requestsPerMinute: number;
  requestsUsed: number;
  resetTime: Date;
}

export interface Exchange {
  id: string;
  name: string;
  displayName: string;
  type: ExchangeType;
  status: ExchangeStatus;
  apiVersion: string;
  rateLimits: RateLimits;
  capabilities: Capability[];
  streams: string[];
  lastHealthCheck: Date;
  latencyMs: number;
  errorRate: number;
}

interface ExchangeContextType {
  exchanges: Exchange[];
  addExchange: (exchange: Exchange) => void;
  removeExchange: (id: string) => void;
  updateExchangeStatus: (id: string, status: ExchangeStatus) => void;
  updateRateLimits: (id: string, limits: Partial<RateLimits>) => void;
  testConnection: (id: string) => Promise<boolean>;
  getExchangeById: (id: string) => Exchange | undefined;
  getExchangesByType: (type: ExchangeType) => Exchange[];
  getOverallHealth: () => { healthy: number; degraded: number; down: number };
}

const ExchangeContext = createContext<ExchangeContextType | null>(null);

export const useExchanges = () => {
  const context = useContext(ExchangeContext);
  if (!context) throw new Error('useExchanges must be used within ExchangeProvider');
  return context;
};

export const ExchangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);

  // Initialize with mock exchanges
  useEffect(() => {
    const mockExchanges: Exchange[] = [
      {
        id: 'polygon',
        name: 'polygon',
        displayName: 'Polygon.io',
        type: 'data-provider',
        status: 'active',
        apiVersion: 'v3',
        rateLimits: { requestsPerMinute: 500, requestsUsed: 245, resetTime: new Date(Date.now() + 45000) },
        capabilities: ['equities', 'options', 'crypto'],
        streams: ['price-polygon', 'level2-polygon'],
        lastHealthCheck: new Date(),
        latencyMs: 8,
        errorRate: 0.001
      },
      {
        id: 'tda',
        name: 'tda',
        displayName: 'TD Ameritrade',
        type: 'broker',
        status: 'active',
        apiVersion: 'v1',
        rateLimits: { requestsPerMinute: 120, requestsUsed: 45, resetTime: new Date(Date.now() + 30000) },
        capabilities: ['equities', 'options'],
        streams: ['account-tda'],
        lastHealthCheck: new Date(),
        latencyMs: 45,
        errorRate: 0.005
      },
      {
        id: 'opra',
        name: 'opra',
        displayName: 'OPRA (Options)',
        type: 'options-exchange',
        status: 'active',
        apiVersion: 'v2',
        rateLimits: { requestsPerMinute: 1000, requestsUsed: 320, resetTime: new Date(Date.now() + 40000) },
        capabilities: ['options'],
        streams: ['options-opra'],
        lastHealthCheck: new Date(),
        latencyMs: 15,
        errorRate: 0.002
      },
      {
        id: 'benzinga',
        name: 'benzinga',
        displayName: 'Benzinga News',
        type: 'data-provider',
        status: 'degraded',
        apiVersion: 'v1',
        rateLimits: { requestsPerMinute: 60, requestsUsed: 58, resetTime: new Date(Date.now() + 15000) },
        capabilities: ['equities'],
        streams: ['news-benzinga'],
        lastHealthCheck: new Date(Date.now() - 5000),
        latencyMs: 120,
        errorRate: 0.05
      },
      {
        id: 'ibkr',
        name: 'ibkr',
        displayName: 'Interactive Brokers',
        type: 'broker',
        status: 'inactive',
        apiVersion: 'v1',
        rateLimits: { requestsPerMinute: 100, requestsUsed: 0, resetTime: new Date() },
        capabilities: ['equities', 'options', 'futures'],
        streams: [],
        lastHealthCheck: new Date(Date.now() - 60000),
        latencyMs: 0,
        errorRate: 0
      },
      {
        id: 'cboe',
        name: 'cboe',
        displayName: 'CBOE',
        type: 'options-exchange',
        status: 'maintenance',
        apiVersion: 'v3',
        rateLimits: { requestsPerMinute: 500, requestsUsed: 0, resetTime: new Date() },
        capabilities: ['options'],
        streams: [],
        lastHealthCheck: new Date(Date.now() - 300000),
        latencyMs: 0,
        errorRate: 0
      }
    ];
    setExchanges(mockExchanges);
  }, []);

  // Simulate periodic health checks
  useEffect(() => {
    const interval = setInterval(() => {
      setExchanges(prev => prev.map(ex => ({
        ...ex,
        lastHealthCheck: ex.status === 'active' || ex.status === 'degraded' ? new Date() : ex.lastHealthCheck,
        latencyMs: ex.status === 'active' ? ex.latencyMs + (Math.random() - 0.5) * 4 : ex.latencyMs,
        rateLimits: {
          ...ex.rateLimits,
          requestsUsed: ex.status === 'active' 
            ? Math.min(ex.rateLimits.requestsPerMinute, ex.rateLimits.requestsUsed + Math.floor(Math.random() * 5))
            : ex.rateLimits.requestsUsed
        }
      })));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const addExchange = useCallback((exchange: Exchange) => {
    setExchanges(prev => [...prev, exchange]);
  }, []);

  const removeExchange = useCallback((id: string) => {
    setExchanges(prev => prev.filter(e => e.id !== id));
  }, []);

  const updateExchangeStatus = useCallback((id: string, status: ExchangeStatus) => {
    setExchanges(prev => prev.map(e => e.id === id ? { ...e, status, lastHealthCheck: new Date() } : e));
  }, []);

  const updateRateLimits = useCallback((id: string, limits: Partial<RateLimits>) => {
    setExchanges(prev => prev.map(e => 
      e.id === id ? { ...e, rateLimits: { ...e.rateLimits, ...limits } } : e
    ));
  }, []);

  const testConnection = useCallback(async (id: string): Promise<boolean> => {
    // Simulate connection test
    return new Promise(resolve => {
      setTimeout(() => {
        const success = Math.random() > 0.1;
        setExchanges(prev => prev.map(e => 
          e.id === id ? { ...e, status: success ? 'active' : 'inactive', lastHealthCheck: new Date() } : e
        ));
        resolve(success);
      }, 1000);
    });
  }, []);

  const getExchangeById = useCallback((id: string) => exchanges.find(e => e.id === id), [exchanges]);
  
  const getExchangesByType = useCallback((type: ExchangeType) => exchanges.filter(e => e.type === type), [exchanges]);

  const getOverallHealth = useCallback(() => ({
    healthy: exchanges.filter(e => e.status === 'active').length,
    degraded: exchanges.filter(e => e.status === 'degraded').length,
    down: exchanges.filter(e => e.status === 'inactive' || e.status === 'maintenance').length
  }), [exchanges]);

  return (
    <ExchangeContext.Provider value={{
      exchanges,
      addExchange,
      removeExchange,
      updateExchangeStatus,
      updateRateLimits,
      testConnection,
      getExchangeById,
      getExchangesByType,
      getOverallHealth
    }}>
      {children}
    </ExchangeContext.Provider>
  );
};
