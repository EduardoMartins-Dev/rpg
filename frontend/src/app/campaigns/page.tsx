"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRequireUser } from "@/lib/guard";
import { api, type Campaign, type RpgSystem } from "@/lib/api";

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

  if (!user) return <p className="muted">Carregando…</p>;

  return (
    <div data-testid="campaigns-page">
      <h1>Minhas campanhas</h1>

      <div className="panel">
        <h2>Criar campanha</h2>
        <form onSubmit={createCampaign} className="row">
          <div>
            <label htmlFor="camp-name">Nome</label>
            <input id="camp-name" data-testid="campaign-name" value={name}
              onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="camp-system">Sistema</label>
            <select id="camp-system" data-testid="campaign-system" value={systemId}
              onChange={(e) => setSystemId(e.target.value)}>
              {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button type="submit" data-testid="campaign-create" disabled={!systemId}
            style={{ flex: "0 0 auto" }}>Criar (sou Mestre)</button>
        </form>
      </div>

      <div className="panel">
        <h2>Entrar por convite</h2>
        <form onSubmit={join} className="row">
          <input data-testid="join-code" value={invite} placeholder="código de convite"
            onChange={(e) => setInvite(e.target.value)} />
          <button type="submit" data-testid="join-submit" style={{ flex: "0 0 auto" }}>Entrar</button>
        </form>
      </div>

      {error && <p className="error" data-testid="campaigns-error">{error}</p>}

      <div className="panel">
        <h2>Campanhas</h2>
        <table>
          <thead><tr><th>Nome</th><th>Papel</th><th></th></tr></thead>
          <tbody data-testid="campaign-list">
            {campaigns.map((c) => (
              <tr key={c.id} data-testid="campaign-row">
                <td>{c.name}</td>
                <td><span className="badge" data-testid="campaign-role">{c.role}</span></td>
                <td style={{ textAlign: "right" }}>
                  <Link href={`/campaigns/${c.id}`} data-testid={`campaign-open-${c.id}`}>Abrir</Link>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 &&
              <tr><td colSpan={3} className="muted">Você ainda não participa de nenhuma campanha.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
