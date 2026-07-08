import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { getFirebaseAuth, isFirebaseConfigured } from "@/firebase/config";

import { isEmailAllowed } from "./allowedEmails";
import type { AuthUser } from "./types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

function mapUser(user: User): AuthUser {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

async function resolveAuthUser(nextUser: User | null) {
  if (!nextUser) {
    return { user: null as AuthUser | null, error: null as string | null };
  }

  if (!isEmailAllowed(nextUser.email)) {
    const auth = getFirebaseAuth();
    await firebaseSignOut(auth);
    return { user: null, error: "auth.notAllowed" };
  }

  return { user: mapUser(nextUser), error: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      void resolveAuthUser(nextUser).then(({ user: resolvedUser, error: resolvedError }) => {
        setUser(resolvedUser);
        setError(resolvedError);
        setLoading(false);
      });
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch {
      setError("auth.error");
      throw new Error("Google sign-in failed");
    }
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
    } catch {
      setError("auth.error");
      throw new Error("Sign-out failed");
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      signInWithGoogle,
      signOut,
      clearError,
    }),
    [user, loading, error, signInWithGoogle, signOut, clearError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
