import { Router } from "express";
import { requireFirebaseAuth } from "@/auth/middleware";
import { sendError } from "@/api/errors";
import { listTradesByUid } from "@/db/repositories/trades_repo";

export function tradesRouter() {
  const router = Router();

  router.get("/trades", requireFirebaseAuth, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) {
      return sendError(res, 401, "UNAUTHENTICATED", "Unauthenticated", { requestId: req.requestId });
    }
    const trades = await listTradesByUid(uid);
    return res.status(200).json({ trades });
  });

  router.post("/trades", requireFirebaseAuth, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) {
      return sendError(res, 401, "UNAUTHENTICATED", "Unauthenticated", { requestId: req.requestId });
    }

    const body = (req.body ?? {}) as Partial<{
      symbol: string;
      side: "buy" | "sell";
      qty: number;
      price?: number | null;
      status?: string | null;
      source?: string | null;
    }>;

    // Stub (no DB logic yet): accept payload, return shape with null server-generated fields.
    return res.status(201).json({
      trade: {
        id: null,
        created_at: null,
        uid,
        symbol: typeof body.symbol === "string" ? body.symbol : "",
        side: body.side === "buy" || body.side === "sell" ? body.side : "buy",
        qty: typeof body.qty === "number" ? body.qty : 0,
        price: typeof body.price === "number" ? body.price : null,
        status: typeof body.status === "string" ? body.status : null,
        source: typeof body.source === "string" ? body.source : null,
      },
    });
  });

  return router;
}

