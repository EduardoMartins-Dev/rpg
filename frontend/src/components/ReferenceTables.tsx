"use client";

import type { V5Catalog } from "@/lib/api";

/**
 * Tabelas de referência V5 para consulta na mesa: Humanidade (o que cada nível afeta) e
 * Potência de Sangue (efeitos por nível). A de Potência usa os dados do catálogo do sistema
 * (fonte única, vinda do backend); a de Humanidade é um resumo paráfrase do corebook
 * (p.234–239) — não reproduz o texto, só o efeito mecânico de cada nível.
 */

type HumanityRow = { level: number; effect: string };

// Resumo do corebook (paráfrase): efeito mecânico-chave por nível de Humanidade.
const HUMANITY: HumanityRow[] = [
  { level: 10, effect: "Quase humano: Rubor da Vida dispensável (parece humano são), cura superficial como mortal, come/dorme de dia, dano de sol pela metade. Qualquer ato egoísta ameaça." },
  { level: 9, effect: "Rubor dispensável (parece doente), cura superficial como mortal, ingere carne crua/líquidos, acorda ~1h antes do pôr do sol." },
  { level: 8, effect: "Rubor rola 2 dados (pega o maior); com Rubor: sexo e vinho; acorda ~1h antes do pôr do sol." },
  { level: 7, effect: "Padrão Kindred. Rouse Check para o Rubor; sexo só fingido (Destreza+Carisma); comida sem Rubor faz vomitar." },
  { level: 6, effect: "Máscara mais difícil: −1 para fingir intimidade; mesmo com Rubor, teste para segurar comida." },
  { level: 5, effect: "−1 dado em interações sociais com humanos (Empatia/Persuasão etc.; não em Intimidação, Sedução ou caça/matar)." },
  { level: 4, effect: "−2 dados em interação humana; não segura comida nem com Rubor; palidez vira aspecto cadavérico." },
  { level: 3, effect: "−4 dados em interação humana; não consegue mais sexo, nem fingido; estranheza física menor (olhos, etc.)." },
  { level: 2, effect: "−6 dados em interação humana (−4 com Rubor). Humanos e a maioria dos Kindred recuam da sua presença." },
  { level: 1, effect: "−8 dados em interação humana (−5 com Rubor). Mal senciente, à beira da dissolução." },
  { level: 0, effect: "Tornou-se a Besta — um wight sob controle do Narrador, perdido para sempre." },
];

export function HumanityTable({ current }: { current?: number }) {
  return (
    <div className="panel" style={{ margin: 0 }} data-testid="humanity-table">
      <span className="kv-label">Tabela de Humanidade — o que cada nível afeta</span>
      <div style={{ marginTop: 8, fontSize: 13 }}>
        {HUMANITY.map((r) => {
          const on = current === r.level;
          return (
            <div key={r.level} style={{
              display: "grid", gridTemplateColumns: "34px 1fr", gap: 10, padding: "6px 6px",
              borderBottom: "1px solid var(--border)", borderRadius: 6,
              background: on ? "var(--accent-tint)" : "transparent",
            }}>
              <span className="mono" style={{ fontWeight: 700, color: on ? "var(--accent)" : "var(--text)" }}>{r.level}</span>
              <span className={on ? "" : "muted"}>{r.effect}</span>
            </div>
          );
        })}
      </div>
      <p className="muted" style={{ fontSize: 11, margin: "8px 0 0" }}>
        Penalidades de interação com humanos se acumulam conforme a Humanidade cai. Resumo do
        corebook para consulta — o Narrador decide os detalhes da cena.
      </p>
    </div>
  );
}

export function BloodPotencyTable({ catalog, current }: { catalog?: V5Catalog | null; current?: number }) {
  const rows = catalog?.bloodPotency ?? [];
  if (rows.length === 0) return null;
  return (
    <div className="panel" style={{ margin: 0, overflowX: "auto" }} data-testid="bp-table">
      <span className="kv-label">Tabela de Potência de Sangue</span>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 13 }}>
        <thead>
          <tr style={{ textAlign: "left", color: "var(--muted)" }}>
            <th style={th}>Pot.</th>
            <th style={th}>Surto</th>
            <th style={th}>Rerrolar Rouse</th>
            <th style={th}>Bônus Disc.</th>
            <th style={th}>Gravid. Perdição</th>
            <th style={th}>Cura/Rouse</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((b) => {
            const on = current === b.potency;
            return (
              <tr key={b.potency} style={{ background: on ? "var(--accent-tint)" : "transparent" }}>
                <td style={{ ...td, fontWeight: 700, color: on ? "var(--accent)" : "var(--text)" }}>{b.potency}</td>
                <td style={td}>+{b.bloodSurge}</td>
                <td style={td}>{b.rouseReroll > 0 ? `≤ nível ${b.rouseReroll}` : "—"}</td>
                <td style={td}>+{b.disciplineBonus}</td>
                <td style={td}>{b.baneSeverity}</td>
                <td style={td}>{b.mendingRouse}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="muted" style={{ fontSize: 11, margin: "8px 0 0" }}>
        Surto: bônus de dados num teste via Rouse Check. Bônus de Disciplina: dados extras no
        poder. Gravidade da Perdição: força da maldição do clã. Cura/Rouse: vitalidade curada por Rouse.
      </p>
    </div>
  );
}

const th: React.CSSProperties = { padding: "4px 8px", borderBottom: "1px solid var(--border)", fontWeight: 600, whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "4px 8px", borderBottom: "1px solid var(--border)", whiteSpace: "nowrap" };
