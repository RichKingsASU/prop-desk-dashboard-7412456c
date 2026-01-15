import { createContext, useContext, ReactNode } from "react";

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface AuthProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  trading_mode: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: AuthProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Auth is intentionally disabled (no backend configured).
  const value: AuthContextType = {
    user: null,
    profile: null,
    loading: false,
    signOut: async () => {}
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
