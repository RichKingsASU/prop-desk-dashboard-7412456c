type AlpacaEnv = "paper" | "live";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  if (!value) return undefined;
  return value;
}

function parseBool(name: string, value: string): boolean {
  const v = value.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  throw new Error(`Invalid boolean for ${name}: ${value}`);
}

function parseAlpacaEnv(value: string): AlpacaEnv {
  const v = value.trim().toLowerCase();
  if (v === "paper" || v === "live") return v;
  throw new Error(`Invalid ALPACA_ENV: ${value} (expected paper|live)`);
}

function parseAllowedOrigins(value: string | undefined): string[] | "*" {
  if (!value || value.trim() === "" || value.trim() === "*") return "*";
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export type Settings = {
  port: number;
  allowedOrigins: string[] | "*";

  firebase: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };

  db:
    | { mode: "url"; url: string }
    | {
        mode: "parts";
        host: string;
        port: number;
        user: string;
        password: string;
        name: string;
      };

  tradingEnabled: boolean;

  alpaca: {
    apiKey: string;
    secretKey: string;
    env: AlpacaEnv;
  };
};

let cached: Settings | null = null;

export function getSettings(): Settings {
  if (cached) return cached;

  const databaseUrl = readOptionalEnv("DATABASE_URL");
  const dbHost = readOptionalEnv("DB_HOST");

  const db: Settings["db"] =
    databaseUrl
      ? { mode: "url", url: databaseUrl }
      : {
          mode: "parts",
          host: requireEnv("DB_HOST"),
          port: Number(readOptionalEnv("DB_PORT") ?? "5432"),
          user: requireEnv("DB_USER"),
          password: requireEnv("DB_PASSWORD"),
          name: requireEnv("DB_NAME"),
        };

  // If DATABASE_URL wasn't provided but DB_HOST was also missing, the above throws a clear message.
  if (!databaseUrl && !dbHost) {
    // Preserve fail-fast semantics with the required env name.
    requireEnv("DATABASE_URL");
  }

  const port = Number(readOptionalEnv("PORT") ?? "8080");
  if (!Number.isFinite(port) || port <= 0) {
    throw new Error(`Invalid PORT: ${readOptionalEnv("PORT")}`);
  }

  const settings: Settings = {
    port,
    allowedOrigins: parseAllowedOrigins(readOptionalEnv("ALLOWED_ORIGINS")),
    firebase: {
      projectId: requireEnv("FIREBASE_PROJECT_ID"),
      clientEmail: requireEnv("FIREBASE_CLIENT_EMAIL"),
      // Commonly provided with literal '\n' sequences in env vars.
      privateKey: requireEnv("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
    },
    db,
    tradingEnabled: parseBool("TRADING_ENABLED", requireEnv("TRADING_ENABLED")),
    alpaca: {
      apiKey: requireEnv("ALPACA_API_KEY"),
      secretKey: requireEnv("ALPACA_SECRET_KEY"),
      env: parseAlpacaEnv(requireEnv("ALPACA_ENV")),
    },
  };

  cached = settings;
  return settings;
}

