"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken, type TokenResponse, type User } from "./api";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!getToken()) { setUser(null); setLoading(false); return; }
    try {
      setUser(await api.get<User>("/me"));
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  // Acorda o backend (Render free dorme após inatividade) já no load da página,
  // pra que o login não bata num cold start de ~50s. Fire-and-forget.
  useEffect(() => {
    fetch("/api/ping", { cache: "no-store" }).catch(() => { /* ok */ });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const t = await api.post<TokenResponse>("/auth/login", { email, password });
    setToken(t.accessToken);
    setUser(await api.get<User>("/me"));
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    await api.post("/auth/register", { email, password, displayName });
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
