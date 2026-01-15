import { Router } from "express";

export function healthzRouter() {
  const router = Router();
  router.get("/healthz", (_req, res) => {
    res.status(200).json({ ok: true });
  });
  return router;
}

