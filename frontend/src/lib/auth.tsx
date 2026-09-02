"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken, setRefreshToken, type TokenResponse, type User } from "./api";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  /** Recarrega /me para o contexto (usar após editar o próprio perfil). */
  refreshUser: () => Promise<void>;
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

  const login = useCallback(async (email: string, password: string) => {
    const t = await api.post<TokenResponse>("/auth/login", { email, password });
    setToken(t.accessToken);
    setRefreshToken(t.refreshToken);
    setUser(await api.get<User>("/me"));
  }, []);

  const register = useCallback(async (email: string, password: string, displayName: string) => {
    await api.post("/auth/register", { email, password, displayName });
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => { setToken(null); setRefreshToken(null); setUser(null); }, []);

  const refreshUser = useCallback(async () => {
    if (!getToken()) return;
    setUser(await api.get<User>("/me"));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
