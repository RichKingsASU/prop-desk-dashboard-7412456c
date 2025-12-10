import { useState, useEffect, useCallback } from 'react';
import { alpacaWs, AlpacaMessage, AlpacaTrade, AlpacaQuote, AlpacaFeedType } from '@/services/AlpacaWebSocket';

export interface AlpacaPriceData {
  symbol: string;
  price: number;
  bid?: number;
  ask?: number;
  bidSize?: number;
  askSize?: number;
  lastTradeSize?: number;
  timestamp: Date;
  source: 'trade' | 'quote';
}

interface UseAlpacaPriceOptions {
  symbols: string[];
  feedType?: AlpacaFeedType;
  apiKey?: string;
  secretKey?: string;
  autoConnect?: boolean;
  subscribeTrades?: boolean;
  subscribeQuotes?: boolean;
}

interface UseAlpacaPriceReturn {
  prices: Record<string, AlpacaPriceData>;
  isConnected: boolean;
  status: 'disconnected' | 'connecting' | 'authenticating' | 'authenticated' | 'subscribed' | 'error';
  error: string | null;
  connect: (apiKey: string, secretKey: string) => void;
  disconnect: () => void;
  addSymbols: (newSymbols: string[]) => void;
  removeSymbols: (symbolsToRemove: string[]) => void;
}

export const useAlpacaPrice = (options: UseAlpacaPriceOptions): UseAlpacaPriceReturn => {
  const {
    symbols,
    feedType = 'iex',
    apiKey,
    secretKey,
    autoConnect = false,
    subscribeTrades = true,
    subscribeQuotes = false
  } = options;

  const [prices, setPrices] = useState<Record<string, AlpacaPriceData>>({});
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'authenticating' | 'authenticated' | 'subscribed' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);

  // Handle incoming messages
  useEffect(() => {
    const unsubMessage = alpacaWs.onMessage((message: AlpacaMessage) => {
      if (message.T === 't') {
        // Trade message
        const trade = message as AlpacaTrade;
        setPrices(prev => ({
          ...prev,
          [trade.S]: {
            symbol: trade.S,
            price: trade.p,
            lastTradeSize: trade.s,
            timestamp: new Date(trade.t),
            source: 'trade',
            // Preserve bid/ask from previous quote
            bid: prev[trade.S]?.bid,
            ask: prev[trade.S]?.ask,
            bidSize: prev[trade.S]?.bidSize,
            askSize: prev[trade.S]?.askSize
          }
        }));
      } else if (message.T === 'q') {
        // Quote message
        const quote = message as AlpacaQuote;
        setPrices(prev => ({
          ...prev,
          [quote.S]: {
            symbol: quote.S,
            price: prev[quote.S]?.price || (quote.bp + quote.ap) / 2,
            bid: quote.bp,
            ask: quote.ap,
            bidSize: quote.bs,
            askSize: quote.as,
            timestamp: new Date(quote.t),
            source: 'quote',
            lastTradeSize: prev[quote.S]?.lastTradeSize
          }
        }));
      }
    });

    const unsubStatus = alpacaWs.onStatus((newStatus, err) => {
      setStatus(newStatus);
      if (err) setError(err);
    });

    return () => {
      unsubMessage();
      unsubStatus();
    };
  }, []);

  // Auto-connect if credentials provided
  useEffect(() => {
    if (autoConnect && apiKey && secretKey && status === 'disconnected') {
      alpacaWs.connect({ apiKey, secretKey }, feedType);
    }
  }, [autoConnect, apiKey, secretKey, feedType, status]);

  // Subscribe to symbols when authenticated
  useEffect(() => {
    if (status === 'authenticated' && symbols.length > 0) {
      const subscription: any = {};
      if (subscribeTrades) subscription.trades = symbols;
      if (subscribeQuotes) subscription.quotes = symbols;
      alpacaWs.subscribe(subscription);
    }
  }, [status, symbols, subscribeTrades, subscribeQuotes]);

  const connect = useCallback((key: string, secret: string) => {
    setError(null);
    alpacaWs.connect({ apiKey: key, secretKey: secret }, feedType);
  }, [feedType]);

  const disconnect = useCallback(() => {
    alpacaWs.disconnect();
    setPrices({});
  }, []);

  const addSymbols = useCallback((newSymbols: string[]) => {
    if (status === 'authenticated' || status === 'subscribed') {
      const subscription: any = {};
      if (subscribeTrades) subscription.trades = newSymbols;
      if (subscribeQuotes) subscription.quotes = newSymbols;
      alpacaWs.subscribe(subscription);
    }
  }, [status, subscribeTrades, subscribeQuotes]);

  const removeSymbols = useCallback((symbolsToRemove: string[]) => {
    if (status === 'authenticated' || status === 'subscribed') {
      const unsubscription: any = {};
      if (subscribeTrades) unsubscription.trades = symbolsToRemove;
      if (subscribeQuotes) unsubscription.quotes = symbolsToRemove;
      alpacaWs.unsubscribe(unsubscription);
      
      // Remove from local state
      setPrices(prev => {
        const newPrices = { ...prev };
        symbolsToRemove.forEach(s => delete newPrices[s]);
        return newPrices;
      });
    }
  }, [status, subscribeTrades, subscribeQuotes]);

  return {
    prices,
    isConnected: status === 'authenticated' || status === 'subscribed',
    status,
    error,
    connect,
    disconnect,
    addSymbols,
    removeSymbols
  };
};
