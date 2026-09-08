"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { AuthUser } from "@/types";
import { apiFetch } from "@/lib/api-client";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch<{ authenticated: boolean; user: AuthUser | null }>("/api/auth/me");
      if (res && res.authenticated && res.user) {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Logout request error:", err);
    } finally {
      // Clear client session and user-specific cached data
      setUser(null);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("autopulse_active_org_id");
          sessionStorage.clear();
        } catch {
          // ignore
        }
        // Force hard navigation to /login to flush browser back/forward client memory cache
        window.location.replace("/login");
      }
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        refreshUser,
        signOut,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
