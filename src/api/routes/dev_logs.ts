import { Router } from "express";
import { requireFirebaseAuth } from "@/auth/middleware";
import { sendError } from "@/api/errors";
import { insertDevEventLogs, listDevEventLogs } from "@/db/repositories/dev_event_logs_repo";

export function devLogsRouter() {
  const router = Router();

  router.post("/dev/logs", requireFirebaseAuth, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) {
      return sendError(res, 401, "UNAUTHENTICATED", "Unauthenticated", { requestId: req.requestId });
    }

    const body = (req.body ?? {}) as Partial<{ logs: unknown[] }>;
    const logsRaw = Array.isArray(body.logs) ? body.logs : [];

    const logs = logsRaw
      .filter((l): l is Record<string, unknown> => typeof l === "object" && l !== null)
      .map((l) => ({
        source: typeof l.source === "string" ? l.source : "unknown",
        level: typeof l.level === "string" ? l.level : "info",
        event_type: typeof l.event_type === "string" ? l.event_type : "unknown",
        message: typeof l.message === "string" ? l.message : "",
        meta: typeof l.meta === "object" && l.meta !== null ? (l.meta as Record<string, unknown>) : undefined,
        uid,
      }));

    const result = await insertDevEventLogs(logs);
    return res.status(200).json({ ok: true, inserted: result.inserted });
  });

  router.get("/dev/logs", requireFirebaseAuth, async (req, res) => {
    if (!req.user?.uid) {
      return sendError(res, 401, "UNAUTHENTICATED", "Unauthenticated", { requestId: req.requestId });
    }
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    const logs = await listDevEventLogs({ limit: Number.isFinite(limit ?? NaN) ? limit : undefined });
    return res.status(200).json({ logs });
  });

  return router;
}

