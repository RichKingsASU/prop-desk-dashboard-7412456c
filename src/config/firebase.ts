export type FirebaseRuntimeConfig = {
  FIREBASE_API_KEY: string;
  FIREBASE_AUTH_DOMAIN: string;
  FIREBASE_PROJECT_ID: string;
  FIREBASE_APP_ID: string;
};

let firebaseConfigPromise: Promise<FirebaseRuntimeConfig> | null = null;

export function getFirebaseRuntimeConfig(): Promise<FirebaseRuntimeConfig> {
  if (firebaseConfigPromise) return firebaseConfigPromise;

  firebaseConfigPromise = (async () => {
    const res = await fetch("/config/firebase", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      throw new Error(`Failed to load Firebase config: HTTP ${res.status}`);
    }

    const data = (await res.json()) as Partial<FirebaseRuntimeConfig>;
    if (!data.FIREBASE_API_KEY) throw new Error("Missing Firebase config: FIREBASE_API_KEY");
    if (!data.FIREBASE_AUTH_DOMAIN) throw new Error("Missing Firebase config: FIREBASE_AUTH_DOMAIN");
    if (!data.FIREBASE_PROJECT_ID) throw new Error("Missing Firebase config: FIREBASE_PROJECT_ID");
    if (!data.FIREBASE_APP_ID) throw new Error("Missing Firebase config: FIREBASE_APP_ID");

    return {
      FIREBASE_API_KEY: data.FIREBASE_API_KEY,
      FIREBASE_AUTH_DOMAIN: data.FIREBASE_AUTH_DOMAIN,
      FIREBASE_PROJECT_ID: data.FIREBASE_PROJECT_ID,
      FIREBASE_APP_ID: data.FIREBASE_APP_ID,
    };
  })();

  return firebaseConfigPromise;
}

