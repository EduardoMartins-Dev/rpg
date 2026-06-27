"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

/** Tela de autenticação em duas colunas (aside de marca + formulário com abas). */
export function AuthScreen({ mode }: { mode: "login" | "signup" }) {
  const { login, register } = useAuth();
  const router = useRouter();
  const isSignup = mode === "signup";

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [regOn, setRegOn] = useState(true);

  useEffect(() => {
    api.get<{ registrationEnabled: boolean }>("/auth/config")
      .then((c) => setRegOn(c.registrationEnabled)).catch(() => setRegOn(false));
  }, []);

  const tid = (s: string) => `${isSignup ? "register" : "login"}-${s}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (isSignup) await register(email, password, displayName);
      else await login(email, password);
      router.push("/campaigns");
    } catch (err) {
      setError(err instanceof Error ? err.message : isSignup ? "falha no cadastro" : "falha no login");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <aside className="auth-aside">
        <Logo />
        <div>
          <h2>A sua mesa, em qualquer sistema.</h2>
          <p>Campanhas, fichas dinâmicas e regras na ponta dos dedos. Reúna o grupo e role os dados.</p>
        </div>
        <div className="mono" style={{ fontSize: 13, color: "var(--muted)" }}>› multi-sistema · fichas dinâmicas · IA por sistema</div>
      </aside>

      <main className="auth-main">
        <div className="auth-card fade-up">
          {regOn && (
            <div className="auth-tabs">
              <Link href="/login" className={!isSignup ? "on" : ""}>Entrar</Link>
              <Link href="/register" className={isSignup ? "on" : ""}>Criar conta</Link>
            </div>
          )}

          {isSignup && !regOn ? (
            <>
              <h3>Cadastro fechado</h3>
              <p className="sub">Novas contas estão desativadas. Apenas usuários existentes podem entrar.</p>
              <Link href="/login"><button style={{ width: "100%", marginTop: 8 }}>Ir para o login</button></Link>
            </>
          ) : (
          <>
          <h3>{isSignup ? "Criar conta" : "Bem-vindo de volta"}</h3>
          <p className="sub">{isSignup ? "Monte seu perfil e comece a jogar." : "Entre para acessar suas campanhas."}</p>

          <form onSubmit={submit}>
            {isSignup && (
              <label>Nome
                <input data-testid="register-name" value={displayName} placeholder="Como te chamam na mesa"
                  onChange={(e) => setDisplayName(e.target.value)} style={{ marginTop: 7 }} />
              </label>
            )}
            <label>E-mail
              <input type="email" data-testid={tid("email")} value={email} placeholder="voce@email.com"
                onChange={(e) => setEmail(e.target.value)} style={{ marginTop: 7 }} />
            </label>
            <label>Senha{isSignup ? " (mín. 8)" : ""}
              <input type="password" data-testid={tid("password")} value={password}
                onChange={(e) => setPassword(e.target.value)} style={{ marginTop: 7 }} />
            </label>

            {error && <p className="error" data-testid={tid("error")}>⚠ {error}</p>}

            <button type="submit" data-testid={tid("submit")} disabled={busy} style={{ marginTop: 4 }}>
              {busy && <span className="spinner" />}
              {busy ? (isSignup ? "Criando…" : "Entrando…") : (isSignup ? "Criar conta" : "Entrar")}
            </button>
          </form>

          {(isSignup || regOn) && (
            <p className="sub" style={{ textAlign: "center", marginTop: 24 }}>
              {isSignup ? "Já tem conta? " : "Não tem conta? "}
              <Link href={isSignup ? "/login" : "/register"} style={{ fontWeight: 500 }}>
                {isSignup ? "Entrar" : "Criar conta"}
              </Link>
            </p>
          )}
          </>
          )}
        </div>
      </main>
    </div>
  );
}
