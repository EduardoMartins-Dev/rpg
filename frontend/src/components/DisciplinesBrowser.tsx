"use client";

import { useMemo, useState } from "react";
import { type V5Catalog, type PowerView } from "@/lib/api";

/**
 * Agregador de Disciplinas: lista TODAS as disciplinas do catálogo do sistema (nomes e
 * poderes por nível) e, para cada poder, mostra em PT-BR o que ele faz — funcionamento,
 * tipo de ação e custo — escrito manualmente no catálogo. Sempre presente e consistente,
 * sem depender de retrieval (RAG) ao vivo.
 */
export function DisciplinesBrowser({
  catalog,
}: {
  campaignId: string; catalog?: V5Catalog | null;
}) {
  const disciplines = catalog?.disciplines ?? [];
  const [sel, setSel] = useState(0);

  const current = disciplines[sel];
  const byLevel = useMemo(() => groupByLevel(current?.powers ?? []), [current]);

  if (disciplines.length === 0) {
    return <p className="muted" style={{ padding: 18 }}>Catálogo de disciplinas indisponível para este sistema.</p>;
  }

  return (
    <div data-testid="disciplines-browser" style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 18 }} className="disc-grid">
      {/* lista de disciplinas */}
      <div className="panel" style={{ margin: 0, padding: 8, alignSelf: "start" }} data-testid="disc-list">
        {disciplines.map((d, i) => (
          <button key={d.name} data-testid={`disc-pick-${i}`} onClick={() => setSel(i)}
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
              return (
                <div key={key} className="panel" style={{ margin: "0 0 6px", padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{p.name}
                      {p.en ? <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}> · {p.en}</span> : null}</span>
                  </div>
                  {/* descrição em PT-BR — funcionamento, tipo de ação e custo, do catálogo do sistema */}
                  <p data-testid={`disc-power-desc-${key}`} style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.6 }}>
                    {p.desc || <span className="muted">Sem descrição resumida.</span>}
                  </p>
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
