import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Terminal, Copy, Trash2, Pause, Play, Filter } from 'lucide-react';
import { useDataStreams } from '@/contexts/DataStreamContext';
import { useExchanges } from '@/contexts/ExchangeContext';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  source: string;
  message: string;
}

const levelColors: Record<LogLevel, string> = {
  info: 'bg-blue-500/10 text-blue-600',
  warn: 'bg-amber-500/10 text-amber-600',
  error: 'bg-destructive/10 text-destructive',
  debug: 'bg-muted text-muted-foreground'
};

export const DebugConsole = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { streams } = useDataStreams();
  const { exchanges } = useExchanges();

  // Generate mock logs based on stream activity
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const logTypes: Array<() => LogEntry> = [
        () => {
          const stream = streams[Math.floor(Math.random() * streams.length)];
          return {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            level: 'info' as LogLevel,
            source: stream?.name || 'System',
            message: `Received ${Math.floor(Math.random() * 100)} messages`
          };
        },
        () => {
          const exchange = exchanges[Math.floor(Math.random() * exchanges.length)];
          return {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            level: 'debug' as LogLevel,
            source: exchange?.displayName || 'System',
            message: `Health check completed, latency: ${Math.floor(Math.random() * 50)}ms`
          };
        },
        () => ({
          id: crypto.randomUUID(),
          timestamp: new Date(),
          level: Math.random() > 0.8 ? 'warn' as LogLevel : 'info' as LogLevel,
          source: 'WebSocket',
          message: Math.random() > 0.8 
            ? 'Connection heartbeat delayed' 
            : 'Connection stable'
        })
      ];

      // Only add log occasionally
      if (Math.random() > 0.6) {
        const newLog = logTypes[Math.floor(Math.random() * logTypes.length)]();
        setLogs(prev => [...prev.slice(-200), newLog]);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isPaused, streams, exchanges]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (!isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const filteredLogs = logs.filter(log => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (filter && !log.message.toLowerCase().includes(filter.toLowerCase()) && 
        !log.source.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const copyLogs = () => {
    const text = filteredLogs.map(log => 
      `[${log.timestamp.toISOString()}] [${log.level.toUpperCase()}] [${log.source}] ${log.message}`
    ).join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            Debug Console
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
            <Button variant="outline" size="sm" onClick={() => setLogs([])}>
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className="relative flex-1">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Filter logs..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'info', 'warn', 'error', 'debug'] as const).map(level => (
              <Button
                key={level}
                variant={levelFilter === level ? "default" : "outline"}
                size="sm"
                className="text-xs h-9 px-2.5"
                onClick={() => setLevelFilter(level)}
              >
                {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64 rounded-md border bg-muted/30" ref={scrollRef}>
          <div className="p-2 font-mono text-xs space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-muted-foreground text-center py-8">
                No logs to display
              </div>
            ) : (
              filteredLogs.map(log => (
                <div key={log.id} className="flex items-start gap-2 py-0.5">
                  <span className="text-muted-foreground whitespace-nowrap">
                    {log.timestamp.toLocaleTimeString()}.{log.timestamp.getMilliseconds().toString().padStart(3, '0')}
                  </span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${levelColors[log.level]}`}>
                    {log.level.toUpperCase()}
                  </Badge>
                  <span className="text-muted-foreground whitespace-nowrap">[{log.source}]</span>
                  <span className="text-foreground">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
