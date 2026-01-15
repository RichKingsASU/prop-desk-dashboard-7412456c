import admin from "firebase-admin";
import { getSettings } from "../config/settings.js";

let app: admin.app.App | null = null;

export function getFirebaseAdminApp(): admin.app.App {
  if (app) return app;

  const settings = getSettings();
  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId: settings.firebase.projectId,
      clientEmail: settings.firebase.clientEmail,
      privateKey: settings.firebase.privateKey,
    }),
  });

  return app;
}

export function getFirebaseAuth(): admin.auth.Auth {
  return getFirebaseAdminApp().auth();
}

