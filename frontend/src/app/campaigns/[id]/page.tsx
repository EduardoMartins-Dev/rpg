"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRequireUser } from "@/lib/guard";
import { AppShell } from "@/components/AppShell";
import { V5Roller } from "@/components/V5Roller";
import { CampaignBoard } from "@/components/CampaignBoard";
import { CampaignNotes } from "@/components/CampaignNotes";
import { SheetView } from "@/components/SheetView";
import AiChat from "@/components/AiChat";
import {
  api, type Campaign, type Character, type Member, type RpgSystem,
  type SchemaShape, type SheetSchema, type V5Catalog,
} from "@/lib/api";

type Tab = "overview" | "board" | "notes" | "members" | "sheets" | "ai";

function gradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, hsl(${h} 40% 22%), hsl(${(h + 40) % 360} 30% 12%))`;
}
const initials = (s: string) => (s || "?").slice(0, 2).toUpperCase();

// Temas: cor de destaque por campanha. Preset ou hex livre.
const THEMES: { label: string; color: string }[] = [
  { label: "Sangue (padrão)", color: "#C9A24B" },
  { label: "Carmesim", color: "#C0392B" },
  { label: "Ametista", color: "#9B59B6" },
  { label: "Esmeralda", color: "#27AE60" },
  { label: "Safira", color: "#4A7FE0" },
  { label: "Âmbar", color: "#E08A1E" },
  { label: "Aço", color: "#8895A7" },
];

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lighten(hex: string, amt: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const [r, g, b] = rgb.map((c) => Math.round(c + (255 - c) * amt));
  return `rgb(${r}, ${g}, ${b})`;
}
function rgba(hex: string, a: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
}
// Sobrescreve as vars de accent no escopo da campanha quando há tema definido.
function themeVars(hex?: string | null): React.CSSProperties {
  if (!hex || !hexToRgb(hex)) return {};
  return {
    ["--accent" as string]: hex,
    ["--accent-hover" as string]: lighten(hex, 0.16),
    ["--accent-tint" as string]: rgba(hex, 0.12),
  };
}

export default function CampaignDetailPage() {
  const { user } = useRequireUser();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [system, setSystem] = useState<RpgSystem | null>(null);
  const [catalog, setCatalog] = useState<V5Catalog | null>(null);
  const [schema, setSchema] = useState<SchemaShape | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charName, setCharName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  // personalização (mestre): nome, descrição, banner, tema
  const [editing, setEditing] = useState(false);
  const [cName, setCName] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cBanner, setCBanner] = useState("");
  const [cTheme, setCTheme] = useState("");

  // widget de rolagem (cliente)
  const [pool, setPool] = useState(3);
  const [roll, setRoll] = useState<number[] | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const c = await api.get<Campaign>(`/campaigns/${id}`);
      setCampaign(c);
      setMembers(await api.get<Member[]>(`/campaigns/${id}/members`));
      setCharacters(await api.get<Character[]>(`/campaigns/${id}/characters`));
      try {
        const sys = await api.get<RpgSystem>(`/systems/${c.systemId}`);
        setSystem(sys);
        if ((sys.ruleset ?? "v5") === "v5") {
          try { setCatalog(await api.get<V5Catalog>("/rules/v5/catalog")); } catch { setCatalog(null); }
        }
        try { setSchema((await api.get<SheetSchema>(`/systems/${c.systemId}/sheet-schema`)).schema); }
        catch { setSchema(null); }
      } catch { /* opcional */ }
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao carregar campanha");
    }
  }, [id]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const isMaster = campaign?.role === "MASTER";
  const charByPlayer = useMemo(() => {
    const m = new Map<string, string>();
    for (const ch of characters) m.set(ch.playerId, ch.name);
    return m;
  }, [characters]);

  function openEdit() {
    if (!campaign) return;
    setCName(campaign.name);
    setCDesc(campaign.description ?? "");
    setCBanner(campaign.bannerUrl ?? "");
    setCTheme(campaign.theme ?? "");
    setEditing(true);
  }

  async function saveCustomize(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const updated = await api.put<Campaign>(`/campaigns/${id}`, {
        name: cName.trim() || campaign?.name,
        description: cDesc.trim() || null,
        bannerUrl: cBanner.trim() || null,
        theme: cTheme.trim() || null,
      });
      setCampaign(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao salvar personalização");
    }
  }

  async function regenInvite() {
    const r = await api.post<{ inviteCode: string }>(`/campaigns/${id}/invite`);
    setCampaign((c) => (c ? { ...c, inviteCode: r.inviteCode } : c));
  }

  async function createCharacter(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post<Character>(`/campaigns/${id}/characters`, {
        name: charName,
        sheetData: { type: "VAMPIRO", attributes: {}, skills: {} },
      });
      setCharName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao criar ficha");
    }
  }


  function doRoll() {
    setRoll(Array.from({ length: pool }, () => 1 + Math.floor(Math.random() * 6)));
  }

  async function deleteCharacter(ch: Character) {
    if (!confirm(`Excluir a ficha "${ch.name}"? Ação permanente.`)) return;
    setError(null);
    try { await api.del(`/campaigns/${id}/characters/${ch.id}`); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "erro ao excluir ficha"); }
  }

  async function deleteCampaign() {
    if (!campaign) return;
    if (!confirm(`Excluir a campanha "${campaign.name}" e TODAS as fichas dela? Ação permanente.`)) return;
    setError(null);
    try { await api.del(`/campaigns/${id}`); router.push("/campaigns"); }
    catch (err) { setError(err instanceof Error ? err.message : "erro ao excluir campanha"); }
  }

  async function removeMember(m: Member) {
    if (!confirm(`Remover ${m.displayName} da campanha?`)) return;
    setError(null);
    try { await api.del(`/campaigns/${id}/members/${m.userId}`); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "erro ao remover membro"); }
  }

  if (!user) return <p className="muted" style={{ padding: 38 }}>Carregando…</p>;
  if (!campaign) {
    return (
      <AppShell user={user} active="campaigns">
        <div className="page"><p className="error" data-testid="campaign-error">{error ?? "Carregando…"}</p></div>
      </AppShell>
    );
  }

  const tabs: { k: Tab; label: string }[] = [
    { k: "overview", label: "Visão geral" },
    { k: "board", label: "Mural" },
    { k: "notes", label: "Anotações" },
    { k: "members", label: "Membros" },
    { k: "sheets", label: "Fichas" },
    { k: "ai", label: "Chat (IA)" },
  ];

  return (
    <AppShell user={user} active="campaigns">
      <div data-testid="campaign-detail" style={themeVars(campaign.theme)}>
        {/* hero */}
        <div className="cam-hero" style={campaign.bannerUrl
          ? { background: `linear-gradient(rgba(13,14,18,0.55), rgba(13,14,18,0.78)), url(${JSON.stringify(campaign.bannerUrl)}) center/cover no-repeat` }
          : { background: gradient(campaign.name) }}>
          <div className="inner">
            <span className="avatar lg" style={{ background: "rgba(13,14,18,0.5)" }}>{initials(campaign.name)}</span>
            <div style={{ flex: 1 }}>
              <Link href="/campaigns" style={{ fontSize: 13, color: "var(--muted)" }}>← Campanhas</Link>
              <h1>{campaign.name}</h1>
              <span className="sys">{system?.name ?? "—"} · {members.length} membros · <span className={`badge role-${campaign.role}`} data-testid="my-role">{campaign.role}</span></span>
            </div>
            {isMaster && (
              <div style={{ alignSelf: "center", display: "flex", gap: 8 }}>
                <button className="secondary" data-testid="campaign-customize" onClick={() => { setTab("overview"); openEdit(); }}>Personalizar</button>
                <button data-testid="invite-regen" onClick={regenInvite}>Gerar convite</button>
              </div>
            )}
          </div>
        </div>

        {/* tabs */}
        <div className="cam-tabs">
          {tabs.map((t) => (
            <button key={t.k} className={`tab${tab === t.k ? " on" : ""}`}
              data-testid={`cam-tab-${t.k}`} onClick={() => setTab(t.k)}>{t.label}</button>
          ))}
        </div>

        <div className="page">
          {/* OVERVIEW */}
          {tab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20 }} className="ov-grid">
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {isMaster && editing && (
                  <form className="panel" data-testid="customize-form" onSubmit={saveCustomize} style={{ margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                    <h3 style={{ fontSize: 18, margin: 0 }}>Personalizar campanha</h3>
                    <div>
                      <label>Nome</label>
                      <input data-testid="cz-name" value={cName} onChange={(e) => setCName(e.target.value)} />
                    </div>
                    <div>
                      <label>Descrição / tom da crônica</label>
                      <textarea data-testid="cz-desc" value={cDesc} rows={3} style={{ resize: "vertical" }}
                        onChange={(e) => setCDesc(e.target.value)} />
                    </div>
                    <div>
                      <label>Banner (URL de imagem)</label>
                      <input data-testid="cz-banner" value={cBanner} placeholder="https://…"
                        onChange={(e) => setCBanner(e.target.value)} />
                      {cBanner.trim() && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cBanner} alt="" style={{ marginTop: 8, width: "100%", maxHeight: 120, objectFit: "cover", borderRadius: 8 }} />
                      )}
                    </div>
                    <div>
                      <label>Tema (cor de destaque)</label>
                      <div className="chips" data-testid="cz-themes" style={{ marginTop: 6 }}>
                        {THEMES.map((t) => (
                          <button key={t.color} type="button" title={t.label}
                            onClick={() => setCTheme(t.color)}
                            style={{
                              width: 30, height: 30, borderRadius: "50%", padding: 0, background: t.color,
                              border: cTheme.toLowerCase() === t.color.toLowerCase() ? "3px solid var(--text)" : "2px solid var(--border)",
                              cursor: "pointer",
                            }} />
                        ))}
                        <input type="color" data-testid="cz-theme-custom" value={cTheme || "#C9A24B"}
                          onChange={(e) => setCTheme(e.target.value)}
                          style={{ width: 38, height: 30, padding: 0, background: "none", border: "1px solid var(--border)", borderRadius: 6 }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="submit" data-testid="cz-save">Salvar</button>
                      <button type="button" className="secondary" onClick={() => setEditing(false)}>Cancelar</button>
                    </div>
                  </form>
                )}
                <div className="panel" style={{ margin: 0 }}>
                  <h3 style={{ fontSize: 18 }}>Sobre a campanha</h3>
                  <p className="muted" style={{ lineHeight: 1.65, margin: 0 }}>
                    {campaign.description || "Sem descrição ainda. O mestre pode contar aqui o tom e o gancho da crônica."}
                  </p>
                </div>
                {isMaster && (
                  <div className="panel" data-testid="master-panel" style={{ margin: 0 }}>
                    <h3 style={{ fontSize: 18 }}>Convite</h3>
                    <p style={{ margin: 0 }}>
                      Código: <code data-testid="invite-code" style={{ color: "var(--accent)" }}>{campaign.inviteCode}</code>
                    </p>
                  </div>
                )}
                {isMaster && (
                  <div className="panel" style={{ margin: 0, borderColor: "var(--err)", background: "rgba(217,72,59,0.06)" }}>
                    <h3 style={{ fontSize: 16, margin: "0 0 6px", color: "var(--err)" }}>Zona de perigo</h3>
                    <p className="muted" style={{ fontSize: 13, margin: "0 0 12px" }}>Exclui a campanha e todas as fichas dela. Permanente.</p>
                    <button className="danger" data-testid="campaign-delete" onClick={deleteCampaign}>Excluir campanha</button>
                  </div>
                )}
              </div>

              {/* rolador: V5 quando ruleset=v5, senão d6 genérico */}
              {(system?.ruleset ?? "v5") === "v5" ? (
                <V5Roller bloodPotency={catalog?.bloodPotency} />
              ) : (
                <div className="dice-widget">
                  <h3 style={{ fontSize: 17, marginTop: 0 }}>Rolagem de dados</h3>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span className="muted" style={{ fontSize: 13 }}>Pool de dados</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <button className="secondary" onClick={() => setPool((p) => Math.max(1, p - 1))} style={{ padding: "4px 10px" }}>−</button>
                      <span className="mono" style={{ fontWeight: 600, minWidth: 18, textAlign: "center" }}>{pool}</span>
                      <button className="secondary" onClick={() => setPool((p) => Math.min(12, p + 1))} style={{ padding: "4px 10px" }}>+</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, minHeight: 44, marginBottom: 14 }}>
                    {Array.from({ length: pool }).map((_, i) => <span key={i} className="die">d6</span>)}
                  </div>
                  <button onClick={doRoll} style={{ width: "100%", marginBottom: 14 }}>Rolar dados</button>
                  {roll && (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {roll.map((x, i) => <span key={i} className="die res">{x}</span>)}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="kv-label">Soma</div>
                        <div className="mono" style={{ fontWeight: 600, fontSize: 22, color: "var(--accent)" }}>{roll.reduce((a, b) => a + b, 0)}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MURAL */}
          {tab === "board" && <CampaignBoard campaignId={id} isMaster={isMaster} />}

          {/* ANOTAÇÕES */}
          {tab === "notes" && <CampaignNotes campaignId={id} isMaster={isMaster} />}

          {/* MEMBERS */}
          {tab === "members" && (
            <div className="panel" style={{ padding: 0, margin: 0 }}>
              <div data-testid="member-list">
                {members.map((m) => (
                  <div key={m.userId} className="member-row" data-testid="member-row">
                    <span className="avatar">{initials(m.displayName)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{m.displayName}</div>
                      <div className="muted" style={{ fontSize: 13 }}>
                        {charByPlayer.get(m.userId)
                          ? <>interpreta <span style={{ color: "var(--text)" }}>{charByPlayer.get(m.userId)}</span></>
                          : m.email}
                      </div>
                    </div>
                    <span className={`badge role-${m.role}`}>{m.role === "MASTER" ? "Mestre" : "Jogador"}</span>
                    {isMaster && m.role !== "MASTER" && (
                      <button className="ghost" title="Remover da campanha" data-testid={`member-remove-${m.userId}`}
                        style={{ padding: "2px 8px", color: "var(--err)" }} onClick={() => removeMember(m)}>✕</button>
                    )}
                  </div>
                ))}
                {members.length === 0 && <p className="muted" style={{ padding: 18 }}>Sem membros.</p>}
              </div>
            </div>
          )}

          {/* SHEETS */}
          {tab === "sheets" && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <span className="muted" style={{ fontSize: 14 }}>
                  {isMaster ? "Você é Mestre — vê todas as fichas." : "Sua ficha nesta campanha."}
                </span>
                <form onSubmit={createCharacter} style={{ display: "flex", gap: 8 }}>
                  <input data-testid="char-name" value={charName} placeholder="nome do personagem"
                    onChange={(e) => setCharName(e.target.value)} style={{ width: 220 }} />
                  <button type="submit" data-testid="char-create">+ Nova ficha</button>
                </form>
              </div>

              {/* Mestre: lista de cards (clica para abrir). Jogador: ficha direto. */}
              {isMaster ? (
                <>
                  <div className="camp-grid" data-testid="character-list">
                    {characters.map((c) => (
                      <Link key={c.id} href={`/campaigns/${id}/characters/${c.id}`}
                        data-testid={`character-open-${c.id}`} style={{ color: "inherit" }}>
                        <div className="sheet-card" data-testid="character-row" style={{ position: "relative" }}>
                          <button className="ghost" title="Excluir ficha" data-testid={`character-delete-${c.id}`}
                            style={{ position: "absolute", top: 8, right: 8, padding: "2px 8px", color: "var(--err)" }}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteCharacter(c); }}>✕</button>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span className="avatar" style={{ borderRadius: 10 }}>{initials(c.name)}</span>
                            <div>
                              <div style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 16 }}>{c.name}</div>
                              <div className="muted" style={{ fontSize: 12 }}>Abrir ficha →</div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {characters.length === 0 && <p className="empty" style={{ marginTop: 12 }}>Nenhuma ficha ainda.</p>}
                </>
              ) : (
                <div data-testid="player-sheets" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {characters.map((c) => (
                    <div key={c.id} className="panel" data-testid={`character-row`} style={{ margin: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
                        <span className="avatar" style={{ borderRadius: 10 }}>{initials(c.name)}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 18 }}>{c.name}</div>
                          <div className="muted" style={{ fontSize: 12 }}>Sua ficha</div>
                        </div>
                        <Link href={`/campaigns/${id}/characters/${c.id}`} data-testid={`character-open-${c.id}`}>
                          <button>Editar ficha →</button>
                        </Link>
                        <button className="ghost" title="Excluir ficha" data-testid={`character-delete-${c.id}`}
                          style={{ padding: "2px 8px", color: "var(--err)" }}
                          onClick={() => deleteCharacter(c)}>✕</button>
                      </div>
                      {schema
                        ? <SheetView schema={schema} sheet={c.sheetData ?? {}} catalog={catalog} />
                        : <p className="muted">Carregando ficha…</p>}
                    </div>
                  ))}
                  {characters.length === 0 && (
                    <p className="empty" style={{ marginTop: 12 }}>Você ainda não tem ficha. Crie acima com <b>+ Nova ficha</b>.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* AI */}
          {tab === "ai" && <AiChat campaignId={id} systemName={system?.name} />}

          {error && <p className="error" data-testid="detail-error" style={{ marginTop: 16 }}>⚠ {error}</p>}
        </div>
      </div>
    </AppShell>
  );
}
