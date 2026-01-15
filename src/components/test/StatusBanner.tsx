import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle, XCircle, Loader2 } from "lucide-react";

const StatusBanner = () => {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking");

  useEffect(() => {
    // Data backend is not configured in this build.
    setStatus("error");
  }, []);

  return (
    <Card className="bg-card border-border">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">AgentTrader Hybrid Dashboard</h1>
              <p className="text-sm text-muted-foreground">Data source: Not configured</p>
            </div>
          </div>
          
          <Badge 
            variant={status === "connected" ? "default" : status === "error" ? "destructive" : "secondary"}
            className="flex items-center gap-1.5"
          >
            {status === "checking" && <Loader2 className="h-3 w-3 animate-spin" />}
            {status === "connected" && <CheckCircle className="h-3 w-3" />}
            {status === "error" && <XCircle className="h-3 w-3" />}
            {status === "checking" ? "Checking..." : status === "connected" ? "Connected" : "Connection Error"}
          </Badge>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          Configure a backend ingestion/data source to enable market data and paper trades widgets.
        </p>
      </CardContent>
    </Card>
  );
};

export default StatusBanner;
