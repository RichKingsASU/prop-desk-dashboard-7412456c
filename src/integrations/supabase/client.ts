import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { getRuntimeConfigRaw } from "@/config/runtime";

type SupabaseRuntimeConfig = {
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
};

let cachedClient: SupabaseClient<Database> | null = null;

function readSupabaseRuntimeConfig(): SupabaseRuntimeConfig | null {
  const raw = getRuntimeConfigRaw();
  const url = raw.SUPABASE_URL;
  const key = raw.SUPABASE_PUBLISHABLE_KEY;

  if (typeof url !== "string" || url.trim().length === 0) return null;
  if (typeof key !== "string" || key.trim().length === 0) return null;

  return { SUPABASE_URL: url.trim(), SUPABASE_PUBLISHABLE_KEY: key.trim() };
}

export function isSupabaseConfigured(): boolean {
  return readSupabaseRuntimeConfig() !== null;
}

export function getSupabaseClient(): SupabaseClient<Database> {
  if (cachedClient) return cachedClient;

  const cfg = readSupabaseRuntimeConfig();
  if (!cfg) {
    throw new Error(
      [
        "Supabase is not configured.",
        "",
        "Provide `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` via either:",
        "- `window.__RUNTIME_CONFIG__` (injected by the host), or",
        "- `GET /config/app` (JSON).",
      ].join("\n")
    );
  }

  cachedClient = createClient<Database>(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return cachedClient;
}