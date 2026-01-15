/**
 * Runtime (non-env) configuration accessor.
 *
 * This file intentionally does NOT read `import.meta.env` or `process.env`.
 * If the backend is served on the same origin, leaving base URLs empty will
 * make requests relative to the current origin.
 */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function readRuntime(name: "API_BASE_URL" | "WS_BASE_URL" | "BACKEND_URL"): string | undefined {
  const w = window as unknown as { __RUNTIME_CONFIG__?: Record<string, unknown> };
  const v = w.__RUNTIME_CONFIG__?.[name];
  return typeof v === "string" ? v : undefined;
}

export const env = {
  apiBaseUrl: (() => {
    const v = (readRuntime("API_BASE_URL") ?? "").trim();
    return v ? normalizeBaseUrl(v) : "";
  })(),
  wsBaseUrl: (() => {
    const v = (readRuntime("WS_BASE_URL") ?? "").trim();
    return v ? normalizeBaseUrl(v) : undefined;
  })(),
  backendUrl: (() => {
    const v = (readRuntime("BACKEND_URL") ?? "").trim();
    return v ? normalizeBaseUrl(v) : "";
  })(),
} as const;

export type Env = typeof env;

