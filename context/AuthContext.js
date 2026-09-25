"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

const AuthContext = createContext(null);

const SESSION_COOKIE = "hb_session";

function setSessionFlag(days = 7) {
  if (typeof document === "undefined") return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${SESSION_COOKIE}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearSessionFlag() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const res = await api.get("/api/auth/me");
        if (!cancelled && res.data?.success && res.data.user) {
          setUser(res.data.user);
          setSessionFlag();
        } else if (!cancelled) {
          setUser(null);
          clearSessionFlag();
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          clearSessionFlag();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * After successful login. JWTs live in HttpOnly cookies set by the API.
   */
  const login = (userData, opts = {}) => {
    setUser(userData);
    setSessionFlag(opts.remember ? 30 : 7);
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      // clear local state anyway
    }
    setUser(null);
    clearSessionFlag();
    router.push("/auth/login");
  };

  const isAuthenticated = !!user;
  const isAdmin =
    isAuthenticated && (user?.role === "admin" || user?.role === "super_admin");
  const isSuperAdmin = isAuthenticated && user?.role === "super_admin";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        updateUser,
        logout,
        isAuthenticated,
        isAdmin,
        isSuperAdmin,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
