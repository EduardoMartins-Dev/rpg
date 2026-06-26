"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRequireUser } from "@/lib/guard";
import { AppShell } from "@/components/AppShell";
import { api, type Campaign, type RpgSystem } from "@/lib/api";

// gradiente determinístico a partir do nome (capa do card)
function cover(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return `linear-gradient(135deg, hsl(${h} 40% 24%), hsl(${(h + 40) % 360} 30% 13%))`;
}

export default function CampaignsPage() {
  const { user } = useRequireUser();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [systems, setSystems] = useState<RpgSystem[]>([]);
  const [name, setName] = useState("");
  const [systemId, setSystemId] = useState("");
  const [invite, setInvite] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setCampaigns(await api.get<Campaign[]>("/campaigns"));
    const sys = await api.get<RpgSystem[]>("/systems");
    setSystems(sys);
    if (sys.length && !systemId) setSystemId(sys[0].id);
  }, [systemId]);

  useEffect(() => { if (user) load(); }, [user, load]);

  const systemName = useCallback(
    (id: string) => systems.find((s) => s.id === id)?.name ?? "—",
    [systems],
  );

  const mastered = useMemo(() => campaigns.filter((c) => c.role === "MASTER"), [campaigns]);
  const playing = useMemo(() => campaigns.filter((c) => c.role === "PLAYER"), [campaigns]);

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post<Campaign>("/campaigns", { name, systemId, description: "" });
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro");
    }
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post<Campaign>("/campaigns/join", { inviteCode: invite.trim() });
      setInvite("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "convite inválido");
    }
  }

  function Card({ c }: { c: Campaign }) {
    return (
      <Link href={`/campaigns/${c.id}`} data-testid={`campaign-open-${c.id}`} style={{ color: "inherit" }}>
        <div className="camp-card" data-testid="campaign-row">
          <div className="camp-cover" style={{ background: cover(c.name) }}>
            <span className={`badge role-${c.role} role`} data-testid="campaign-role">
              {c.role === "MASTER" ? "Mestre" : "Jogador"}
            </span>
            <span className="init">{c.name.slice(0, 1).toUpperCase()}</span>
          </div>
          <div className="camp-body">
            <h3 data-testid="campaign-name">{c.name}</h3>
            <div className="camp-meta">
              <span className="sys" data-testid="campaign-system-name">{systemName(c.systemId)}</span>
              <span>Abrir →</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (!user) return <p className="muted" style={{ padding: 38 }}>Carregando…</p>;

  return (
    <AppShell user={user} active="campaigns">
      <div className="page page-wide" data-testid="campaigns-page">
        <div className="page-head">
          <div>
            <h1>Suas campanhas</h1>
            <p className="sub">{campaigns.length} mesa(s) · você mestra {mastered.length}</p>
          </div>
        </div>

        <div className="row" style={{ alignItems: "stretch" }}>
          <div className="panel" style={{ margin: 0 }}>
            <h2 style={{ fontSize: 18 }}>Criar campanha</h2>
            <form onSubmit={createCampaign}>
              <label htmlFor="camp-name">Nome</label>
              <input id="camp-name" data-testid="campaign-name" value={name}
                onChange={(e) => setName(e.target.value)} />
              <label htmlFor="camp-system" style={{ marginTop: 12 }}>Sistema</label>
              <select id="camp-system" data-testid="campaign-system" value={systemId}
                onChange={(e) => setSystemId(e.target.value)}>
                {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div style={{ marginTop: 14 }}>
                <button type="submit" data-testid="campaign-create" disabled={!systemId}>Criar (sou Mestre)</button>
              </div>
              {systems.length === 0 && (
                <p className="muted" style={{ fontSize: ".85rem", marginTop: 8 }}>
                  Nenhum sistema cadastrado{user.isAdmin ? " — crie um em Admin." : "."}
                </p>
              )}
            </form>
          </div>

          <div className="panel" style={{ margin: 0 }}>
            <h2 style={{ fontSize: 18 }}>Entrar por convite</h2>
            <form onSubmit={join}>
              <label htmlFor="join-code">Código de convite</label>
              <input id="join-code" data-testid="join-code" value={invite}
                placeholder="ex.: AB23CD45" onChange={(e) => setInvite(e.target.value)} />
              <div style={{ marginTop: 14 }}>
                <button type="submit" className="secondary" data-testid="join-submit">Entrar como Jogador</button>
              </div>
            </form>
          </div>
        </div>

        {error && <p className="error" data-testid="campaigns-error" style={{ marginTop: 12 }}>⚠ {error}</p>}

        <div className="section-title"><h2>Onde sou Mestre</h2><span className="count">{mastered.length}</span></div>
        {mastered.length > 0 ? (
          <div className="camp-grid" data-testid="mastered-list">{mastered.map((c) => <Card key={c.id} c={c} />)}</div>
        ) : (
          <p className="empty" data-testid="mastered-empty">Você ainda não mestra nenhuma campanha. Crie uma acima.</p>
        )}

        <div className="section-title"><h2>Onde sou Jogador</h2><span className="count">{playing.length}</span></div>
        {playing.length > 0 ? (
          <div className="camp-grid" data-testid="playing-list">{playing.map((c) => <Card key={c.id} c={c} />)}</div>
        ) : (
          <p className="empty" data-testid="playing-empty">Você ainda não joga em nenhuma campanha. Entre por um convite acima.</p>
        )}

        <div className="section-title"><h2>Sistemas disponíveis</h2><span className="count">{systems.length}</span></div>
        <div className="panel">
          {systems.length > 0 ? (
            <div className="chips" data-testid="systems-list">
              {systems.map((s) => <span key={s.id} className="badge" data-testid="system-chip">{s.name}</span>)}
            </div>
          ) : <p className="muted">Nenhum sistema cadastrado.</p>}
          {user.isAdmin && (
            <p style={{ marginTop: 12 }}><Link href="/admin" data-testid="go-admin">Gerenciar sistemas e templates →</Link></p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
