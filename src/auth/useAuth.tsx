import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { getFirebaseAuth } from "@/auth/firebase";
import { apiClient, type Profile } from "@/api/client";

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  googleSignIn: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function safeLoadProfile(): Promise<Profile | null> {
  try {
    return await apiClient.getProfileMe();
  } catch {
    // Profile is non-critical for boot; UI can continue with user-only state.
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bootError, setBootError] = useState<Error | null>(null);

  const refreshProfile = async () => {
    setProfile(await safeLoadProfile());
  };

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const auth = await getFirebaseAuth();
        if (cancelled) return;

        unsub = onAuthStateChanged(auth, async (nextUser) => {
          setUser(nextUser);
          if (nextUser) {
            setProfile(await safeLoadProfile());
          } else {
            setProfile(null);
          }
          setLoading(false);
        });
      } catch (e) {
        if (cancelled) return;
        const err = e instanceof Error ? e : new Error(String(e));
        setBootError(err);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  if (bootError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6 text-card-foreground">
          <div className="text-lg font-semibold">Firebase failed to initialize</div>
          <p className="mt-2 text-sm text-muted-foreground">
            The UI can’t start authentication because required Firebase config is missing or invalid.
          </p>
          <div className="mt-4 rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">
            {bootError.message}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Expected backend endpoint: <span className="font-mono">GET /config/firebase</span> returning{" "}
            <span className="font-mono">
              FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_APP_ID
            </span>
            .
          </p>
        </div>
      </div>
    );
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      signIn: async (email, password) => {
        await signInWithEmailAndPassword(await getFirebaseAuth(), email, password);
      },
      signUp: async (email, password) => {
        await createUserWithEmailAndPassword(await getFirebaseAuth(), email, password);
      },
      signOut: async () => {
        await firebaseSignOut(await getFirebaseAuth());
        setUser(null);
        setProfile(null);
      },
      googleSignIn: async () => {
        await signInWithPopup(await getFirebaseAuth(), new GoogleAuthProvider());
      },
      refreshProfile,
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

