import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/auth/firebase";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, opts: { status: number; code?: string; details?: unknown }) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
  }
}

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

async function getAuthHeader(): Promise<string | null> {
  const auth = await getFirebaseAuth();
  const user = auth.currentUser;
  if (!user) return null;
  const token = await user.getIdToken();
  return `Bearer ${token}`;
}

function joinUrl(base: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function getApiBaseUrl(): string {
  // Prefer runtime-injected config, otherwise fall back to same-origin relative.
  // Intentionally does NOT read import.meta.env / process.env.
  const w = window as unknown as { __RUNTIME_CONFIG__?: { API_BASE_URL?: string } };
  const raw = (w.__RUNTIME_CONFIG__?.API_BASE_URL ?? "").trim();
  return raw ? normalizeBaseUrl(raw) : "";
}

export type ApiFetchOptions = {
  /**
   * Defaults to true. Set false ONLY for public endpoints like /healthz.
   */
  requireAuth?: boolean;
};

export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit = {},
  options: ApiFetchOptions = {}
): Promise<T> {
  const requireAuth = options.requireAuth ?? true;

  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  // Only set JSON content-type if caller isn't sending FormData / Blob.
  const bodyIsFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body !== undefined && !bodyIsFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (requireAuth) {
    const authHeader = await getAuthHeader();
    if (!authHeader) {
      window.location.assign("/auth");
      throw new ApiError("Authentication required", { status: 401, code: "auth_required" });
    }
    headers.set("Authorization", authHeader);
  }

  const res = await fetch(joinUrl(getApiBaseUrl(), path), {
    ...init,
    headers,
  });

  if (res.status === 401 && requireAuth) {
    // Token revoked/expired or backend rejected; force re-auth.
    try {
      await signOut(await getFirebaseAuth());
    } finally {
      window.location.assign("/auth");
    }
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let details: unknown = undefined;
    let message = `HTTP ${res.status}`;
    let code: string | undefined;

    if (isJson) {
      try {
        const data = (await res.json()) as any;
        details = data;
        message = data?.error?.message || data?.message || message;
        code = data?.error?.code || data?.code;
      } catch {
        // ignore JSON parse errors
      }
    } else {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {
        // ignore
      }
    }

    throw new ApiError(message, { status: res.status, code, details });
  }

  if (res.status === 204) {
    return undefined as T;
  }

  if (isJson) {
    return (await res.json()) as T;
  }

  // If backend returns empty for 200, normalize to undefined.
  const text = await res.text();
  return (text ? (text as unknown as Json) : undefined) as T;
}

