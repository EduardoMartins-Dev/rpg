"use client";

import { useMemo, useState } from "react";
import { api, ApiError, type V5Catalog, type PowerView, type PowerTextResponse } from "@/lib/api";

/**
 * Agregador de Disciplinas: lista TODAS as disciplinas do catálogo do sistema (nomes e
 * poderes por nível) e, ao clicar num poder, busca o efeito integral no material indexado
 * da campanha (RAG, retrieval-only — não inventa nem hardcoda texto do livro). Resolve o
 * pedido "ter um aglomerado das disciplinas e já ver tudo que cada uma faz".
 */
export function DisciplinesBrowser({
  campaignId, catalog,
}: {
  campaignId: string; catalog?: V5Catalog | null;
}) {
  const disciplines = catalog?.disciplines ?? [];
  const [sel, setSel] = useState(0);
  const [openPower, setOpenPower] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, { text?: string; error?: string; loading?: boolean }>>({});

  const current = disciplines[sel];
  const byLevel = useMemo(() => groupByLevel(current?.powers ?? []), [current]);

  if (disciplines.length === 0) {
    return <p className="muted" style={{ padding: 18 }}>Catálogo de disciplinas indisponível para este sistema.</p>;
  }

  async function togglePower(p: PowerView) {
    const key = p.en || p.name;
    if (openPower === key) { setOpenPower(null); return; }
    setOpenPower(key);
    if (cache[key]?.text || cache[key]?.error) return; // já buscado
    setCache((c) => ({ ...c, [key]: { loading: true } }));
    try {
      // O índice é em inglês: busca pelo nome EN quando houver, senão pelo PT.
      const res = await api.get<PowerTextResponse>(
        `/campaigns/${campaignId}/disciplines/${encodeURIComponent(p.en || p.name)}`);
      setCache((c) => ({ ...c, [key]: { text: res.text } }));
    } catch (err) {
      const msg = err instanceof ApiError && err.status === 404
        ? "Este poder não está no material indexado deste sistema."
        : err instanceof Error ? err.message : "erro ao buscar o poder";
      setCache((c) => ({ ...c, [key]: { error: msg } }));
    }
  }

  return (
    <div data-testid="disciplines-browser" style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 18 }} className="disc-grid">
      {/* lista de disciplinas */}
      <div className="panel" style={{ margin: 0, padding: 8, alignSelf: "start" }} data-testid="disc-list">
        {disciplines.map((d, i) => (
          <button key={d.name} data-testid={`disc-pick-${i}`} onClick={() => { setSel(i); setOpenPower(null); }}
            className={i === sel ? "" : "secondary"}
            style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 4, padding: "8px 10px" }}>
            {d.name} <span className="muted" style={{ fontSize: 12 }}>· {d.powers.length}</span>
          </button>
        ))}
      </div>

      {/* detalhe da disciplina selecionada */}
      <div style={{ minWidth: 0 }}>
        <h3 style={{ marginTop: 0, fontFamily: "var(--serif)" }}>{current.name}</h3>
        <p className="muted" style={{ marginTop: 0 }}>{current.summary}</p>
        {byLevel.map(([lvl, powers]) => (
          <div key={lvl} style={{ marginBottom: 12 }}>
            <div className="kv-label" style={{ marginBottom: 6 }}>Nível {lvl}</div>
            {powers.map((p) => {
              const key = p.en || p.name;
              const open = openPower === key;
              const entry = cache[key];
              return (
                <div key={key} className="panel" style={{ margin: "0 0 6px", padding: "8px 12px" }}>
                  <button data-testid={`disc-power-${key}`} onClick={() => togglePower(p)}
                    className="secondary" style={{
                      width: "100%", textAlign: "left", padding: "4px 8px",
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                    }}>
                    <span>{p.name}{p.en ? <span className="muted" style={{ fontSize: 12 }}> · {p.en}</span> : null}</span>
                    <span className="muted" style={{ fontSize: 12 }}>{open ? "▲" : "▼"}</span>
                  </button>
                  {open && (
                    <div data-testid={`disc-power-text-${key}`} style={{ padding: "10px 8px 2px", fontSize: 14 }}>
                      {entry?.loading && <span className="muted">Buscando no material…</span>}
                      {entry?.error && <span className="muted">{entry.error}</span>}
                      {entry?.text && <p style={{ whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }}>{entry.text}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function groupByLevel(powers: PowerView[]): [number, PowerView[]][] {
  const m = new Map<number, PowerView[]>();
  for (const p of powers) {
    const lvl = Number(p.level) || 0;
    (m.get(lvl) ?? m.set(lvl, []).get(lvl)!).push(p);
  }
  return [...m.entries()].sort((a, b) => a[0] - b[0]);
}
