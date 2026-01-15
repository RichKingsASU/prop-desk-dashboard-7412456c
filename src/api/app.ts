import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { randomUUID } from "node:crypto";

import { getSettings } from "@/config/settings";
import { sendError } from "@/api/errors";
import { healthzRouter } from "@/api/routes/healthz";
import { profilesRouter } from "@/api/routes/profiles";
import { tradesRouter } from "@/api/routes/trades";
import { positionsRouter } from "@/api/routes/positions";
import { systemRouter } from "@/api/routes/system";
import { marketRouter } from "@/api/routes/market";
import { devLogsRouter } from "@/api/routes/dev_logs";
import { uploadsRouter } from "@/api/routes/uploads";

// Fail fast on startup if required env vars are missing.
const settings = getSettings();

export const app = express();

app.disable("x-powered-by");

app.use((req, res, next) => {
  const requestId = (req.header("x-request-id") ?? "").trim() || randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

app.use(
  pinoHttp({
    customProps: (req) => ({ request_id: req.requestId }),
    serializers: {
      req(req) {
        return { method: req.method, url: req.url, request_id: (req as any).requestId };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  req.log?.error({ err, request_id: req.requestId }, "Unhandled error");
  return sendError(res, 500, "INTERNAL", "Internal server error", { requestId: req.requestId });
});

app.listen(settings.port, () => {
  // Cloud Run structured logs: JSON line via pino.
  // Avoid logging secrets by only logging safe config.
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      severity: "INFO",
      message: "API server started",
      port: settings.port,
    }),
  );
});

