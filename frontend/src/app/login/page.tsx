"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      router.push("/campaigns");
    } catch (err) {
      setError(err instanceof Error ? err.message : "falha no login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel" style={{ maxWidth: 420 }}>
      <h1>Entrar</h1>
      <form onSubmit={submit}>
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" data-testid="login-email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password">Senha</label>
        <input id="password" type="password" data-testid="login-password"
          value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="error" data-testid="login-error">{error}</p>}
        <div style={{ marginTop: ".8rem" }}>
          <button type="submit" data-testid="login-submit" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </div>
      </form>
      <p className="muted" style={{ marginTop: "1rem" }}>
        Não tem conta? <Link href="/register">Criar conta</Link>
      </p>
    </div>
  );
}
