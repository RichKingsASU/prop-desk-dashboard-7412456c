import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

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

const MAX_LOGS = 500;

// In-memory store
let logs: EventLog[] = [];
let listeners: Set<() => void> = new Set();

const notifyListeners = () => {
  listeners.forEach(listener => listener());
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

// React hooks
export const useEventLogs = () => {
  return useSyncExternalStore(
    eventLogStore.subscribe,
    eventLogStore.getSnapshot,
    eventLogStore.getSnapshot
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
