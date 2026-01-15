import type { Response } from "express";

export type ErrorBody = {
  error: {
    code: string;
    message: string;
    request_id?: string;
    details?: unknown;
  };
};

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  opts?: { requestId?: string; details?: unknown },
) {
  const body: ErrorBody = {
    error: {
      code,
      message,
      request_id: opts?.requestId,
      details: opts?.details,
    },
  };
  return res.status(status).json(body);
}

