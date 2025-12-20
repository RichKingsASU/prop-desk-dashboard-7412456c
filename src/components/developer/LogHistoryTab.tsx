import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { History, Filter, RefreshCw, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface DevEventLog {
  id: string;
  created_at: string;
  source: string;
  level: string;
  event_type: string;
  message: string;
  meta: Record<string, unknown>;
}

type TimeRange = '15m' | '1h' | '24h' | 'all';
type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'all';
type LogSource = 'supabase' | 'alpaca' | 'exchange' | 'system' | 'ui' | 'all';

const levelColors: Record<string, string> = {
  INFO: 'bg-blue-500/10 text-blue-600',
  WARN: 'bg-amber-500/10 text-amber-600',
  ERROR: 'bg-destructive/10 text-destructive',
  DEBUG: 'bg-muted text-muted-foreground'
};

const sourceColors: Record<string, string> = {
  supabase: 'text-emerald-600',
  alpaca: 'text-amber-600',
  exchange: 'text-blue-600',
  system: 'text-purple-600',
  ui: 'text-slate-600'
};

const PAGE_SIZE = 50;

export const LogHistoryTab = () => {
  const [logs, setLogs] = useState<DevEventLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel>('all');
  const [sourceFilter, setSourceFilter] = useState<LogSource>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const getTimeFilter = useCallback(() => {
    if (timeRange === 'all') return null;
    
    const now = new Date();
    const ranges: Record<TimeRange, number> = {
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      'all': 0
    };
    
    return new Date(now.getTime() - ranges[timeRange]).toISOString();
  }, [timeRange]);

  const fetchLogs = useCallback(async (append = false) => {
    setIsLoading(true);
    
    try {
      let query = supabase
        .from('dev_event_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });
      
      // Apply filters
      const timeFilter = getTimeFilter();
      if (timeFilter) {
        query = query.gte('created_at', timeFilter);
      }
      
      if (levelFilter !== 'all') {
        query = query.eq('level', levelFilter);
      }
      
      if (sourceFilter !== 'all') {
        query = query.eq('source', sourceFilter);
      }
      
      if (searchFilter) {
        query = query.or(`message.ilike.%${searchFilter}%,event_type.ilike.%${searchFilter}%`);
      }
      
      // Pagination
      const offset = append ? logs.length : 0;
      query = query.range(offset, offset + PAGE_SIZE - 1);
      
      const { data, error, count } = await query;
      
      if (error) {
        console.error('Failed to fetch logs:', error);
        return;
      }
      
      const typedData = (data || []) as DevEventLog[];
      
      if (append) {
        setLogs(prev => [...prev, ...typedData]);
      } else {
        setLogs(typedData);
      }
      
      setTotalCount(count || 0);
      setHasMore(typedData.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getTimeFilter, levelFilter, sourceFilter, searchFilter, logs.length]);

  // Initial load and filter changes
  useEffect(() => {
    fetchLogs(false);
  }, [levelFilter, sourceFilter, timeRange]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchLogs(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchFilter]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchLogs(false);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" />
            Log History
            <Badge variant="outline" className="ml-2 text-xs">
              Total: {totalCount.toLocaleString()}
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-3">
            {/* Auto-refresh Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted/50">
              <RefreshCw className={`h-4 w-4 text-muted-foreground ${autoRefresh ? 'animate-spin' : ''}`} />
              <Label htmlFor="auto-refresh" className="text-xs font-medium cursor-pointer">
                Auto-refresh
              </Label>
              <Switch 
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fetchLogs(false)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search logs..." 
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          
          {/* Time Range Filter */}
          <Select value={timeRange} onValueChange={(v: TimeRange) => setTimeRange(v)}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15m">Last 15m</SelectItem>
              <SelectItem value="1h">Last 1h</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Source Filter */}
          <Select value={sourceFilter} onValueChange={(v: LogSource) => setSourceFilter(v)}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="supabase">Supabase</SelectItem>
              <SelectItem value="alpaca">Alpaca</SelectItem>
              <SelectItem value="exchange">Exchange</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="ui">UI</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Level Filter */}
          <Select value={levelFilter} onValueChange={(v: LogLevel) => setLevelFilter(v)}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="WARN">Warn</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
              <SelectItem value="DEBUG">Debug</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[500px] rounded-md border bg-muted/30">
          <div className="p-2 font-mono text-xs space-y-1">
            {isLoading && logs.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                No logs found. Logs will appear here when persistence is enabled in the Debug Console.
              </div>
            ) : (
              <>
                {logs.map(log => (
                  <Collapsible 
                    key={log.id} 
                    open={expandedRows.has(log.id)}
                    onOpenChange={() => toggleRow(log.id)}
                  >
                    <CollapsibleTrigger className="w-full">
                      <div className="flex items-start gap-2 py-1 hover:bg-muted/50 rounded px-1 cursor-pointer">
                        {expandedRows.has(log.id) ? (
                          <ChevronDown className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <ChevronRight className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className="text-muted-foreground whitespace-nowrap">
                          {formatDateTime(log.created_at)}
                        </span>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${levelColors[log.level] || ''}`}>
                          {log.level}
                        </Badge>
                        <span className={`whitespace-nowrap font-medium ${sourceColors[log.source] || 'text-foreground'}`}>
                          [{log.source}]
                        </span>
                        <span className="text-muted-foreground whitespace-nowrap">
                          [{log.event_type}]
                        </span>
                        <span className="text-foreground flex-1 text-left truncate">{log.message}</span>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-6 mt-1 mb-2 p-2 bg-muted/50 rounded border text-[11px]">
                        <pre className="whitespace-pre-wrap text-muted-foreground">
                          {JSON.stringify(log.meta, null, 2)}
                        </pre>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
                
                {/* Load More */}
                {hasMore && (
                  <div className="flex justify-center py-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fetchLogs(true)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : null}
                      Load More ({PAGE_SIZE})
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
