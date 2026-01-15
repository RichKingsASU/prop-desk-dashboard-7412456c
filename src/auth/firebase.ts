import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

type FirebaseBackendConfig = {
  FIREBASE_API_KEY?: unknown;
  FIREBASE_AUTH_DOMAIN?: unknown;
  FIREBASE_PROJECT_ID?: unknown;
  FIREBASE_APP_ID?: unknown;
};

type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
};

let firebaseConfigPromise: Promise<FirebaseClientConfig> | null = null;
let firebaseAppPromise: Promise<FirebaseApp> | null = null;
let firebaseAuthPromise: Promise<Auth> | null = null;

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

function validateFirebaseConfig(raw: FirebaseBackendConfig): FirebaseClientConfig {
  const required: Array<keyof FirebaseBackendConfig> = [
    "FIREBASE_API_KEY",
    "FIREBASE_AUTH_DOMAIN",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_APP_ID",
  ];

  const missing = required.filter((k) => typeof raw[k] !== "string" || !(raw[k] as string).trim());
  if (missing.length > 0) {
    throw new Error(
      `[firebase] Missing required config field(s): ${missing.join(
        ", "
      )}. The backend /config/firebase response must include non-empty strings for all required fields.`
    );
  }

  return {
    apiKey: (raw.FIREBASE_API_KEY as string).trim(),
    authDomain: (raw.FIREBASE_AUTH_DOMAIN as string).trim(),
    projectId: (raw.FIREBASE_PROJECT_ID as string).trim(),
    appId: (raw.FIREBASE_APP_ID as string).trim(),
  };
}

async function fetchFirebaseConfig(): Promise<FirebaseClientConfig> {
  if (firebaseConfigPromise) return await firebaseConfigPromise;

  firebaseConfigPromise = (async () => {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/config/firebase`;

    const res = await fetch(url, { method: "GET", headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`[firebase] Failed to load config from GET /config/firebase (HTTP ${res.status})`);
    }

    let data: unknown;
    try {
      data = (await res.json()) as unknown;
    } catch {
      throw new Error("[firebase] Invalid JSON from GET /config/firebase");
    }

    if (!data || typeof data !== "object") {
      throw new Error("[firebase] Invalid response shape from GET /config/firebase (expected JSON object)");
    }

    return validateFirebaseConfig(data as FirebaseBackendConfig);
  })();

  return await firebaseConfigPromise;
}

export async function getFirebaseApp(): Promise<FirebaseApp> {
  if (firebaseAppPromise) return await firebaseAppPromise;

  firebaseAppPromise = (async () => {
    const apps = getApps();
    if (apps.length > 0) return apps[0]!;

    const cfg = await fetchFirebaseConfig();
    return initializeApp(cfg);
  })();

  return await firebaseAppPromise;
}

export async function getFirebaseAuth(): Promise<Auth> {
  if (firebaseAuthPromise) return await firebaseAuthPromise;
  firebaseAuthPromise = (async () => getAuth(await getFirebaseApp()))();
  return await firebaseAuthPromise;
}

