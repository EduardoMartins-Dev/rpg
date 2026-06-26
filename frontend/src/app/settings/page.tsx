"use client";

import { useEffect, useState } from "react";
import { useRequireUser } from "@/lib/guard";
import { AppShell } from "@/components/AppShell";

type Section = "account" | "prefs" | "danger";

const ACCENTS = [
  { name: "Âmbar arcano", base: "#C9A24B", hover: "#DBB45E" },
  { name: "Sangue", base: "#B5443A", hover: "#C85B50" },
  { name: "Esmeralda", base: "#3FA873", hover: "#52BD88" },
  { name: "Violeta", base: "#7C6BE0", hover: "#8E7DF0" },
  { name: "Aço", base: "#5B8DEF", hover: "#73A0F5" },
];

export default function SettingsPage() {
  const { user } = useRequireUser();
  const [section, setSection] = useState<Section>("account");
  const [displayName, setDisplayName] = useState("");
  const [accent, setAccent] = useState(ACCENTS[0].name);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (user) setDisplayName(user.displayName); }, [user]);

  function pickAccent(a: typeof ACCENTS[number]) {
    setAccent(a.name);
    document.documentElement.style.setProperty("--accent", a.base);
    document.documentElement.style.setProperty("--accent-hover", a.hover);
  }

  if (!user) return <p className="muted" style={{ padding: 38 }}>Carregando…</p>;

  const nav: { k: Section; label: string }[] = [
    { k: "account", label: "Perfil" },
    { k: "prefs", label: "Aparência" },
    { k: "danger", label: "Conta" },
  ];

  return (
    <AppShell user={user} active="settings">
      <div className="page page-narrow" data-testid="settings-page">
        <h1 style={{ marginTop: 0 }}>Configurações</h1>

        <div className="settings-grid">
          <nav className="set-nav">
            {nav.map((n) => (
              <a key={n.k} className={section === n.k ? "on" : ""} onClick={() => setSection(n.k)}>{n.label}</a>
            ))}
          </nav>

          <div>
            {section === "account" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <h3 style={{ margin: 0 }}>Perfil</h3>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <span className="avatar lg" style={{ borderRadius: "50%" }}>
                    {(displayName || user.email).slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <button className="secondary" disabled title="Em breve (Supabase Storage)">Trocar foto</button>
                    <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>Upload de avatar chega com o armazenamento de imagens.</div>
                  </div>
                </div>
                <label>Nome
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ marginTop: 7 }} />
                </label>
                <label>E-mail
                  <input value={user.email} disabled style={{ marginTop: 7 }} />
                </label>
                <button style={{ alignSelf: "flex-start" }} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
                  Salvar alterações
                </button>
                {saved && <p className="ok-msg">✓ Preferências aplicadas localmente (persistência chega com o backend de perfil).</p>}
              </div>
            )}

            {section === "prefs" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <div>
                  <h3 style={{ margin: "0 0 4px" }}>Cor de acento</h3>
                  <p className="muted" style={{ margin: "0 0 16px", fontSize: 14 }}>Muda a identidade visual do portal (pré-visualização local).</p>
                  <div className="accent-grid">
                    {ACCENTS.map((a) => (
                      <div key={a.name} className={`accent-chip${accent === a.name ? " on" : ""}`} onClick={() => pickAccent(a)}>
                        <span className="sw" style={{ background: a.base }} />
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{a.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {section === "danger" && (
              <div className="panel" style={{ borderColor: "var(--err)", background: "rgba(217,72,59,0.06)", margin: 0 }}>
                <h3 style={{ margin: "0 0 6px", color: "var(--err)" }}>Excluir conta</h3>
                <p className="muted" style={{ margin: "0 0 16px", fontSize: 14 }}>Ação permanente — todas as campanhas e fichas seriam removidas.</p>
                <button className="danger" disabled title="Em breve">Excluir minha conta</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
