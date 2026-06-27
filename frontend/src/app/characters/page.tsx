"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRequireUser } from "@/lib/guard";
import { AppShell } from "@/components/AppShell";
import { api, type MyCharacter } from "@/lib/api";

const initials = (s: string) => (s || "?").slice(0, 2).toUpperCase();

export default function CharactersPage() {
  const { user } = useRequireUser();
  const [chars, setChars] = useState<MyCharacter[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try { setChars(await api.get<MyCharacter[]>("/me/characters")); }
    catch (err) { setError(err instanceof Error ? err.message : "erro ao carregar personagens"); }
  }, []);

  useEffect(() => { if (user) load(); }, [user, load]);

  // agrupa por sistema
  const groups = useMemo(() => {
    const m = new Map<string, MyCharacter[]>();
    for (const c of chars) {
      const k = c.systemName || "Sem sistema";
      (m.get(k) ?? m.set(k, []).get(k)!).push(c);
    }
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [chars]);

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

        {error && <p className="error" style={{ marginBottom: 12 }}>⚠ {error}</p>}

        {chars.length === 0 && !error && (
          <p className="empty">Você ainda não tem personagens. Crie um abrindo uma campanha → aba Fichas.</p>
        )}

        {groups.map(([systemName, list]) => (
          <section key={systemName} data-testid="character-system-group">
            <div className="section-title">
              <h2>{systemName}</h2>
              <span className="count">{list.length}</span>
            </div>
            <div className="camp-grid">
              {list.map((c) => (
                <Link key={c.id} href={`/campaigns/${c.campaignId}/characters/${c.id}`}
                  data-testid={`my-character-${c.id}`} style={{ color: "inherit" }}>
                  <div className="sheet-card" data-testid="my-character-row">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span className="avatar" style={{ borderRadius: 10 }}>{initials(c.name)}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 16 }}>{c.name}</div>
                        <div className="muted" style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.campaignName} · abrir ficha →
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
