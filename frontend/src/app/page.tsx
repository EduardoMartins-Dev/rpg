"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";

const FEATURES = [
  { icon: "📜", title: "Multi-sistema", body: "Agnóstico de regras — cada sistema traz seu próprio schema de ficha." },
  { icon: "🗂️", title: "Fichas dinâmicas", body: "Crie e edite fichas em etapas, com atributos, clãs e derivados automáticos." },
  { icon: "✦", title: "Mestre de Regras IA", body: "Pergunte as regras do sistema e receba respostas ancoradas no material." },
  { icon: "🎲", title: "Mesa e convites", body: "Crie campanhas, convide jogadores e gerencie tudo num lugar só." },
];

export default function Home() {
  const { user } = useAuth();
  const [regOn, setRegOn] = useState(false);

  useEffect(() => {
    api.get<{ registrationEnabled: boolean }>("/auth/config")
      .then((c) => setRegOn(c.registrationEnabled)).catch(() => setRegOn(false));
  }, []);

  return (
    <div className="landing">
      <header className="landing-head">
        <Logo />
        <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {user ? (
            <Link href="/campaigns"><button>Ir para o app</button></Link>
          ) : (
            <>
              <Link href="/login" data-testid="nav-login">
                <button className={regOn ? "ghost" : ""}>Entrar</button>
              </Link>
              {regOn && <Link href="/register" data-testid="nav-register"><button>Criar conta</button></Link>}
            </>
          )}
        </nav>
      </header>

      <section className="hero fade-up">
        <span className="pill"><span className="dot" />Agnóstico de sistema · multi-RPG</span>
        <h1>Crie campanhas, gerencie fichas e consulte as regras com <span className="accent">IA</span> — para qualquer sistema de RPG.</h1>
        <p>Uma mesa digital sóbria e poderosa. Você escolhe o sistema, convida os jogadores e a plataforma cuida do resto — fichas dinâmicas, convites e um mestre de regras sempre à mão.</p>
        <div className="cta-row">
          {regOn && <Link href="/register"><button style={{ padding: "15px 28px", fontSize: 16 }}>Criar conta grátis</button></Link>}
          <Link href="/login"><button className={regOn ? "secondary" : ""} style={{ padding: "15px 28px", fontSize: 16 }}>Entrar</button></Link>
        </div>
      </section>

      <section className="feature-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className="feature">
            <div className="ic">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="landing-foot">
        <div className="inner">
          <Logo small />
          <span>© 2026 · Feito para mestres e jogadores</span>
        </div>
      </footer>
    </div>
  );
}
