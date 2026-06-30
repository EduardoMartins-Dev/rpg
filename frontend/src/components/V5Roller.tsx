"use client";

import { useState } from "react";
import type { BloodPotencyView } from "@/lib/api";

/**
 * Rolador V5 (mecânica do livro): pool de d10 + dados de Fome. Sucesso = 6–10;
 * par de 10 = crítico (+2 sucessos); crítico confuso se houver 10 num dado de Fome;
 * falha bestial se a rolagem falha e houver 1 num dado de Fome. A Potência de Sangue
 * entra de forma mecânica: Surto de Sangue (+dados) e bônus de Disciplina.
 */

type Die = { v: number; hunger: boolean };
type Result = {
  dice: Die[]; successes: number; crits: number; messy: boolean; bestial: boolean;
  win: boolean; difficulty: number;
};

// Fallback (errata Companion) caso o catálogo não traga a tabela.
const FALLBACK_BP: Record<number, { surge: number; disc: number }> = {
  0: { surge: 1, disc: 0 }, 1: { surge: 2, disc: 0 }, 2: { surge: 2, disc: 1 },
  3: { surge: 3, disc: 1 }, 4: { surge: 3, disc: 2 }, 5: { surge: 4, disc: 2 }, 6: { surge: 4, disc: 3 },
};

function bpEffects(table: BloodPotencyView[] | undefined, bp: number) {
  const row = table?.find((b) => b.potency === bp);
  if (row) return { surge: row.bloodSurge, disc: row.disciplineBonus };
  return FALLBACK_BP[Math.max(0, Math.min(6, bp))];
}

const d10 = () => 1 + Math.floor(Math.random() * 10);

/** Traço (atributo ou perícia) para o construtor de teste rápido. */
export type TraitItem = { key: string; label: string; value: number };

export function V5Roller({ bloodPotency, traits, initialHunger, initialBp }: {
  bloodPotency?: BloodPotencyView[];
  /** Quando fornecido, mostra o construtor "Atributo + Perícia" com os traços da ficha. */
  traits?: { attributes: TraitItem[]; skills: TraitItem[] };
  initialHunger?: number; initialBp?: number;
}) {
  const [pool, setPool] = useState(4);
  const [hunger, setHunger] = useState(initialHunger ?? 1);
  const [difficulty, setDifficulty] = useState(2);
  const [bp, setBp] = useState(initialBp ?? 1);
  const [surge, setSurge] = useState(false);
  const [discipline, setDiscipline] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const [rouse, setRouse] = useState<{ v: number; ok: boolean } | null>(null);
  const [selAttr, setSelAttr] = useState("");
  const [selSkill, setSelSkill] = useState("");

  // Monta a reserva a partir dos traços escolhidos: Atributo + Perícia (regra V5).
  function buildPool(attrKey: string, skillKey: string) {
    if (!traits || !attrKey || !skillKey) return;
    const a = traits.attributes.find((t) => t.key === attrKey)?.value ?? 0;
    const s = traits.skills.find((t) => t.key === skillKey)?.value ?? 0;
    setPool(a + s);
  }
  const selAttrVal = traits?.attributes.find((t) => t.key === selAttr)?.value ?? 0;
  const selSkillVal = traits?.skills.find((t) => t.key === selSkill)?.value ?? 0;

  function doRouse() {
    const v = d10();
    setRouse({ v, ok: v >= 6 }); // 6+ = sucesso (não sobe Fome); 1–5 = falha (sobe 1 de Fome)
  }

  const eff = bpEffects(bloodPotency, bp);
  const bonus = (surge ? eff.surge : 0) + (discipline ? eff.disc : 0);
  const total = Math.max(0, pool + bonus);

  function roll() {
    const hungerN = Math.min(hunger, total);
    const dice: Die[] = [];
    for (let i = 0; i < total - hungerN; i++) dice.push({ v: d10(), hunger: false });
    for (let i = 0; i < hungerN; i++) dice.push({ v: d10(), hunger: true });

    const base = dice.filter((d) => d.v >= 6).length;
    const tens = dice.filter((d) => d.v === 10).length;
    const crits = Math.floor(tens / 2);
    const successes = base + crits * 2;
    const win = successes >= difficulty;
    const messy = crits >= 1 && dice.some((d) => d.hunger && d.v === 10);
    const bestial = !win && dice.some((d) => d.hunger && d.v === 1);
    setRes({ dice, successes, crits, messy, bestial, win, difficulty });
  }

  const num = (v: number, set: (n: number) => void, min: number, max: number, label: string, tid?: string) => (
    <div>
      <label style={{ fontSize: 12 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button className="secondary" onClick={() => set(Math.max(min, v - 1))} style={{ padding: "2px 9px" }}>−</button>
        <span className="mono" data-testid={tid} style={{ minWidth: 18, textAlign: "center", fontWeight: 600 }}>{v}</span>
        <button className="secondary" onClick={() => set(Math.min(max, v + 1))} style={{ padding: "2px 9px" }}>+</button>
      </div>
    </div>
  );

  function outcome(r: Result): { label: string; color: string } {
    if (r.win && r.messy) return { label: "Crítico Confuso", color: "var(--warn)" };
    if (r.win && r.crits >= 1) return { label: "Crítico!", color: "var(--accent)" };
    if (r.win) return { label: "Sucesso", color: "var(--ok)" };
    if (r.bestial) return { label: "Falha Bestial", color: "var(--err)" };
    return { label: "Falha", color: "var(--muted)" };
  }

  return (
    <div className="dice-widget" data-testid="v5-roller">
      <h3 style={{ fontSize: 17, marginTop: 0 }}>Rolagem V5</h3>

      {traits && (
        <div data-testid="quick-test" style={{ marginBottom: 14 }}>
          <div className="kv-label">Teste rápido — Atributo + Perícia</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, margin: "6px 0" }}>
            <select aria-label="atributo" data-testid="qt-attr" value={selAttr}
              onChange={(e) => { setSelAttr(e.target.value); buildPool(e.target.value, selSkill); }}>
              <option value="">Atributo…</option>
              {traits.attributes.map((t) => (
                <option key={t.key} value={t.key}>{t.label} ({t.value})</option>
              ))}
            </select>
            <select aria-label="perícia" data-testid="qt-skill" value={selSkill}
              onChange={(e) => { setSelSkill(e.target.value); buildPool(selAttr, e.target.value); }}>
              <option value="">Perícia…</option>
              {traits.skills.map((t) => (
                <option key={t.key} value={t.key}>{t.label} ({t.value})</option>
              ))}
            </select>
          </div>
          {selAttr && selSkill && (
            <div className="muted" data-testid="qt-pool" style={{ fontSize: 13 }}>
              {traits.attributes.find((t) => t.key === selAttr)?.label} {selAttrVal} +{" "}
              {traits.skills.find((t) => t.key === selSkill)?.label} {selSkillVal} ={" "}
              <b style={{ color: "var(--text)" }}>{selAttrVal + selSkillVal} dados</b>
            </div>
          )}
          {/* Referência: atributos e perícias juntos na mesma tela (sem trocar de aba). */}
          <details style={{ marginTop: 8 }}>
            <summary className="muted" style={{ fontSize: 12, cursor: "pointer" }}>Ver atributos e perícias</summary>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 8, fontSize: 12 }}>
              <div>
                <div className="kv-label">Atributos</div>
                {traits.attributes.map((t) => (
                  <div key={t.key} style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}>
                    <span>{t.label}</span><b className="mono">{t.value}</b>
                  </div>
                ))}
              </div>
              <div>
                <div className="kv-label">Perícias</div>
                {traits.skills.filter((t) => t.value > 0).map((t) => (
                  <div key={t.key} style={{ display: "flex", justifyContent: "space-between", padding: "1px 0" }}>
                    <span>{t.label}</span><b className="mono">{t.value}</b>
                  </div>
                ))}
                {traits.skills.every((t) => t.value <= 0) && <span className="muted">sem perícias</span>}
              </div>
            </div>
          </details>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        {num(pool, setPool, 1, 20, "Parada (Atrib+Perícia)", "roll-pool")}
        {num(hunger, setHunger, 0, 5, "Fome", "roll-hunger")}
        {num(difficulty, setDifficulty, 0, 10, "Dificuldade")}
        {num(bp, setBp, 0, 6, "Potência de Sangue")}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12, fontSize: 13 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
          <input type="checkbox" checked={surge} onChange={(e) => setSurge(e.target.checked)} style={{ width: "auto" }} />
          Surto de Sangue (+{eff.surge})
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
          <input type="checkbox" checked={discipline} onChange={(e) => setDiscipline(e.target.checked)} style={{ width: "auto" }} />
          Rolagem de Disciplina (+{eff.disc})
        </label>
      </div>

      <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
        Total de dados: <b style={{ color: "var(--text)" }}>{total}</b>
        {bonus > 0 && ` (${pool} + ${bonus} da potência)`} · {Math.min(hunger, total)} de Fome
      </div>

      <button onClick={roll} data-testid="roll-go" style={{ width: "100%", marginBottom: 10 }}>Rolar</button>

      {/* Rouse check: gastar Vitae */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <button className="secondary" onClick={doRouse} data-testid="rouse-go" style={{ flex: "0 0 auto" }}>Rouse check</button>
        {rouse && (
          <span style={{ fontSize: 13 }} data-testid="rouse-result">
            <span className={`die res${rouse.v === 10 ? " ten" : ""}`} style={{ marginRight: 6 }}>{rouse.v}</span>
            {rouse.ok
              ? <span style={{ color: "var(--ok)" }}>sucesso — Fome não sobe</span>
              : <span style={{ color: "var(--err)" }}>falha — <b>Fome +1</b></span>}
          </span>
        )}
      </div>

      {res && (
        <div data-testid="roll-result" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {res.dice.map((d, i) => (
              <span key={i} className={`die res${d.v === 10 ? " ten" : ""}${d.hunger ? " hunger" : ""}${d.hunger && d.v === 1 ? " bestial" : ""}`}>{d.v}</span>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="kv-label">Resultado</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: outcome(res).color }}>{outcome(res).label}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="kv-label">Sucessos</div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)" }} data-testid="roll-successes">
                {res.successes} <span className="muted" style={{ fontSize: 13 }}>/ {res.difficulty}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
