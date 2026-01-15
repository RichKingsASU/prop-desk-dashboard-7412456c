type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface BackendClientOptions {
  /**
   * Base URL for the backend API.
   * - If empty/undefined, requests are made relative to the current origin.
   */
  baseUrl?: string;
  /**
   * Request timeout in milliseconds.
   */
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;

function normalizeBaseUrl(baseUrl?: string) {
  const raw = (baseUrl ?? "").trim();
  if (!raw) return "";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

async function requestJson(
  url: string,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const controller = new AbortController();
  const t = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      signal: controller.signal,
    });

    // Some endpoints may return empty bodies (e.g. 204).
    const text = await res.text().catch(() => "");
    const data = text ? (JSON.parse(text) as JsonValue) : null;
    return { ok: res.ok, status: res.status, data };
  } finally {
    window.clearTimeout(t);
  }
}

async function tryPathsJson(
  baseUrl: string,
  paths: string[],
  init?: RequestInit,
  timeoutMs?: number
): Promise<unknown> {
  let lastNon404: { status: number; data: unknown } | null = null;

  for (const p of paths) {
    const url = `${baseUrl}${p.startsWith("/") ? p : `/${p}`}`;
    const res = await requestJson(url, init, timeoutMs ?? DEFAULT_TIMEOUT_MS);

    if (res.ok) return res.data;
    if (res.status === 404) continue;

    lastNon404 = { status: res.status, data: res.data };
  }

  if (lastNon404) {
    throw new Error(`Backend request failed (HTTP ${lastNon404.status})`);
  }
  throw new Error("Backend endpoint not found (tried multiple paths)");
}

export function createBackendClient(options?: BackendClientOptions) {
  // Intentionally does NOT read import.meta.env / process.env.
  const w = window as unknown as { __RUNTIME_CONFIG__?: { BACKEND_URL?: string } };
  const runtimeBaseUrl = (w.__RUNTIME_CONFIG__?.BACKEND_URL ?? "").trim();
  const baseUrl = normalizeBaseUrl(options?.baseUrl ?? runtimeBaseUrl);
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  return {
    /**
     * System state/status for Mission Control.
     * Tries a few common endpoints; the first that exists wins.
     */
    async getSystemStatus(): Promise<unknown> {
      return await tryPathsJson(baseUrl, ["/system/status", "/system/state", "/system"], undefined, timeoutMs);
    },

    /**
     * System logs for Mission Control.
     * The backend shape varies; caller should normalize.
     */
    async getSystemLogs(params?: { limit?: number; since?: string }): Promise<unknown> {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set("limit", String(params.limit));
      if (params?.since) qs.set("since", params.since);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";

      return await tryPathsJson(
        baseUrl,
        [`/system/logs${suffix}`, `/logs/system${suffix}`, `/logs${suffix}`],
        undefined,
        timeoutMs
      );
    },

    /**
     * Dev logs endpoint (some backends split "dev" vs "system" logs).
     */
    async getDevLogs(params?: { limit?: number; since?: string }): Promise<unknown> {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set("limit", String(params.limit));
      if (params?.since) qs.set("since", params.since);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";

      return await tryPathsJson(baseUrl, [`/dev/logs${suffix}`, `/logs/dev${suffix}`], undefined, timeoutMs);
    },

    /**
     * Send a system command to the backend.
     * Returns backend response JSON if available.
     */
    async postSystemCommand(command: "START" | "STOP"): Promise<unknown> {
      return await tryPathsJson(
        baseUrl,
        ["/system/commands"],
        { method: "POST", body: JSON.stringify({ command }) },
        timeoutMs
      );
    },
  };
}

export const client = createBackendClient();

