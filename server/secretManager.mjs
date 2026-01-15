import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();

async function getProjectId() {
  // Uses Google Application Default Credentials / metadata server.
  const projectId = await client.getProjectId();
  if (!projectId) throw new Error("Google Cloud project id not available for Secret Manager access");
  return projectId;
}

async function accessSecret(secretName) {
  const projectId = await getProjectId();
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;

  try {
    const [version] = await client.accessSecretVersion({ name });
    const buf = version.payload?.data;
    if (!buf) throw new Error(`Secret Manager returned empty payload for ${secretName}`);
    const decoded = buf.toString("utf8");
    return decoded.endsWith("\n") ? decoded.slice(0, -1) : decoded;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Normalize common not-found shapes.
    if (msg.includes("NOT_FOUND") || msg.includes("not found")) {
      throw new Error(`Missing Google Secret Manager secret: ${secretName}`);
    }
    throw err;
  }
}

export async function loadFirebaseConfig() {
  const config = {
    FIREBASE_API_KEY: await accessSecret("FIREBASE_API_KEY"),
    FIREBASE_AUTH_DOMAIN: await accessSecret("FIREBASE_AUTH_DOMAIN"),
    FIREBASE_PROJECT_ID: await accessSecret("FIREBASE_PROJECT_ID"),
    FIREBASE_APP_ID: await accessSecret("FIREBASE_APP_ID"),
  };

  for (const [k, v] of Object.entries(config)) {
    if (!v) throw new Error(`Secret ${k} is present but empty`);
  }

  return config;
}

export async function loadSupabaseConfig() {
  const config = {
    VITE_SUPABASE_URL: await accessSecret("VITE_SUPABASE_URL"),
    VITE_SUPABASE_PUBLISHABLE_KEY: await accessSecret("VITE_SUPABASE_PUBLISHABLE_KEY"),
  };

  for (const [k, v] of Object.entries(config)) {
    if (!v) throw new Error(`Secret ${k} is present but empty`);
  }

  return config;
}

