import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getRequiredSecret } from "../_shared/gcpSecretManager.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type FirebaseConfig = {
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_APP_ID: string;
};

// Fail fast on cold start if any secret is missing.
const firebaseConfig: FirebaseConfig = {
  FIREBASE_API_KEY: await getRequiredSecret("FIREBASE_API_KEY"),
  FIREBASE_AUTH_DOMAIN: await getRequiredSecret("FIREBASE_AUTH_DOMAIN"),
  FIREBASE_PROJECT_ID: await getRequiredSecret("FIREBASE_PROJECT_ID"),
  FIREBASE_APP_ID: await getRequiredSecret("FIREBASE_APP_ID"),
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
      ? `window.__RUNTIME_CONFIG__ = Object.assign(window.__RUNTIME_CONFIG__ || {}, ${JSON.stringify(firebaseConfig)});\n`
      : JSON.stringify(firebaseConfig),
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

