import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { logEvent } from '@/lib/eventLogStore';

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
  isFromDatabase?: boolean;
  brokerAccountId?: string;
}

interface ExchangeContextType {
  exchanges: Exchange[];
  addExchange: (exchange: Exchange) => void;
  removeExchange: (id: string) => void;
  updateExchangeStatus: (id: string, status: ExchangeStatus, metadata?: { latencyMs?: number; streams?: string[]; errorRate?: number }) => void;
  updateRateLimits: (id: string, limits: Partial<RateLimits>) => void;
  testConnection: (id: string) => Promise<boolean>;
  getExchangeById: (id: string) => Exchange | undefined;
  getExchangesByType: (type: ExchangeType) => Exchange[];
  getOverallHealth: () => { healthy: number; degraded: number; down: number };
  isLoading: boolean;
}

const ExchangeContext = createContext<ExchangeContextType | null>(null);

export const useExchanges = () => {
  const context = useContext(ExchangeContext);
  if (!context) throw new Error('useExchanges must be used within ExchangeProvider');
  return context;
};

// Reference data providers (not from database)
const REFERENCE_PROVIDERS: Exchange[] = [
  {
    id: 'polygon',
    name: 'polygon',
    displayName: 'Polygon.io',
    type: 'data-provider',
    status: 'inactive',
    apiVersion: 'v3',
    rateLimits: { requestsPerMinute: 500, requestsUsed: 0, resetTime: new Date() },
    capabilities: ['equities', 'options', 'crypto'],
    streams: [],
    lastHealthCheck: new Date(),
    latencyMs: 0,
    errorRate: 0,
    isFromDatabase: false
  },
  {
    id: 'alpaca',
    name: 'alpaca',
    displayName: 'Alpaca Markets',
    type: 'data-provider',
    status: 'inactive',
    apiVersion: 'v2',
    rateLimits: { requestsPerMinute: 200, requestsUsed: 0, resetTime: new Date() },
    capabilities: ['equities', 'crypto'],
    streams: [],
    lastHealthCheck: new Date(),
    latencyMs: 0,
    errorRate: 0,
    isFromDatabase: false
  },
  {
    id: 'supabase',
    name: 'supabase',
    displayName: 'Supabase (Disabled)',
    type: 'data-provider',
    status: 'inactive',
    apiVersion: 'v1',
    rateLimits: { requestsPerMinute: 0, requestsUsed: 0, resetTime: new Date() },
    capabilities: ['equities', 'options'],
    streams: [],
    lastHealthCheck: new Date(),
    latencyMs: 0,
    errorRate: 0,
    isFromDatabase: false
  },
];

export const ExchangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Without Supabase, we only expose reference providers.
    setExchanges(REFERENCE_PROVIDERS);
    setIsLoading(false);
    logEvent('info', 'exchange', 'init', 'Exchange providers initialized (Supabase disabled)');
  }, []);

  const addExchange = useCallback((exchange: Exchange) => {
    setExchanges(prev => [...prev, exchange]);
  }, []);

  const removeExchange = useCallback((id: string) => {
    // Don't allow removing database exchanges
    const exchange = exchanges.find(e => e.id === id);
    if (exchange?.isFromDatabase) return;
    
    setExchanges(prev => prev.filter(e => e.id !== id));
  }, [exchanges]);

  const updateExchangeStatus = useCallback((id: string, status: ExchangeStatus, metadata?: { latencyMs?: number; streams?: string[]; errorRate?: number }) => {
    setExchanges(prev => prev.map(e => e.id === id ? { 
      ...e, 
      status, 
      lastHealthCheck: new Date(),
      ...(metadata?.latencyMs !== undefined && { latencyMs: metadata.latencyMs }),
      ...(metadata?.streams && { streams: metadata.streams }),
      ...(metadata?.errorRate !== undefined && { errorRate: metadata.errorRate })
    } : e));
  }, []);

  const updateRateLimits = useCallback((id: string, limits: Partial<RateLimits>) => {
    setExchanges(prev => prev.map(e => 
      e.id === id ? { ...e, rateLimits: { ...e.rateLimits, ...limits } } : e
    ));
  }, []);

  const testConnection = useCallback(async (id: string): Promise<boolean> => {
    const exchange = exchanges.find(e => e.id === id);
    
    // Supabase is disabled in this build
    if (exchange?.id === 'supabase') {
      setExchanges(prev => prev.map(e => 
        e.id === id ? { ...e, status: 'inactive' } : e
      ));

      const success = false;
      setExchanges(prev => prev.map(e => 
        e.id === id ? { 
          ...e, 
          status: success ? 'active' : 'degraded', 
          lastHealthCheck: new Date(),
          latencyMs: 0
        } : e
      ));
      return success;
    }

    // For reference providers, mark as inactive (no configured credentials).
    setExchanges(prev => prev.map(e => (e.id === id ? { ...e, status: 'inactive', lastHealthCheck: new Date() } : e)));
    return false;
  }, [exchanges]);

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
      getOverallHealth,
      isLoading
    }}>
      {children}
    </ExchangeContext.Provider>
  );
};
