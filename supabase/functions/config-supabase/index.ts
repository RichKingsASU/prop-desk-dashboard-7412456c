import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRequiredSecret } from "../_shared/gcpSecretManager.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type SupabaseConfig = {
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_PUBLISHABLE_KEY: string;
};

// Fail fast on cold start if any required value is missing.
const supabaseConfig: SupabaseConfig = {
  VITE_SUPABASE_URL: await getRequiredSecret("VITE_SUPABASE_URL"),
  VITE_SUPABASE_PUBLISHABLE_KEY: await getRequiredSecret("VITE_SUPABASE_PUBLISHABLE_KEY"),
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const asJs = url.searchParams.get("format") === "js";

  return new Response(
    asJs
      ? `window.__RUNTIME_CONFIG__ = Object.assign(window.__RUNTIME_CONFIG__ || {}, ${JSON.stringify(supabaseConfig)});\n`
      : JSON.stringify(supabaseConfig),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": asJs ? "application/javascript; charset=utf-8" : "application/json",
        "Cache-Control": "no-store",
      },
    }
  );
});

