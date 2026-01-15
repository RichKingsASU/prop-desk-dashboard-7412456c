import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import StatusBanner from "@/components/test/StatusBanner";
import LiveQuotesWidget from "@/components/test/LiveQuotesWidget";
import MarketDataWidget from "@/components/test/MarketDataWidget";

const SupabaseDashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 border-b border-border">
        <Link to="/test">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Test Hub
          </Button>
        </Link>
      </div>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <StatusBanner />
        
        <div className="grid gap-6">
          <LiveQuotesWidget />
          <MarketDataWidget />
        </div>
      </div>
    </div>
  );
};

export default SupabaseDashboard;
