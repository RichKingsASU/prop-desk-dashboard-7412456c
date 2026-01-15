import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import pino from "pino";

import { getSettings } from "../config/settings.js";
import { sendError } from "./errors.js";
import { healthzRouter } from "./routes/healthz.js";
import { profilesRouter } from "./routes/profiles.js";
import { tradesRouter } from "./routes/trades.js";
import { positionsRouter } from "./routes/positions.js";
import { systemRouter } from "./routes/system.js";
import { marketRouter } from "./routes/market.js";
import { devLogsRouter } from "./routes/dev_logs.js";
import { uploadsRouter } from "./routes/uploads.js";

// Fail fast on startup if required env vars are missing.
const settings = getSettings();

export const app = express();
const logger = pino();

app.disable("x-powered-by");

app.use((req, res, next) => {
  const requestId = (req.header("x-request-id") ?? "").trim() || randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

app.use((req, res, next) => {
  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info({
      request_id: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Math.round(durationMs),
    });
  });
  next();
});

app.use(
  cors({
    origin(origin, callback) {
      if (settings.allowedOrigins === "*") return callback(null, true);
      if (!origin) return callback(null, true);
      if (settings.allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS: origin not allowed"));
    },
  }),
);

app.use(express.json({ limit: "1mb" }));

// Shared router registration: mounted at both "/" and "/api" for compatibility.
const router = express.Router();
router.use(
  healthzRouter(),
  profilesRouter(),
  tradesRouter(),
  positionsRouter(),
  systemRouter(),
  marketRouter(),
  devLogsRouter(),
  uploadsRouter(),
);
app.use(router);
app.use("/api", router);

app.use((_req, res) => {
  return sendError(res, 404, "NOT_FOUND", "Route not found");
});

app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err, request_id: req.requestId }, "Unhandled error");
  return sendError(res, 500, "INTERNAL", "Internal server error", { requestId: req.requestId });
});

app.listen(settings.port, () => {
  // Cloud Run structured logs: JSON line via pino.
  // Avoid logging secrets by only logging safe config.
  console.log(
    JSON.stringify({
      severity: "INFO",
      message: "API server started",
      port: settings.port,
    }),
  );
});

