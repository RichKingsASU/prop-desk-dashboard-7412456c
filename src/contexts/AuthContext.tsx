import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { firebaseAuth } from "@/auth/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  googleSignIn: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo<AuthContextType>(() => {
    return {
      user,
      loading,
      signIn: async (email: string, password: string) => {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      },
      signUp: async (email: string, password: string) => {
        await createUserWithEmailAndPassword(firebaseAuth, email, password);
      },
      signOut: async () => {
        await firebaseSignOut(firebaseAuth);
      },
      googleSignIn: async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(firebaseAuth, provider);
      },
      getIdToken: async (forceRefresh?: boolean) => {
        const currentUser = firebaseAuth.currentUser;
        if (!currentUser) return null;
        return await currentUser.getIdToken(Boolean(forceRefresh));
      },
    };
  }, [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
