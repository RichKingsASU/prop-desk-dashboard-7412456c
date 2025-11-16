import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
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

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-sm font-medium">Master Controls</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="bot-enabled" className="text-sm font-medium">
              Bot Enabled
            </Label>
            <p className="text-xs text-muted-foreground">
              {controls.bot_enabled ? "Bot will open & manage positions" : "Bot is paused"}
            </p>
          </div>
          <Switch
            id="bot-enabled"
            checked={controls.bot_enabled}
            onCheckedChange={() => handleToggle("bot_enabled")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="buying-enabled" className="text-sm font-medium">
              Buying Enabled
            </Label>
            <p className="text-xs text-muted-foreground">
              {controls.buying_enabled ? "Can open new long positions" : "No new entries allowed"}
            </p>
          </div>
          <Switch
            id="buying-enabled"
            checked={controls.buying_enabled}
            onCheckedChange={() => handleToggle("buying_enabled")}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="selling-enabled" className="text-sm font-medium">
              Selling Enabled
            </Label>
            <p className="text-xs text-muted-foreground">
              {controls.selling_enabled ? "Can exit positions" : "Bot can only hold"}
            </p>
          </div>
          <Switch
            id="selling-enabled"
            checked={controls.selling_enabled}
            onCheckedChange={() => handleToggle("selling_enabled")}
          />
        </div>
      </div>

      <div className="border-t border-destructive/20 pt-4 mt-4">
        <Button
          variant="destructive"
          className="w-full font-semibold"
          onClick={() => setShowPanicDialog(true)}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          PANIC
        </Button>
      </div>

      <AlertDialog open={showPanicDialog} onOpenChange={setShowPanicDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirm Panic Action
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Liquidate all open positions</li>
                <li>Cancel all open orders</li>
                <li>Disable the bot</li>
              </ul>
              <p className="mt-3 font-semibold">This action cannot be undone. Are you sure?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onPanic}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Execute Panic
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
