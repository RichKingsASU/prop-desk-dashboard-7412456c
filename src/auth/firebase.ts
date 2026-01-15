import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

function requiredEnv(name: string): string {
  const value = import.meta.env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `Missing required env var ${name}. Add it to your Vite env (VITE_*) and restart the dev server.`
    );
  }
  return value;
}

const firebaseConfig = {
  apiKey: requiredEnv("VITE_FIREBASE_API_KEY"),
  authDomain: requiredEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: requiredEnv("VITE_FIREBASE_PROJECT_ID"),
  appId: requiredEnv("VITE_FIREBASE_APP_ID"),
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

