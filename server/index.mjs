import http from "node:http";
import { loadFirebaseConfig, loadSupabaseConfig } from "./secretManager.mjs";

// Fail fast at startup if any required secret is missing.
const [firebaseConfig, supabaseConfig] = await Promise.all([
  loadFirebaseConfig(),
  loadSupabaseConfig(),
]);

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);

  // Basic CORS for browser config fetches.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type, authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  if (url.pathname === "/config/firebase") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(firebaseConfig));
    return;
  }

  if (url.pathname === "/config/supabase") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(supabaseConfig));
    return;
  }

  if (url.pathname === "/health") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "Not found" }));
});

const port = 8081;
server.listen(port, "0.0.0.0", () => {
  console.log(`[config-server] listening on :${port}`);
});

