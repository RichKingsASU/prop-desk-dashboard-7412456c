import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Power, ShoppingCart, TrendingDown } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BotControls {
  bot_enabled: boolean;
  buying_enabled: boolean;
  selling_enabled: boolean;
}

interface MasterControlPanelProps {
  controls: BotControls;
  onControlChange: (controls: BotControls) => void;
  onPanic: () => void;
}

export const MasterControlPanel = ({ controls, onControlChange, onPanic }: MasterControlPanelProps) => {
  const [showPanicDialog, setShowPanicDialog] = useState(false);

  const handleToggle = (key: keyof BotControls) => {
    onControlChange({
      ...controls,
      [key]: !controls[key],
    });
  };

  const handlePanicConfirm = () => {
    onPanic();
    setShowPanicDialog(false);
  };

  return (
    <Card className="p-5">
      <div className="space-y-5">
        <div className="space-y-4">
          {/* Bot Enabled */}
          <div className="flex items-center justify-between p-3 rounded-lg border-2 border-border hover:bg-accent/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${controls.bot_enabled ? "bg-bull/10" : "bg-muted"}`}>
                <Power className={`h-4 w-4 ${controls.bot_enabled ? "text-bull" : "text-muted-foreground"}`} />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="bot-enabled" className="text-sm font-semibold cursor-pointer">
                  Bot Enabled
                </Label>
                <p className="text-xs text-muted-foreground">
                  {controls.bot_enabled ? "Bot is actively trading" : "Bot is paused"}
                </p>
              </div>
            </div>
            <Switch
              id="bot-enabled"
              checked={controls.bot_enabled}
              onCheckedChange={() => handleToggle("bot_enabled")}
              className="data-[state=checked]:bg-bull"
            />
          </div>

          {/* Buying Enabled */}
          <div className="flex items-center justify-between p-3 rounded-lg border-2 border-border hover:bg-accent/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${controls.buying_enabled ? "bg-bull/10" : "bg-muted"}`}>
                <ShoppingCart className={`h-4 w-4 ${controls.buying_enabled ? "text-bull" : "text-muted-foreground"}`} />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="buying-enabled" className="text-sm font-semibold cursor-pointer">
                  Buying Enabled
                </Label>
                <p className="text-xs text-muted-foreground">
                  {controls.buying_enabled ? "Can open new positions" : "No new entries"}
                </p>
              </div>
            </div>
            <Switch
              id="buying-enabled"
              checked={controls.buying_enabled}
              onCheckedChange={() => handleToggle("buying_enabled")}
              className="data-[state=checked]:bg-bull"
            />
          </div>

          {/* Selling Enabled */}
          <div className="flex items-center justify-between p-3 rounded-lg border-2 border-border hover:bg-accent/5 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-md ${controls.selling_enabled ? "bg-bear/10" : "bg-muted"}`}>
                <TrendingDown className={`h-4 w-4 ${controls.selling_enabled ? "text-bear" : "text-muted-foreground"}`} />
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="selling-enabled" className="text-sm font-semibold cursor-pointer">
                  Selling Enabled
                </Label>
                <p className="text-xs text-muted-foreground">
                  {controls.selling_enabled ? "Can exit positions" : "Exits disabled"}
                </p>
              </div>
            </div>
            <Switch
              id="selling-enabled"
              checked={controls.selling_enabled}
              onCheckedChange={() => handleToggle("selling_enabled")}
              className="data-[state=checked]:bg-bear"
            />
          </div>
        </div>

        {/* Helper Text */}
        <div className="bg-muted/50 rounded-md p-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Tip:</strong> Disable buying to let the bot manage exits only, 
            or disable selling to prevent the bot from closing positions.
          </p>
        </div>

        {/* Panic Button */}
        <div className="pt-4 border-t-2 border-destructive/20">
          <Button
            variant="destructive"
            size="lg"
            className="w-full font-bold text-base h-12 shadow-lg shadow-destructive/20 hover:shadow-xl hover:shadow-destructive/30 transition-all"
            onClick={() => setShowPanicDialog(true)}
          >
            <AlertTriangle className="mr-2 h-5 w-5" />
            PANIC
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Emergency liquidation of all positions
          </p>
        </div>
      </div>

      {/* Panic Confirmation Dialog */}
      <AlertDialog open={showPanicDialog} onOpenChange={setShowPanicDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive text-xl">
              <AlertTriangle className="h-6 w-6" />
              Confirm Panic Action
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base pt-2">
              <p className="mb-3 font-semibold">This will immediately:</p>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Liquidate all open positions at market price</li>
                <li>Cancel all pending orders</li>
                <li>Disable bot trading (all toggles off)</li>
              </ul>
              <p className="mt-4 font-semibold text-destructive">
                This action cannot be undone. Are you absolutely sure?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePanicConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Execute PANIC
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
