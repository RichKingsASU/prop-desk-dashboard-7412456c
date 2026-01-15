import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, XCircle } from "lucide-react";

const StatusBanner = () => {
  const [status] = useState<"disabled">("disabled");

  return (
    <Card className="bg-card border-border">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">AgentTrader Hybrid Dashboard</h1>
              <p className="text-sm text-muted-foreground">Data source: not configured</p>
            </div>
          </div>
          
          <Badge 
            variant="secondary"
            className="flex items-center gap-1.5"
          >
            <XCircle className="h-3 w-3" />
            Disabled
          </Badge>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          Backend ingestion is not configured in this build.
        </p>
      </CardContent>
    </Card>
  );
};

export default StatusBanner;
