import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDataStreams, StreamType } from '@/contexts/DataStreamContext';
import { useExchanges } from '@/contexts/ExchangeContext';
import { Plus, Radio } from 'lucide-react';
import { toast } from 'sonner';

export const StreamManager = () => {
  const { registerStream } = useDataStreams();
  const { exchanges } = useExchanges();
  const [isOpen, setIsOpen] = useState(false);
  const [streamType, setStreamType] = useState<StreamType>('price');
  const [exchange, setExchange] = useState('');
  const [symbols, setSymbols] = useState('');

  const activeExchanges = exchanges.filter(e => e.status === 'active' || e.status === 'degraded');

  const handleAddStream = () => {
    if (!exchange || !symbols.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    if (symbolList.length === 0) {
      toast.error('Please enter at least one symbol');
      return;
    }

    const streamNames: Record<StreamType, string> = {
      price: 'Price Stream',
      options: 'Options Flow',
      news: 'News Feed',
      level2: 'Level 2 Depth',
      trades: 'Trades Feed',
      account: 'Account Updates'
    };

    registerStream({
      id: `${streamType}-${exchange}-${Date.now()}`,
      name: streamNames[streamType],
      type: streamType,
      exchange,
      symbols: symbolList,
      status: 'connecting',
      lastMessage: null,
      latencyMs: 0,
      lastError: null,
      connectedAt: null
    });

    toast.success('Stream added', {
      description: `${streamNames[streamType]} for ${symbolList.join(', ')}`
    });

    setIsOpen(false);
    setSymbols('');
  };

  if (!isOpen) {
    return (
      <Button onClick={() => setIsOpen(true)} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add New Stream
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Radio className="h-4 w-4" />
          Add New Data Stream
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Stream Type</Label>
          <Select value={streamType} onValueChange={(v) => setStreamType(v as StreamType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price Stream</SelectItem>
              <SelectItem value="options">Options Flow</SelectItem>
              <SelectItem value="level2">Level 2 Depth</SelectItem>
              <SelectItem value="trades">Trades Feed</SelectItem>
              <SelectItem value="news">News Feed</SelectItem>
              <SelectItem value="account">Account Updates</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Exchange</Label>
          <Select value={exchange} onValueChange={setExchange}>
            <SelectTrigger>
              <SelectValue placeholder="Select exchange..." />
            </SelectTrigger>
            <SelectContent>
              {activeExchanges.map(ex => (
                <SelectItem key={ex.id} value={ex.id}>
                  {ex.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Symbols</Label>
          <Input 
            placeholder="SPY, AAPL, TSLA" 
            value={symbols}
            onChange={(e) => setSymbols(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Comma-separated list of symbols</p>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleAddStream} className="flex-1">
            Connect Stream
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
