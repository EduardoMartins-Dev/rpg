"use client";

import { useEffect, useRef, useState } from "react";
import { useRequireUser } from "@/lib/guard";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { api, uploadFile, ApiError } from "@/lib/api";
import { compressImage } from "@/lib/image";

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
  const { refreshUser } = useAuth();
  const [section, setSection] = useState<Section>("account");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [accent, setAccent] = useState(ACCENTS[0].name);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setEmail(user.email);
      setAvatarUrl(user.avatarUrl ?? null);
    }
  }, [user]);

  function pickAccent(a: typeof ACCENTS[number]) {
    setAccent(a.name);
    document.documentElement.style.setProperty("--accent", a.base);
    document.documentElement.style.setProperty("--accent-hover", a.hover);
  }

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setSaved(false);
    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const saved = await uploadFile<{ id: string; url: string }>("/me/media", compressed);
      setAvatarUrl(saved.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao enviar a imagem");
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      await api.patch("/me", { displayName: displayName.trim(), email: email.trim(), avatarUrl });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "erro ao salvar o perfil");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return <p className="muted" style={{ padding: 38 }}>Carregando…</p>;

  const dirty = displayName.trim() !== user.displayName || email.trim() !== user.email || (avatarUrl ?? null) !== (user.avatarUrl ?? null);

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
                  <Avatar src={avatarUrl} name={displayName || user.email} className="lg" style={{ borderRadius: "50%" }} />
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto}
                      data-testid="avatar-file" style={{ display: "none" }} />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="secondary" disabled={uploading} data-testid="avatar-pick"
                        onClick={() => fileRef.current?.click()}>
                        {uploading ? <><span className="spinner" /> Enviando…</> : "Trocar foto"}
                      </button>
                      {avatarUrl && (
                        <button className="ghost" data-testid="avatar-remove" style={{ color: "var(--err)" }}
                          onClick={() => { setAvatarUrl(null); setSaved(false); }}>Remover</button>
                      )}
                    </div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>JPEG, PNG, WebP ou GIF. A imagem é comprimida no navegador.</div>
                  </div>
                </div>
                <label>Nome
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} data-testid="profile-name" style={{ marginTop: 7 }} />
                </label>
                <label>E-mail
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="profile-email" style={{ marginTop: 7 }} />
                </label>
                <button style={{ alignSelf: "flex-start" }} data-testid="profile-save"
                  disabled={saving || uploading || !dirty || !displayName.trim() || !email.trim()}
                  onClick={saveProfile}>
                  {saving ? <><span className="spinner" /> Salvando…</> : "Salvar alterações"}
                </button>
                {error && <p className="error" data-testid="profile-error">⚠ {error}</p>}
                {saved && <p className="ok-msg" data-testid="profile-saved">✓ Perfil atualizado.</p>}
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
