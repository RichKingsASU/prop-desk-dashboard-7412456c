import type { NextFunction, Request, Response } from "express";
import { sendError } from "../api/errors.js";
import { getFirebaseAuth } from "./firebase_admin.js";

function parseBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  return match[1] ?? null;
}

export async function requireFirebaseAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = parseBearerToken(req.header("authorization"));
    if (!token) {
      return sendError(res, 401, "UNAUTHENTICATED", "Missing or invalid Authorization header", {
        requestId: req.requestId,
      });
    }

    const decoded = await getFirebaseAuth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      email: typeof decoded.email === "string" ? decoded.email : undefined,
    };
    return next();
  } catch {
    return sendError(res, 401, "UNAUTHENTICATED", "Invalid authentication token", {
      requestId: req.requestId,
    });
  }
}

