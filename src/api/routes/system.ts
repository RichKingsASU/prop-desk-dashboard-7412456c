import { Router } from "express";
import { requireFirebaseAuth } from "../../auth/middleware.js";
import { sendError } from "../errors.js";
import { getSystemStatus } from "../../db/repositories/system_repo.js";

export function systemRouter() {
  const router = Router();

  router.get("/system/status", requireFirebaseAuth, async (req, res) => {
    if (!req.user?.uid) {
      return sendError(res, 401, "UNAUTHENTICATED", "Unauthenticated", { requestId: req.requestId });
    }
    const status = await getSystemStatus();
    return res.status(200).json({ status });
  });

  return router;
}

