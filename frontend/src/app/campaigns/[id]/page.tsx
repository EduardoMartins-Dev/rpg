"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRequireUser } from "@/lib/guard";
import { AppShell } from "@/components/AppShell";
import {
  api, type AskResponse, type Campaign, type Character, type Member, type RpgSystem,
} from "@/lib/api";

type Tab = "overview" | "members" | "sheets" | "ai";

function gradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, hsl(${h} 40% 22%), hsl(${(h + 40) % 360} 30% 12%))`;
}
const initials = (s: string) => (s || "?").slice(0, 2).toUpperCase();

export default function CampaignDetailPage() {
  const { user } = useRequireUser();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [system, setSystem] = useState<RpgSystem | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [charName, setCharName] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

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
      try { setSystem(await api.get<RpgSystem>(`/systems/${c.systemId}`)); } catch { /* opcional */ }
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

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    setAsking(true);
    setAnswer(null);
    try {
      setAnswer(await api.post<AskResponse>(`/campaigns/${id}/ai/ask`, { question }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro na IA");
    } finally {
      setAsking(false);
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
    { k: "members", label: "Membros" },
    { k: "sheets", label: "Fichas" },
    { k: "ai", label: "Chat (IA)" },
  ];

  return (
    <AppShell user={user} active="campaigns">
      <div data-testid="campaign-detail">
        {/* hero */}
        <div className="cam-hero" style={{ background: gradient(campaign.name) }}>
          <div className="inner">
            <span className="avatar lg" style={{ background: "rgba(13,14,18,0.5)" }}>{initials(campaign.name)}</span>
            <div style={{ flex: 1 }}>
              <Link href="/campaigns" style={{ fontSize: 13, color: "var(--muted)" }}>← Campanhas</Link>
              <h1>{campaign.name}</h1>
              <span className="sys">{system?.name ?? "—"} · {members.length} membros · <span className={`badge role-${campaign.role}`} data-testid="my-role">{campaign.role}</span></span>
            </div>
            {isMaster && (
              <button data-testid="invite-regen" onClick={regenInvite} style={{ alignSelf: "center" }}>Gerar convite</button>
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

              {/* dice widget */}
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
            </div>
          )}

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
                  {isMaster ? "Você é Mestre — vê todas as fichas." : "Você vê apenas as suas fichas."}
                </span>
                <form onSubmit={createCharacter} style={{ display: "flex", gap: 8 }}>
                  <input data-testid="char-name" value={charName} placeholder="nome do personagem"
                    onChange={(e) => setCharName(e.target.value)} style={{ width: 220 }} />
                  <button type="submit" data-testid="char-create">+ Nova ficha</button>
                </form>
              </div>
              <div className="camp-grid" data-testid="character-list">
                {characters.map((c) => (
                  <Link key={c.id} href={`/campaigns/${id}/characters/${c.id}`}
                    data-testid={`character-open-${c.id}`} style={{ color: "inherit" }}>
                    <div className="sheet-card" data-testid="character-row" style={{ position: "relative" }}>
                      {(isMaster || c.playerId === user.id) && (
                        <button className="ghost" title="Excluir ficha" data-testid={`character-delete-${c.id}`}
                          style={{ position: "absolute", top: 8, right: 8, padding: "2px 8px", color: "var(--err)" }}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteCharacter(c); }}>✕</button>
                      )}
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
            </div>
          )}

          {/* AI */}
          {tab === "ai" && (
            <div className="ai-chat" style={{ maxWidth: 760, margin: "0 auto" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 30, height: 30, borderRadius: 8, background: "var(--accent-tint)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>✦</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>Mestre de Regras</div>
                  <div className="muted" style={{ fontSize: 12 }}>baseado em {system?.name ?? "este sistema"}</div>
                </div>
              </div>
              <div style={{ padding: 20, minHeight: 160 }}>
                {answer ? (
                  <div data-testid="ai-answer">
                    <p style={{ marginTop: 0 }}>{answer.answer}</p>
                    <p className="mono" style={{ fontSize: 12, color: "var(--accent)", borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                      {answer.grounded ? `${answer.sources.length} trecho(s) do sistema` : "sem material indexado"}
                    </p>
                  </div>
                ) : <p className="muted" style={{ marginTop: 0 }}>Pergunte sobre as regras do sistema desta campanha.</p>}
              </div>
              <form onSubmit={ask} style={{ padding: "14px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: 10 }}>
                <input data-testid="ai-question" value={question} placeholder="Pergunte sobre as regras do sistema…"
                  onChange={(e) => setQuestion(e.target.value)} style={{ flex: 1 }} />
                <button type="submit" data-testid="ai-ask" disabled={asking || !question}>{asking ? "…" : "Enviar"}</button>
              </form>
            </div>
          )}

          {error && <p className="error" data-testid="detail-error" style={{ marginTop: 16 }}>⚠ {error}</p>}
        </div>
      </div>
    </AppShell>
  );
}
