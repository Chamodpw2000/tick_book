"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  AuthUser,
  getToken,
  getStoredUser,
  setToken,
  setStoredUser,
  clearAuth,
} from "@/lib/auth";
import { userClient } from "@/api/client";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

const PUBLIC_PATHS = ["/login"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync state from storage
  const syncAuth = useCallback(() => {
    const storedToken = getToken();
    const storedUser = getStoredUser();

    if (storedToken && storedUser) {
      setTokenState(storedToken);
      setUser(storedUser);
    } else {
      setTokenState(null);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  // Initial hydration
  useEffect(() => {
    syncAuth();
    
    // Listen for storage changes (logout in another tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "tickety_admin_token" || e.key === "tickety_admin_user") {
        syncAuth();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [syncAuth]);

  // Redirect logic — handled via side effect to avoid render-time routing
  useEffect(() => {
    if (isLoading) return;

    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    if (!token && !isPublic) {
      // Not logged in and trying to access private page
      router.replace("/login");
    } else if (token && isPublic) {
      // Logged in and trying to access login page
      router.replace("/");
    }
  }, [isLoading, token, pathname, router]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await userClient.post("/users/login", { email, password });
      const { token: newToken, user: newUser } = res.data;

      setToken(newToken);
      setStoredUser(newUser);
      setTokenState(newToken);
      setUser(newUser);

      // router.replace will be handled by the redirect useEffect
    },
    []
  );

  const logout = useCallback(() => {
    clearAuth();
    setTokenState(null);
    setUser(null);
    // router.replace will be handled by the redirect useEffect
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      logout,
    }),
    [user, token, isLoading, login, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

