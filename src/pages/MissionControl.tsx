import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Rocket, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { client } from "@/integrations/backend/client";

interface SystemState {
  is_running: boolean | null;
  active_symbol: string | null;
  last_heartbeat: string | null;
}

interface SystemLog {
  id: string;
  message: string;
  source: string | null;
  created_at: string;
}

function coerceSystemState(raw: unknown): SystemState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const isRunning =
    typeof r.is_running === "boolean"
      ? r.is_running
      : typeof r.running === "boolean"
      ? r.running
      : typeof r.status === "string"
      ? ["running", "online", "ok", "healthy"].includes(r.status.toLowerCase())
      : null;

  const activeSymbol =
    typeof r.active_symbol === "string"
      ? r.active_symbol
      : typeof r.symbol === "string"
      ? r.symbol
      : null;

  const lastHeartbeat =
    typeof r.last_heartbeat === "string"
      ? r.last_heartbeat
      : typeof r.heartbeat === "string"
      ? r.heartbeat
      : typeof r.updated_at === "string"
      ? r.updated_at
      : null;

  return { is_running: isRunning, active_symbol: activeSymbol, last_heartbeat: lastHeartbeat };
}

function coerceLogs(raw: unknown): SystemLog[] {
  const arr = Array.isArray(raw)
    ? raw
    : raw && typeof raw === "object" && Array.isArray((raw as any).logs)
    ? (raw as any).logs
    : raw && typeof raw === "object" && Array.isArray((raw as any).data)
    ? (raw as any).data
    : [];

  const logs: SystemLog[] = arr
    .map((item: any, idx: number) => {
      const createdAtRaw =
        item?.created_at ?? item?.timestamp ?? item?.ts ?? item?.time ?? item?.date ?? null;
      const createdAt =
        typeof createdAtRaw === "string"
          ? createdAtRaw
          : typeof createdAtRaw === "number"
          ? new Date(createdAtRaw).toISOString()
          : createdAtRaw instanceof Date
          ? createdAtRaw.toISOString()
          : new Date().toISOString();

      const messageRaw = item?.message ?? item?.msg ?? item?.text ?? item?.line ?? item?.event ?? null;
      const message =
        typeof messageRaw === "string"
          ? messageRaw
          : messageRaw == null
          ? ""
          : JSON.stringify(messageRaw);

      const sourceRaw = item?.source ?? item?.service ?? item?.logger ?? item?.category ?? null;
      const source = typeof sourceRaw === "string" ? sourceRaw : null;

      const idRaw = item?.id ?? item?._id ?? item?.uuid ?? null;
      const id = typeof idRaw === "string" ? idRaw : `${createdAt}-${idx}`;

      return { id, message, source, created_at: createdAt };
    })
    .filter((l) => l.message.length > 0);

  // Normalize to ascending time for terminal UX.
  const sorted = [...logs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  return sorted.slice(-50);
}

export default function MissionControl() {
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingCommand, setIsSendingCommand] = useState(false);
  const [isCommandSupported, setIsCommandSupported] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);
  const pollInFlightRef = useRef(false);
  const lastLogTsRef = useRef<string | null>(null);

  const pollIntervalMs = useMemo(() => 7000, []);

  // Poll system state + logs until WS exists.
  useEffect(() => {
    // TODO: wire to REST API once implemented.
    setSystemState(null);
    setLogs([]);
    setIsLoading(false);
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
      toast.error(`${command} command not available in this build yet`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("not found") || msg.includes("404")) {
        // TODO: If backend does not support POST /system/commands, wire this to the correct endpoint once available.
        setIsCommandSupported(false);
        toast.error("Commands endpoint not supported by backend");
      } else {
        toast.error(`Failed to send ${command} command`);
      }
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
          disabled={isSendingCommand || isOnline || !isCommandSupported}
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
          disabled={isSendingCommand || !isOnline || !isCommandSupported}
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
        <span>Connected to API</span>
      </div>
    </div>
  );
}
