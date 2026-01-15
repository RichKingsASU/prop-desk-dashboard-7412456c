import { Router } from "express";
import { requireFirebaseAuth } from "@/auth/middleware";
import { sendError } from "@/api/errors";
import { getProfileByUid, upsertProfile } from "@/db/repositories/profiles_repo";

export function profilesRouter() {
  const router = Router();

  router.get("/profiles/me", requireFirebaseAuth, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) {
      return sendError(res, 401, "UNAUTHENTICATED", "Unauthenticated", { requestId: req.requestId });
    }

    const profile = await getProfileByUid(uid);
    return res.status(200).json({
      profile:
        profile ??
        ({
          uid,
          email: req.user?.email ?? null,
          display_name: null,
          avatar_url: null,
          trading_mode: null,
        } as const),
    });
  });

  router.patch("/profiles/me", requireFirebaseAuth, async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) {
      return sendError(res, 401, "UNAUTHENTICATED", "Unauthenticated", { requestId: req.requestId });
    }

    const body = (req.body ?? {}) as Partial<{
      display_name: string | null;
      avatar_url: string | null;
      trading_mode: string | null;
    }>;

    const updated = await upsertProfile({
      uid,
      email: req.user?.email ?? null,
      display_name: typeof body.display_name === "string" || body.display_name === null ? body.display_name : null,
      avatar_url: typeof body.avatar_url === "string" || body.avatar_url === null ? body.avatar_url : null,
      trading_mode: typeof body.trading_mode === "string" || body.trading_mode === null ? body.trading_mode : null,
    });

    return res.status(200).json({ profile: updated });
  });

  return router;
}

