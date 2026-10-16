"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  getSession,
  subscribe,
  signInWithPassword,
  signUp as signUpRequest,
  sendMagicLink,
  signInWithOAuth,
  signOut as signOutRequest,
  type AuthUser,
} from "@/lib/auth/client";
import { getSocket, disconnectSocket } from "@/lib/socket";

export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password?: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signInWithGithub: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  signIn: async () => ({ error: "AuthProvider not mounted" }),
  signUp: async () => ({ error: "AuthProvider not mounted" }),
  signInWithGoogle: async () => ({ error: "AuthProvider not mounted" }),
  signInWithGithub: async () => ({ error: "AuthProvider not mounted" }),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // The client hydrates synchronously from localStorage, so there is no
    // initial network round trip.
    const initial = getSession();
    setUser(initial?.user ?? null);
    setLoading(false);
    if (initial?.user) {
      getSocket().catch(() => {});
    }

    const unsubscribe = subscribe((session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getSocket().catch(() => {});
      } else {
        disconnectSocket();
      }
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email: string, password?: string) => {
    if (password) {
      return signInWithPassword(email, password);
    }
    return sendMagicLink(email);
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName?: string) => {
    return signUpRequest(email, password, displayName);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    return signInWithOAuth("google");
  }, []);

  const signInWithGithub = useCallback(async () => {
    return signInWithOAuth("github");
  }, []);

  const signOut = useCallback(async () => {
    disconnectSocket();
    await signOutRequest();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signInWithGoogle, signInWithGithub, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
