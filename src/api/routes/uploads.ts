import { Router } from "express";
import multer from "multer";
import { requireFirebaseAuth } from "@/auth/middleware";
import { sendError } from "@/api/errors";

const upload = multer({ storage: multer.memoryStorage() });

export function uploadsRouter() {
  const router = Router();

  // Avatar upload stub: accepts multipart/form-data with field "file".
  router.post("/uploads/avatar", requireFirebaseAuth, upload.single("file"), async (req, res) => {
    if (!req.user?.uid) {
      return sendError(res, 401, "UNAUTHENTICATED", "Unauthenticated", { requestId: req.requestId });
    }

    // TODO: store file in durable storage (e.g. GCS) and persist URL in Postgres.
    const hasFile = Boolean(req.file?.buffer?.length);
    return res.status(200).json({ ok: true, uploaded: hasFile, url: null });
  });

  return router;
}

