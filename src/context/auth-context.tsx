"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  fetchMe,
  login as apiLogin,
  logout as apiLogout,
  type AuthUser,
  type LoginPayload,
} from "@/lib/api";

type AuthContextValue = {
  user: AuthUser | null;
  /** True until we know whether someone is logged in. */
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  /** Re-read the current user from /me (e.g. after email verification). */
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Session lives in Laravel's httpOnly cookie, so we just ask /me who we are.
  // 401 (not logged in) or any other failure -> treat as logged out.
  const refresh = useCallback(async () => {
    try {
      const res = await fetchMe();
      setUser(res.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetchMe();
        if (!cancelled) setUser(res.user ?? null);
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      await apiLogin(payload); // sets the session cookie
      await refresh(); // then load the user (cart-context reacts to this)
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // even if the request fails, clear local state
    }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout, refresh }),
    [user, isLoading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
