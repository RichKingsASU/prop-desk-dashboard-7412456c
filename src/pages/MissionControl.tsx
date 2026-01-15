import { useEffect, useState, useRef } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Rocket, Play, Square } from "lucide-react";
import { toast } from "sonner";

interface SystemState {
  id: number;
  is_running: boolean | null;
  active_symbol: string | null;
  last_heartbeat: string | null;
}

interface SystemLog {
  id: string;
  message: string | null;
  source: string | null;
  created_at: string;
}

export default function MissionControl() {
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingCommand, setIsSendingCommand] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!isSupabaseConfigured()) {
        setIsLoading(false);
        return;
      }

      const supabase = getSupabaseClient();
      // Fetch system state
      const { data: stateData } = await supabase
        .from("system_state")
        .select("*")
        .limit(1)
        .single();

      if (stateData) {
        setSystemState(stateData);
      }

      // Fetch last 50 logs
      const { data: logsData } = await supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (logsData) {
        setLogs(logsData.reverse());
      }

      setIsLoading(false);
    };

    fetchData();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseClient();

    const stateChannel = supabase
      .channel("system-state-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "system_state" },
        (payload) => {
          setSystemState(payload.new as SystemState);
        }
      )
      .subscribe();

    const logsChannel = supabase
      .channel("system-logs-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "system_logs" },
        (payload) => {
          setLogs((prev) => {
            const newLogs = [...prev, payload.new as SystemLog];
            // Keep only last 50
            return newLogs.slice(-50);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(stateChannel);
      supabase.removeChannel(logsChannel);
    };
  }, []);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const sendCommand = async (command: "START" | "STOP") => {
    setIsSendingCommand(true);
    try {
      if (!isSupabaseConfigured()) {
        throw new Error("Cannot send command: Supabase is not configured.");
      }
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from("system_commands")
        .insert({ command, status: "PENDING" });

      if (error) throw error;
      toast.success(`${command} command sent`);
    } catch (err) {
      toast.error(`Failed to send ${command} command`);
      console.error(err);
    } finally {
      setIsSendingCommand(false);
    }
  };

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const isOnline = systemState?.is_running === true;

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Rocket className="h-8 w-8 text-green-400" />
        <h1 className="text-2xl md:text-3xl font-bold tracking-wider">
          AgentTrader Mission Control
        </h1>
      </div>

      {/* Status Indicator */}
      <div className="mb-8">
        <div
          className={`
            inline-flex items-center gap-3 px-6 py-4 rounded-lg border-2 text-xl font-bold
            ${
              isOnline
                ? "border-green-500 bg-green-500/10 text-green-400"
                : "border-red-500 bg-red-500/10 text-red-400"
            }
          `}
        >
          <span
            className={`
              inline-block w-4 h-4 rounded-full
              ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}
            `}
          />
          {isLoading
            ? "LOADING..."
            : isOnline
            ? "🟢 SYSTEM ONLINE"
            : "🔴 SYSTEM OFFLINE"}
        </div>

        {systemState?.active_symbol && (
          <div className="mt-2 text-sm text-green-600">
            Active Symbol: {systemState.active_symbol}
          </div>
        )}

        {systemState?.last_heartbeat && (
          <div className="mt-1 text-xs text-green-700">
            Last Heartbeat: {new Date(systemState.last_heartbeat).toLocaleString()}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mb-8">
        <Button
          onClick={() => sendCommand("START")}
          disabled={isSendingCommand || isOnline}
          className="
            h-14 px-8 text-lg font-bold
            bg-green-600 hover:bg-green-500 text-black
            border-2 border-green-400
            shadow-[0_0_20px_rgba(34,197,94,0.4)]
            hover:shadow-[0_0_30px_rgba(34,197,94,0.6)]
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <Play className="h-5 w-5 mr-2" />
          START
        </Button>

        <Button
          onClick={() => sendCommand("STOP")}
          disabled={isSendingCommand || !isOnline}
          className="
            h-14 px-8 text-lg font-bold
            bg-red-600 hover:bg-red-500 text-white
            border-2 border-red-400
            shadow-[0_0_20px_rgba(239,68,68,0.4)]
            hover:shadow-[0_0_30px_rgba(239,68,68,0.6)]
            transition-all duration-300
            disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <Square className="h-5 w-5 mr-2" />
          STOP
        </Button>
      </div>

      {/* Live Terminal */}
      <div className="mb-4">
        <h2 className="text-lg font-bold mb-2 text-green-300">
          📟 System Logs
        </h2>
        <div
          ref={terminalRef}
          className="
            h-[400px] overflow-y-auto
            bg-black border border-green-500/30 rounded-lg
            p-4 text-sm
            shadow-[inset_0_0_30px_rgba(34,197,94,0.05)]
          "
        >
          {logs.length === 0 ? (
            <div className="text-green-700 animate-pulse">
              Waiting for logs...
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="mb-1 leading-relaxed">
                <span className="text-green-600">
                  [{formatTimestamp(log.created_at)}]
                </span>{" "}
                {log.source && (
                  <span className="text-cyan-400">[{log.source}]</span>
                )}{" "}
                <span className="text-green-400">{log.message}</span>
              </div>
            ))
          )}
          <div className="text-green-500 animate-pulse">▌</div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-green-700 border-t border-green-900 pt-4">
        <span>AgentTrader v1.0</span>
        <span className="mx-2">|</span>
        <span>Connected to Supabase Realtime</span>
      </div>
    </div>
  );
}
