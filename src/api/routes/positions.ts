import { Router } from "express";
import { requireFirebaseAuth } from "@/auth/middleware";
import { sendError } from "@/api/errors";
import { listPositionsByUid } from "@/db/repositories/trades_repo";

export function positionsRouter() {
  const router = Router();

  router.get("/positions", requireFirebaseAuth, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) {
      return sendError(res, 401, "UNAUTHENTICATED", "Unauthenticated", { requestId: req.requestId });
    }
    const positions = await listPositionsByUid(uid);
    return res.status(200).json({ positions });
  });

  return router;
}

