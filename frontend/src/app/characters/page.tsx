"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRequireUser } from "@/lib/guard";
import { AppShell } from "@/components/AppShell";
import { api, type Campaign, type Character, type MyCharacter, type RpgSystem } from "@/lib/api";

const initials = (s: string) => (s || "?").slice(0, 2).toUpperCase();

export default function CharactersPage() {
  const { user } = useRequireUser();
  const router = useRouter();
  const [chars, setChars] = useState<MyCharacter[]>([]);
  const [systems, setSystems] = useState<RpgSystem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newSystem, setNewSystem] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [cs, sys, camps] = await Promise.all([
        api.get<MyCharacter[]>("/me/characters"),
        api.get<RpgSystem[]>("/systems"),
        api.get<Campaign[]>("/campaigns"),
      ]);
      setChars(cs);
      setSystems(sys);
      setCampaigns(camps);
      if (!newSystem && sys.length > 0) setNewSystem(sys[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao carregar personagens");
    }
  }, [newSystem]);

  useEffect(() => { if (user) load(); }, [user, load]);

  async function createChar(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim() || !newSystem) return;
    setError(null); setCreating(true);
    try {
      const c = await api.post<Character>("/me/characters", { name: newName.trim(), systemId: newSystem });
      router.push(`/characters/${c.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao criar ficha");
      setCreating(false);
    }
  }

  async function deleteChar(c: MyCharacter) {
    setMenuFor(null);
    if (!confirm(`Excluir a ficha "${c.name}"? Ação permanente.`)) return;
    setError(null);
    try {
      if (c.campaignId) await api.del(`/campaigns/${c.campaignId}/characters/${c.id}`);
      else await api.del(`/me/characters/${c.id}`);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "erro ao excluir ficha"); }
  }

  async function addToCampaign(c: MyCharacter, campaignId: string) {
    setMenuFor(null); setError(null);
    try {
      const copy = await api.post<Character>(`/campaigns/${campaignId}/characters/attach`, { characterId: c.id });
      router.push(`/campaigns/${campaignId}/characters/${copy.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : "erro ao adicionar à campanha"); }
  }

  // agrupa por sistema; dentro de cada grupo, avulsas primeiro
  const groups = useMemo(() => {
    const m = new Map<string, MyCharacter[]>();
    for (const c of chars) {
      const k = c.systemName || "Sem sistema";
      (m.get(k) ?? m.set(k, []).get(k)!).push(c);
    }
    for (const list of m.values()) list.sort((a, b) => Number(!!a.campaignId) - Number(!!b.campaignId));
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [chars]);

  // campanhas onde a pessoa participa e cujo sistema bate com a ficha avulsa
  const campaignsFor = useCallback(
    (c: MyCharacter) => campaigns.filter((cp) => cp.role !== null && (!c.systemId || cp.systemId === c.systemId)),
    [campaigns],
  );

  if (!user) return <p className="muted" style={{ padding: 38 }}>Carregando…</p>;

  return (
    <AppShell user={user} active="characters">
      <div className="page page-wide" data-testid="characters-page">
        <div className="page-head">
          <div>
            <h1>Meus personagens</h1>
            <p className="sub">{chars.length} ficha(s) · em {groups.length} sistema(s)</p>
          </div>
        </div>

        {/* Criar ficha avulsa (fora de qualquer campanha) */}
        <form className="panel" onSubmit={createChar} data-testid="new-char-form"
          style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 220px" }}>
            <label htmlFor="nc-name">Nova ficha</label>
            <input id="nc-name" data-testid="nc-name" value={newName} placeholder="nome do personagem"
              onChange={(e) => setNewName(e.target.value)} />
          </div>
          <div style={{ flex: "0 1 220px" }}>
            <label htmlFor="nc-system">Sistema</label>
            <select id="nc-system" data-testid="nc-system" value={newSystem}
              onChange={(e) => setNewSystem(e.target.value)}>
              {systems.length === 0 && <option value="">— sem sistemas —</option>}
              {systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <button type="submit" data-testid="nc-create" disabled={creating || !newName.trim() || !newSystem}>
            {creating ? "Criando…" : "+ Criar ficha"}
          </button>
        </form>
        <p className="muted" style={{ fontSize: 13, margin: "8px 2px 20px" }}>
          Fichas criadas aqui são suas, avulsas — monte com calma e depois use <b>Adicionar à campanha</b> para levá-las a uma mesa.
        </p>

        {menuFor && <div className="menu-backdrop" onClick={() => setMenuFor(null)} />}

        {error && <p className="error" style={{ marginBottom: 12 }}>⚠ {error}</p>}

        {chars.length === 0 && !error && (
          <p className="empty" data-testid="characters-empty">Você ainda não tem personagens. Crie a primeira ficha acima.</p>
        )}

        {groups.map(([systemName, list]) => (
          <section key={systemName} data-testid="character-system-group">
            <div className="section-title">
              <h2>{systemName}</h2>
              <span className="count">{list.length}</span>
            </div>
            <div className="camp-grid">
              {list.map((c) => {
                const href = c.campaignId ? `/campaigns/${c.campaignId}/characters/${c.id}` : `/characters/${c.id}`;
                const targets = c.campaignId ? [] : campaignsFor(c);
                return (
                  <Link key={c.id} href={href} data-testid={`my-character-${c.id}`} style={{ color: "inherit" }}>
                    <div className="sheet-card" data-testid="my-character-row" style={{ position: "relative" }}>
                      <button className="ghost" aria-label="Opções" data-testid={`my-character-menu-${c.id}`}
                        style={{ position: "absolute", top: 8, right: 8, padding: "2px 8px", fontSize: 18, lineHeight: 1 }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuFor(menuFor === c.id ? null : c.id); }}>⋯</button>
                      {menuFor === c.id && (
                        <div className="card-menu" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          {!c.campaignId && (
                            <>
                              <div className="card-menu-label">Adicionar à campanha</div>
                              {targets.length === 0
                                ? <div className="muted" style={{ fontSize: 12, padding: "4px 8px" }}>nenhuma mesa compatível</div>
                                : targets.map((cp) => (
                                  <button key={cp.id} className="ghost" data-testid={`my-character-attach-${c.id}-${cp.id}`}
                                    style={{ width: "100%", justifyContent: "flex-start" }}
                                    onClick={() => addToCampaign(c, cp.id)}>↪ {cp.name}</button>
                                ))}
                              <div className="card-menu-sep" />
                            </>
                          )}
                          <button className="ghost" data-testid={`my-character-delete-${c.id}`}
                            style={{ color: "var(--err)", width: "100%", justifyContent: "flex-start" }}
                            onClick={() => deleteChar(c)}>✕ Excluir</button>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span className="avatar" style={{ borderRadius: 10 }}>{initials(c.name)}</span>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 16 }}>{c.name}</div>
                          <div className="muted" style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {c.campaignId
                              ? <>{c.campaignName} · abrir →</>
                              : <><span className="badge" style={{ padding: "0 6px", fontSize: 11 }}>avulsa</span> · editar →</>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
