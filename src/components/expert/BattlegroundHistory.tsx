import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";

interface BattleSession {
  id: string;
  timestamp: Date;
  symbol: string;
  priceLevel: number;
  outcome: 'win' | 'loss' | 'active';
  finalStatus: string;
  statusSequence: string[];
  duration: number; // seconds
}

interface BattlegroundHistoryProps {
  sessions: BattleSession[];
}

export const BattlegroundHistory = ({ sessions }: BattlegroundHistoryProps) => {
  // Calculate statistics
  const completedSessions = sessions.filter(s => s.outcome !== 'active');
  const wins = completedSessions.filter(s => s.outcome === 'win').length;
  const losses = completedSessions.filter(s => s.outcome === 'loss').length;
  const winRate = completedSessions.length > 0 ? (wins / completedSessions.length) * 100 : 0;

  // Status pattern analysis
  const statusPatterns = {
    DEFENDING: { wins: 0, total: 0 },
    WEAKENING: { wins: 0, total: 0 },
    HOLDING: { wins: 0, total: 0 },
    BROKEN: { wins: 0, total: 0 },
  };

  completedSessions.forEach(session => {
    session.statusSequence.forEach(status => {
      if (statusPatterns[status as keyof typeof statusPatterns]) {
        statusPatterns[status as keyof typeof statusPatterns].total++;
        if (session.outcome === 'win') {
          statusPatterns[status as keyof typeof statusPatterns].wins++;
        }
      }
    });
  });

  const getSuccessRate = (pattern: keyof typeof statusPatterns) => {
    const data = statusPatterns[pattern];
    return data.total > 0 ? (data.wins / data.total) * 100 : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DEFENDING": return "text-blue-500";
      case "HOLDING": return "text-green-500";
      case "WEAKENING": return "text-orange-500";
      case "BROKEN": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">📊 Battle Performance</h3>
      
      {/* Overall Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-500">{wins}</div>
          <div className="text-xs text-muted-foreground">Wins</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-500">{losses}</div>
          <div className="text-xs text-muted-foreground">Losses</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{winRate.toFixed(0)}%</div>
          <div className="text-xs text-muted-foreground">Win Rate</div>
        </div>
      </div>

      {/* Status Pattern Success Rates */}
      <div className="space-y-3 mb-4">
        <div className="text-sm font-semibold mb-2">Status Pattern Success Rates</div>
        
        {(Object.keys(statusPatterns) as Array<keyof typeof statusPatterns>).map(status => {
          const successRate = getSuccessRate(status);
          const total = statusPatterns[status].total;
          
          return (
            <div key={status} className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className={`font-mono ${getStatusColor(status)}`}>{status}</span>
                <span className="text-muted-foreground">
                  {successRate.toFixed(0)}% ({statusPatterns[status].wins}/{total})
                </span>
              </div>
              <Progress value={successRate} className="h-2" />
            </div>
          );
        })}
      </div>

      {/* Recent Sessions */}
      <div className="space-y-2">
        <div className="text-sm font-semibold mb-2">Recent Battles</div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {sessions.slice(-5).reverse().map(session => (
            <div 
              key={session.id} 
              className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-xs"
            >
              <div className="flex items-center gap-2">
                {session.outcome === 'win' ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : session.outcome === 'loss' ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : (
                  <Badge variant="outline" className="text-xs">Active</Badge>
                )}
                <span className="font-mono">${session.priceLevel.toFixed(2)}</span>
                <span className={getStatusColor(session.finalStatus)}>
                  {session.finalStatus}
                </span>
              </div>
              <span className="text-muted-foreground">
                {Math.floor(session.duration / 60)}:{(session.duration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {completedSessions.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          No completed battles yet. Engage Battleground Mode to start tracking!
        </div>
      )}
    </Card>
  );
};
