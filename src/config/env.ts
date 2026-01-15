type RequiredEnv =
  | "VITE_FIREBASE_API_KEY"
  | "VITE_FIREBASE_AUTH_DOMAIN"
  | "VITE_FIREBASE_PROJECT_ID"
  | "VITE_FIREBASE_APP_ID"
  | "VITE_API_BASE_URL";

type OptionalEnv = "VITE_WS_BASE_URL";

function readEnv(name: RequiredEnv | OptionalEnv): string | undefined {
  // Centralized access point (hard rule: no import.meta.env usage elsewhere)
  return import.meta.env[name];
}

function requireEnv(name: RequiredEnv): string {
  const value = readEnv(name);
  if (!value) {
    throw new Error(
      `[env] Missing required environment variable: ${name}. ` +
        "Create a .env (or configure your hosting provider) before running the UI."
    );
  }
  return value;
}

function normalizeBaseUrl(url: string): string {
  // Remove trailing slashes so callers can safely prefix with "/..."
  return url.replace(/\/+$/, "");
}

export const env = {
  firebase: {
    apiKey: requireEnv("VITE_FIREBASE_API_KEY"),
    authDomain: requireEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: requireEnv("VITE_FIREBASE_PROJECT_ID"),
    appId: requireEnv("VITE_FIREBASE_APP_ID"),
  },
  apiBaseUrl: normalizeBaseUrl(requireEnv("VITE_API_BASE_URL")),
  wsBaseUrl: (() => {
    const v = readEnv("VITE_WS_BASE_URL");
    return v ? normalizeBaseUrl(v) : undefined;
  })(),
  isDev: import.meta.env.DEV,
} as const;

export type Env = typeof env;

