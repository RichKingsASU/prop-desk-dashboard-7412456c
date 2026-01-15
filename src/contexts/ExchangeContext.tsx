import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { logEvent } from '@/lib/eventLogStore';
import { apiClient } from '@/api/client';

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
];

const BACKEND_API: Exchange = {
  id: 'backend',
  name: 'backend',
  displayName: 'Backend API',
  type: 'data-provider',
  status: 'inactive',
  apiVersion: 'v1',
  rateLimits: { requestsPerMinute: 1000, requestsUsed: 0, resetTime: new Date() },
  capabilities: ['equities', 'options', 'crypto'],
  streams: [],
  lastHealthCheck: new Date(),
  latencyMs: 0,
  errorRate: 0,
  isFromDatabase: false,
};

export const ExchangeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load broker accounts from backend API
  useEffect(() => {
    const loadBrokerAccounts = async () => {
      try {
        const brokerAccounts = (await apiClient.getBrokerAccounts()) as any[];

        // Map broker accounts to Exchange format
        const brokerExchanges: Exchange[] = (brokerAccounts || []).map(account => ({
          id: `broker-${account.id}`,
          name: account.broker_name,
          displayName: `${account.broker_name.charAt(0).toUpperCase() + account.broker_name.slice(1)} ${account.is_paper_trading ? '(Paper)' : '(Live)'} - ${account.account_label}`,
          type: 'broker' as ExchangeType,
          status: 'active' as ExchangeStatus, // Assume active if in database
          apiVersion: 'v1',
          rateLimits: { 
            requestsPerMinute: 120, 
            requestsUsed: 0, 
            resetTime: new Date() 
          },
          capabilities: account.broker_name === 'tastytrade' 
            ? ['equities', 'options'] as Capability[]
            : ['equities', 'crypto'] as Capability[],
          streams: [],
          lastHealthCheck: new Date(account.updated_at || Date.now()),
          latencyMs: 0,
          errorRate: 0,
          isFromDatabase: true,
          brokerAccountId: account.id
        }));

        // Combine database brokers with backend + reference providers
        setExchanges([BACKEND_API, ...brokerExchanges, ...REFERENCE_PROVIDERS]);
      } catch (error) {
        console.error('Error in loadBrokerAccounts:', error);
        setExchanges([BACKEND_API, ...REFERENCE_PROVIDERS]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBrokerAccounts();

    // TODO(realtime): Subscribe to broker-account changes via backend WS.
    const interval = setInterval(loadBrokerAccounts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Periodic health check for backend API
  useEffect(() => {
    const checkHealth = async () => {
      const start = Date.now();
      let ok = false;
      let errorMessage: string | undefined;

      try {
        await apiClient.healthz();
        ok = true;
      } catch (e: any) {
        errorMessage = e?.message || 'Unknown error';
      }

      const latency = Date.now() - start;
      const newStatus = ok ? 'active' : 'degraded';
      
      logEvent(
        ok ? 'info' : 'warn',
        'exchange',
        'health',
        `Backend health check: ${newStatus}`,
        { latencyMs: latency, error: errorMessage }
      );

      setExchanges(prev => prev.map(ex => {
        if (ex.id === 'backend') {
          return {
            ...ex,
            status: newStatus,
            lastHealthCheck: new Date(),
            latencyMs: latency,
            errorRate: ok ? 0 : 0.1
          };
        }
        return ex;
      }));
    };

    // Initial check
    checkHealth();
    
    // Then check every 30 seconds
    const interval = setInterval(checkHealth, 30000);

    return () => clearInterval(interval);
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
    
    // For backend, actually test the connection
    if (exchange?.id === 'backend') {
      setExchanges(prev => prev.map(e => 
        e.id === id ? { ...e, status: 'inactive' } : e
      ));
      
      const start = Date.now();
      let success = false;
      try {
        await apiClient.healthz();
        success = true;
      } catch {
        success = false;
      }
      const latency = Date.now() - start;
      
      setExchanges(prev => prev.map(e => 
        e.id === id ? { 
          ...e, 
          status: success ? 'active' : 'degraded', 
          lastHealthCheck: new Date(),
          latencyMs: latency
        } : e
      ));
      return success;
    }

    // For broker accounts, verify the broker account is still returned by the API.
    if (exchange?.isFromDatabase && exchange.brokerAccountId) {
      let success = false;
      try {
        const accounts = (await apiClient.getBrokerAccounts()) as any[];
        success = (accounts || []).some(a => a.id === exchange.brokerAccountId);
      } catch {
        success = false;
      }
      setExchanges(prev => prev.map(e => 
        e.id === id ? { 
          ...e, 
          status: success ? 'active' : 'inactive', 
          lastHealthCheck: new Date()
        } : e
      ));
      return success;
    }

    // For reference providers, the UI does not perform direct connectivity checks.
    // The backend should expose provider health in GET /system/state.
    setExchanges(prev => prev.map(e =>
      e.id === id ? { ...e, status: 'inactive', lastHealthCheck: new Date() } : e
    ));
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
