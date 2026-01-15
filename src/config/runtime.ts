export type RuntimeConfig = {
  API_BASE_URL: string;
  WS_BASE_URL?: string;
};

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: Record<string, unknown>;
  }
}

let cached: RuntimeConfig | null = null;
let cachedRaw: Record<string, unknown> | null = null;

function normalizeBaseUrl(value: string): string {
  // Trim and remove trailing slashes to avoid `//` when joining paths.
  return value.trim().replace(/\/+$/, "");
}

function toRuntimeConfig(input: unknown): RuntimeConfig {
  const obj = (input ?? {}) as Record<string, unknown>;
  const apiBase = obj.API_BASE_URL;
  const wsBase = obj.WS_BASE_URL;

  if (typeof apiBase !== "string" || apiBase.trim().length === 0) {
    throw new Error(
      [
        "Runtime configuration error: `API_BASE_URL` is required but was not provided.",
        "",
        "Provide it via either:",
        "- `window.__RUNTIME_CONFIG__ = { API_BASE_URL: \"https://...\" }` (e.g. injected by the host), or",
        "- `GET /config/app` returning JSON containing `{ \"API_BASE_URL\": \"https://...\" }`.",
      ].join("\n")
    );
  }

  const config: RuntimeConfig = {
    API_BASE_URL: normalizeBaseUrl(apiBase),
  };

  if (typeof wsBase === "string" && wsBase.trim().length > 0) {
    config.WS_BASE_URL = normalizeBaseUrl(wsBase);
  }

  return config;
}

/**
 * Returns the runtime configuration synchronously.
 * Prefer calling `loadRuntimeConfig()` once at startup to ensure the config is available.
 */
export function getRuntimeConfig(): RuntimeConfig {
  if (cached) return cached;
  cached = toRuntimeConfig(window.__RUNTIME_CONFIG__);
  return cached;
}

export function getRuntimeConfigRaw(): Record<string, unknown> {
  if (cachedRaw) return cachedRaw;
  cachedRaw = (window.__RUNTIME_CONFIG__ ?? {}) as Record<string, unknown>;
  return cachedRaw;
}

/**
 * Loads runtime configuration at app startup.
 * Source order:
 *  1) `window.__RUNTIME_CONFIG__` if present
 *  2) `GET /config/app` (JSON)
 */
export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  if (cached) return cached;

  if (window.__RUNTIME_CONFIG__ && Object.keys(window.__RUNTIME_CONFIG__).length > 0) {
    cachedRaw = window.__RUNTIME_CONFIG__;
    cached = toRuntimeConfig(window.__RUNTIME_CONFIG__);
    return cached;
  }

  const resp = await fetch("/config/app", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!resp.ok) {
    throw new Error(
      `Runtime configuration error: failed to fetch \`/config/app\` (HTTP ${resp.status}). ` +
        "Either inject `window.__RUNTIME_CONFIG__` or expose the JSON endpoint."
    );
  }

  const json = (await resp.json()) as unknown;

  // Make the fetched config visible to any code that reads it synchronously.
  window.__RUNTIME_CONFIG__ = {
    ...(window.__RUNTIME_CONFIG__ ?? {}),
    ...(json as Record<string, unknown>),
  };
  cachedRaw = window.__RUNTIME_CONFIG__;

  cached = toRuntimeConfig(window.__RUNTIME_CONFIG__);
  return cached;
}

