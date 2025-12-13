
// lib/auth-context.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, SupabaseUser } from "./supabaseClient";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

/**
 * Types exposed to your UI components
 */
type AuthContextValue = {
  user: SupabaseUser;
  isLoading: boolean;
  isAuthenticated: boolean;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<boolean>;
  signout: () => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  // add any other helpers here (e.g., sendMagicLink)
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // initialize: get current session user
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (mounted) setUser(currentUser ?? null);
      } catch (err) {
        console.error("Error getting supabase user on init:", err);
        if (mounted) setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    // listen to auth changes (sign in/out, refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      // session?.user may be null on sign out
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  const signup = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        // you can send options for redirect URLs here if you use email confirmation
      });
      if (error) {
        return { success: false, error: error.message };
      }

      // If Supabase returns a user, update state
      setUser(data?.user ?? null);
      return { success: true };
    } catch (err: unknown) {
      console.error("signup error", err);
      return { success: false, error: (err as Error)?.message ?? "Unknown error" };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.warn("login error", error);
        return false;
      }
      setUser(data.user ?? null);
      return true;
    } catch (err: unknown) {
      console.error("login exception", err);
      return false;
    }
  };

  const signout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (err) {
      console.error("signout error", err);
    }
  };

  const resetPassword = async (email: string, newPassword: string) => {
    /**
     * Supabase standard flow for password reset:
     * - supabase.auth.resetPasswordForEmail(email, {redirectTo})
     *   will send an email with a link where the user can set a new password.
     *
     * If you want to implement a server-side password reset (knowing a token), you can
     * call supabase.auth.updateUser in the session with the access token.
     *
     * For the purposes of your UI (which currently simulates sending an email),
     * this implementation will try the email-reset flow and return whether the request succeeded.
     */
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        // optional: redirectTo: "https://your-domain.com/reset-callback",
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: unknown) {
      console.error("resetPassword error", err);
      return { success: false, error: (err as Error)?.message ?? "Unknown error" };
    }
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      signup,
      login,
      signout,
      resetPassword,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
