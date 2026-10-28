"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState(null);
  const [credits, setCredits] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Fetch live session and credits from database
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setCredits(data.user.credits ?? 0);
      } else {
        setUser(null);
        setCredits(0);
      }
    } catch (err) {
      console.error("[AUTH CONTEXT] Error fetching session:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync when NextAuth session status changes
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const timer = setTimeout(() => refreshSession(), 0);
      return () => clearTimeout(timer);
    } else if (status === "unauthenticated") {
      const timer = setTimeout(() => refreshSession(), 0);
      return () => clearTimeout(timer);
    }
  }, [session, status, refreshSession]);

  useEffect(() => {
    // Listen to cross-component credits sync events
    const handleSync = (e) => {
      if (typeof e.detail?.credits === "number") {
        setCredits(e.detail.credits);
        setUser((prev) => (prev ? { ...prev, credits: e.detail.credits } : prev));
      }
    };
    window.addEventListener("revid-credits-updated", handleSync);
    return () => window.removeEventListener("revid-credits-updated", handleSync);
  }, []);

  // Google Login handler
  const loginWithGoogle = async (callbackUrl = "/") => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl });
    } catch (err) {
      console.error("[AUTH] Google Sign-In error:", err);
      setIsLoading(false);
      throw err;
    }
  };

  // Sign out handler
  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut({ redirect: false });
      setUser(null);
      setCredits(0);
    } catch (err) {
      console.error("[AUTH] Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        credits,
        isLoading,
        isAuthenticated: !!user,
        isTopUpOpen,
        setIsTopUpOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        loginWithGoogle,
        login: loginWithGoogle,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
