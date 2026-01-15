import { GoogleAuth } from "npm:google-auth-library@9.15.1";

const SCOPES = ["https://www.googleapis.com/auth/cloud-platform"];

const auth = new GoogleAuth({ scopes: SCOPES });

let projectIdPromise: Promise<string> | null = null;
let accessTokenPromise: Promise<string> | null = null;
const secretCache = new Map<string, string>();

async function getProjectId(): Promise<string> {
  if (!projectIdPromise) {
    projectIdPromise = (async () => {
      const projectId = await auth.getProjectId();
      if (!projectId) throw new Error("Google Cloud project id not available for Secret Manager access");
      return projectId;
    })();
  }
  return projectIdPromise;
}

async function getAccessToken(): Promise<string> {
  if (!accessTokenPromise) {
    accessTokenPromise = (async () => {
      const client = await auth.getClient();
      const token = await client.getAccessToken();
      const accessToken = typeof token === "string" ? token : token?.token;
      if (!accessToken) throw new Error("Unable to obtain Google OAuth access token for Secret Manager");
      return accessToken;
    })();
  }
  return accessTokenPromise;
}

async function fetchSecretValue(secretName: string): Promise<string> {
  const [projectId, accessToken] = await Promise.all([getProjectId(), getAccessToken()]);

  const url =
    `https://secretmanager.googleapis.com/v1/projects/${encodeURIComponent(projectId)}` +
    `/secrets/${encodeURIComponent(secretName)}` +
    `/versions/latest:access`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (res.status === 404) {
    throw new Error(`Missing Google Secret Manager secret: ${secretName}`);
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Secret Manager access failed for ${secretName}: HTTP ${res.status} ${body}`.trim());
  }

  const data = (await res.json()) as { payload?: { data?: string } };
  const encoded = data.payload?.data;
  if (!encoded) throw new Error(`Secret Manager returned empty payload for ${secretName}`);

  const decoded = atob(encoded);
  // Secret values often have a trailing newline when created from files.
  return decoded.endsWith("\n") ? decoded.slice(0, -1) : decoded;
}

export async function getRequiredSecret(secretName: string): Promise<string> {
  const cached = secretCache.get(secretName);
  if (cached) return cached;

  const value = await fetchSecretValue(secretName);
  if (!value) throw new Error(`Secret ${secretName} is present but empty`);

  secretCache.set(secretName, value);
  return value;
}

