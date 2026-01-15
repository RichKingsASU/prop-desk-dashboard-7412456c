import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, ArrowLeft } from "lucide-react";

const TestHub = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">Test Hub</h1>
        <p className="text-muted-foreground mb-8">
          Development experiments and integration testing
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="opacity-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                WebSocket Test
              </CardTitle>
              <CardDescription>
                Coming soon: Real-time subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Planned</span>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestHub;
