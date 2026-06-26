"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register(email, password, displayName);
      router.push("/campaigns");
    } catch (err) {
      setError(err instanceof Error ? err.message : "falha no cadastro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel" style={{ maxWidth: 420 }}>
      <h1>Criar conta</h1>
      <form onSubmit={submit}>
        <label htmlFor="name">Nome de exibição</label>
        <input id="name" data-testid="register-name"
          value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        <label htmlFor="email">E-mail</label>
        <input id="email" type="email" data-testid="register-email"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password">Senha (mín. 8)</label>
        <input id="password" type="password" data-testid="register-password"
          value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="error" data-testid="register-error">{error}</p>}
        <div style={{ marginTop: ".8rem" }}>
          <button type="submit" data-testid="register-submit" disabled={busy}>
            {busy ? "Criando…" : "Criar conta"}
          </button>
        </div>
      </form>
      <p className="muted" style={{ marginTop: "1rem" }}>
        Já tem conta? <Link href="/login">Entrar</Link>
      </p>
    </div>
  );
}
