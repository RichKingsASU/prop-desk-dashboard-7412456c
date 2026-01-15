import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { env } from "@/config/env";

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        apiKey: env.firebase.apiKey,
        authDomain: env.firebase.authDomain,
        projectId: env.firebase.projectId,
        appId: env.firebase.appId,
      });

export const auth = getAuth(firebaseApp);

