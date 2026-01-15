import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Auth() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Agent Trader</CardTitle>
          <CardDescription>Authentication is currently disabled</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            This build has no configured authentication provider. If you need gated access, wire the app to your
            chosen auth/backend stack.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
