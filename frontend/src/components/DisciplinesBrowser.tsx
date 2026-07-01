"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api, ApiError, type V5Catalog, type PowerView, type PowerTextResponse } from "@/lib/api";

/**
 * Agregador de Disciplinas: lista TODAS as disciplinas do catálogo do sistema. Cada poder
 * mostra a descrição PT-BR do catálogo (sempre presente) e, ao expandir, busca a informação
 * COMPLETA do livro indexado — traduzida e organizada em PT-BR (funcionamento, custo, tipo de
 * ação, parada de dados, duração, sistema, amálgama). Se o poder não estiver no material
 * indexado, mantém a descrição do catálogo como referência (nunca fica vazio).
 */
export function DisciplinesBrowser({
  campaignId, catalog,
}: {
  campaignId: string; catalog?: V5Catalog | null;
}) {
  const disciplines = catalog?.disciplines ?? [];
  const [sel, setSel] = useState(0);
  const [openPower, setOpenPower] = useState<string | null>(null);
  const [cache, setCache] = useState<Record<string, { text?: string; missing?: boolean; error?: string; loading?: boolean }>>({});

  const current = disciplines[sel];
  const byLevel = useMemo(() => groupByLevel(current?.powers ?? []), [current]);

  if (disciplines.length === 0) {
    return <p className="muted" style={{ padding: 18 }}>Catálogo de disciplinas indisponível para este sistema.</p>;
  }

  async function togglePower(p: PowerView) {
    const key = p.en || p.name;
    if (openPower === key) { setOpenPower(null); return; }
    setOpenPower(key);
    if (cache[key]?.text || cache[key]?.missing || cache[key]?.error) return; // já buscado
    setCache((c) => ({ ...c, [key]: { loading: true } }));
    try {
      // O índice é em inglês: busca pelo nome EN quando houver, senão pelo PT.
      const res = await api.get<PowerTextResponse>(
        `/campaigns/${campaignId}/disciplines/${encodeURIComponent(p.en || p.name)}/explicacao`);
      setCache((c) => ({ ...c, [key]: res.text ? { text: res.text } : { missing: true } }));
    } catch (err) {
      // Nunca mostra o erro cru do provedor. Mensagem curta; a descrição do catálogo (acima)
      // segue visível como referência.
      const msg = err instanceof ApiError && err.status >= 500
        ? "Serviço de tradução indisponível no momento. Tente novamente mais tarde — a descrição acima é a referência."
        : "Não foi possível carregar agora. Tente novamente em instantes.";
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
                <div key={key} className="panel" style={{ margin: "0 0 6px", padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <span style={{ fontWeight: 600 }}>{p.name}
                      {p.en ? <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}> · {p.en}</span> : null}</span>
                  </div>
                  {/* descrição em PT-BR — sempre presente, vinda do catálogo do sistema */}
                  <p data-testid={`disc-power-desc-${key}`} style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.6 }}>
                    {p.desc || <span className="muted">Sem descrição resumida.</span>}
                  </p>
                  {/* informação COMPLETA do livro, traduzida em PT-BR (sob demanda) */}
                  <button data-testid={`disc-power-${key}`} onClick={() => togglePower(p)}
                    className="secondary" style={{ marginTop: 8, padding: "2px 10px", fontSize: 12 }}>
                    {open ? "Ocultar informação completa" : "Ver informação completa do livro"}
                  </button>
                  {open && (
                    <div data-testid={`disc-power-text-${key}`} className="md" style={{ padding: "10px 2px 2px", fontSize: 14, lineHeight: 1.6 }}>
                      {entry?.loading && <span className="muted">Traduzindo o material do livro…</span>}
                      {entry?.error && <span className="muted">{entry.error}</span>}
                      {entry?.missing && <span className="muted">Este poder não consta no material indexado; acima está a descrição de referência.</span>}
                      {entry?.text && <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.text}</ReactMarkdown>}
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
