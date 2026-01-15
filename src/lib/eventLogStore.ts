import { useSyncExternalStore, useCallback } from 'react';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type LogSource = 'supabase' | 'alpaca' | 'exchange' | 'system' | 'ui';

export interface EventLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  source: LogSource;
  category: string;
  message: string;
  meta?: Record<string, unknown>;
}

export interface PersistenceStatus {
  enabled: boolean;
  lastFlushTime: Date | null;
  lastError: string | null;
  pendingCount: number;
}

const MAX_LOGS = 500;
const FLUSH_INTERVAL_MS = 1000;

// In-memory store
let logs: EventLog[] = [];
let listeners: Set<() => void> = new Set();

// Persistence state
let isPersistenceEnabled = false;
let opsToken: string | null = null;
let lastFlushTime: Date | null = null;
let lastError: string | null = null;
let pendingLogs: EventLog[] = [];
let persistenceSnapshot: PersistenceStatus = {
  enabled: false,
  lastFlushTime: null,
  lastError: null,
  pendingCount: 0
};
let flushIntervalId: number | null = null;
let persistenceListeners: Set<() => void> = new Set();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

const updatePersistenceSnapshot = () => {
  persistenceSnapshot = {
    enabled: isPersistenceEnabled,
    lastFlushTime,
    lastError,
    pendingCount: pendingLogs.length
  };
};

const notifyPersistenceListeners = () => {
  updatePersistenceSnapshot();
  persistenceListeners.forEach(listener => listener());
};

// Flush pending logs to edge function
const flushLogs = async () => {
  if (pendingLogs.length === 0 || !opsToken) return;

  const logsToFlush = [...pendingLogs];
  pendingLogs = [];
  notifyPersistenceListeners();

  try {
    // Supabase edge-function persistence is disabled in this build.
    throw new Error('Log persistence is disabled (no backend configured).');
  } catch (error) {
    lastError = error instanceof Error ? error.message : 'Unknown error';
    // Put logs back in queue on failure
    pendingLogs = [...logsToFlush, ...pendingLogs];
    notifyPersistenceListeners();
  }
};

// Start/stop flush interval
const startFlushInterval = () => {
  if (flushIntervalId) return;
  flushIntervalId = window.setInterval(flushLogs, FLUSH_INTERVAL_MS);
};

const stopFlushInterval = () => {
  if (flushIntervalId) {
    window.clearInterval(flushIntervalId);
    flushIntervalId = null;
  }
};

// Store API
export const eventLogStore = {
  getSnapshot: () => logs,
  
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  
  logEvent: (
    level: LogLevel, 
    source: LogSource, 
    category: string, 
    message: string, 
    meta?: Record<string, unknown>
  ) => {
    const newLog: EventLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level,
      source,
      category,
      message,
      meta
    };
    
    logs = [...logs.slice(-(MAX_LOGS - 1)), newLog];
    notifyListeners();
    
    // Add to pending queue if persistence is enabled
    if (isPersistenceEnabled && opsToken) {
      pendingLogs.push(newLog);
      notifyPersistenceListeners();
    }
    
    // Also log to browser console for debugging
    const prefix = `[${source}] [${category}]`;
    switch (level) {
      case 'error':
        console.error(prefix, message, meta || '');
        break;
      case 'warn':
        console.warn(prefix, message, meta || '');
        break;
      case 'debug':
        console.debug(prefix, message, meta || '');
        break;
      default:
        console.log(prefix, message, meta || '');
    }
  },
  
  clearLogs: () => {
    logs = [];
    notifyListeners();
  }
};

// Persistence API
export const persistenceStore = {
  getSnapshot: (): PersistenceStatus => persistenceSnapshot,

  subscribe: (listener: () => void) => {
    persistenceListeners.add(listener);
    return () => persistenceListeners.delete(listener);
  },

  togglePersistence: (enabled: boolean, token?: string) => {
    isPersistenceEnabled = enabled;
    
    if (token) {
      opsToken = token;
      localStorage.setItem('ops_log_token', token);
    } else if (enabled && !opsToken) {
      // Try to load from localStorage
      opsToken = localStorage.getItem('ops_log_token');
    }

    if (enabled && opsToken) {
      startFlushInterval();
      lastError = null;
    } else {
      stopFlushInterval();
      if (!opsToken && enabled) {
        lastError = 'No OPS token configured';
      }
    }

    notifyPersistenceListeners();
    return opsToken !== null;
  },

  getStoredToken: (): string | null => {
    return localStorage.getItem('ops_log_token');
  },

  clearToken: () => {
    opsToken = null;
    localStorage.removeItem('ops_log_token');
    if (isPersistenceEnabled) {
      isPersistenceEnabled = false;
      stopFlushInterval();
    }
    notifyPersistenceListeners();
  },

  forceFlush: async () => {
    await flushLogs();
  }
};

// React hooks
export const useEventLogs = () => {
  return useSyncExternalStore(
    eventLogStore.subscribe,
    eventLogStore.getSnapshot,
    eventLogStore.getSnapshot
  );
};

export const usePersistenceStatus = () => {
  return useSyncExternalStore(
    persistenceStore.subscribe,
    persistenceStore.getSnapshot,
    persistenceStore.getSnapshot
  );
};

export const useEventLogger = () => {
  const logEvent = useCallback(
    (level: LogLevel, source: LogSource, category: string, message: string, meta?: Record<string, unknown>) => {
      eventLogStore.logEvent(level, source, category, message, meta);
    },
    []
  );
  
  return { logEvent };
};

// Convenience function for direct imports
export const logEvent = eventLogStore.logEvent;
export const clearLogs = eventLogStore.clearLogs;
export const togglePersistence = persistenceStore.togglePersistence;
