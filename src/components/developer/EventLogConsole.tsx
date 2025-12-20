import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Copy, Trash2, Pause, Play, Filter } from 'lucide-react';
import { useEventLogs, clearLogs, LogLevel, LogSource } from '@/lib/eventLogStore';

const levelColors: Record<LogLevel, string> = {
  info: 'bg-blue-500/10 text-blue-600',
  warn: 'bg-amber-500/10 text-amber-600',
  error: 'bg-destructive/10 text-destructive',
  debug: 'bg-muted text-muted-foreground'
};

const sourceColors: Record<LogSource, string> = {
  supabase: 'text-emerald-600',
  alpaca: 'text-amber-600',
  exchange: 'text-blue-600',
  system: 'text-purple-600',
  ui: 'text-slate-600'
};

export const EventLogConsole = () => {
  const logs = useEventLogs();
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<LogSource | 'all'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pausedLogs, setPausedLogs] = useState(logs);

  // Update paused logs when pausing
  useEffect(() => {
    if (!isPaused) {
      setPausedLogs(logs);
    }
  }, [logs, isPaused]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [pausedLogs, isPaused]);

  const displayLogs = isPaused ? pausedLogs : logs;

  const filteredLogs = displayLogs.filter(log => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (sourceFilter !== 'all' && log.source !== sourceFilter) return false;
    if (filter) {
      const searchLower = filter.toLowerCase();
      return (
        log.message.toLowerCase().includes(searchLower) ||
        log.source.toLowerCase().includes(searchLower) ||
        log.category.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const copyLogs = () => {
    const text = filteredLogs.map(log => 
      `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${log.source}] [${log.category}] ${log.message}${log.meta ? ' ' + JSON.stringify(log.meta) : ''}`
    ).join('\n');
    navigator.clipboard.writeText(text);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString() + '.' + date.getMilliseconds().toString().padStart(3, '0');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Event Log Console
            <Badge variant="outline" className="ml-2 text-xs">
              {filteredLogs.length} / {displayLogs.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant={isPaused ? "default" : "outline"} 
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? <Play className="h-3 w-3 mr-1" /> : <Pause className="h-3 w-3 mr-1" />}
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
            <Button variant="outline" size="sm" onClick={copyLogs}>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button variant="outline" size="sm" onClick={clearLogs}>
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter logs..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          
          {/* Source Filter */}
          <div className="flex gap-1">
            {(['all', 'supabase', 'alpaca', 'exchange', 'system'] as const).map(source => (
              <Button
                key={source}
                variant={sourceFilter === source ? "default" : "outline"}
                size="sm"
                className="text-xs h-9 px-2.5"
                onClick={() => setSourceFilter(source)}
              >
                {source === 'all' ? 'All Sources' : source.charAt(0).toUpperCase() + source.slice(1)}
              </Button>
            ))}
          </div>
          
          {/* Level Filter */}
          <div className="flex gap-1">
            {(['all', 'info', 'warn', 'error', 'debug'] as const).map(level => (
              <Button
                key={level}
                variant={levelFilter === level ? "default" : "outline"}
                size="sm"
                className="text-xs h-9 px-2.5"
                onClick={() => setLevelFilter(level)}
              >
                {level === 'all' ? 'All Levels' : level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-80 rounded-md border bg-muted/30" ref={scrollRef}>
          <div className="p-2 font-mono text-xs space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                {displayLogs.length === 0 
                  ? 'No events logged yet. Events from Supabase channels, Alpaca WebSocket, and exchanges will appear here.'
                  : 'No logs match the current filters'}
              </div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="flex items-start gap-2 py-0.5 hover:bg-muted/50 rounded px-1">
                  <span className="text-muted-foreground whitespace-nowrap">
                    {formatTime(log.timestamp)}
                  </span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${levelColors[log.level]}`}>
                    {log.level.toUpperCase()}
                  </Badge>
                  <span className={`whitespace-nowrap font-medium ${sourceColors[log.source]}`}>
                    [{log.source}]
                  </span>
                  <span className="text-muted-foreground whitespace-nowrap">
                    [{log.category}]
                  </span>
                  <span className="text-foreground flex-1">{log.message}</span>
                  {log.meta && Object.keys(log.meta).length > 0 && (
                    <span className="text-muted-foreground text-[10px]">
                      {JSON.stringify(log.meta)}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
