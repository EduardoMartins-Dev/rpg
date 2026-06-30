"use client";

import type { V5Catalog } from "@/lib/api";
import { DamageTrack } from "@/components/DamageTrack";

/**
 * Ficha VIVA de sessão: barras de status grandes e tocáveis para o jogador usar na mesa —
 * Vitalidade, Força de Vontade, Fome e Humanidade. Cada interação persiste na hora (onPersist),
 * sem botão "salvar". Read-only o resto: as barras são o foco. Edição estrutural fica no modo
 * Editar. A regra de transbordo de dano (Superficial→Agravado) vem do próprio DamageTrack.
 */

type Sheet = Record<string, unknown>;
type Dmg = { sup: number; agg: number };
type Discipline = { name: string; level: number };

const num = (v: unknown, d = 0): number => (Number.isFinite(Number(v)) ? Number(v) : d);

export function SessionSheet({
  sheet, catalog, onPersist,
}: {
  sheet: Sheet; catalog?: V5Catalog | null;
  onPersist: (next: Sheet) => void;
}) {
  const attrs = (sheet.attributes as Record<string, number>) ?? {};
  const derived = (sheet.derived as Record<string, number>) ?? {};
  const healthDmg = (sheet.healthDmg as Dmg) ?? { sup: 0, agg: 0 };
  const wpDmg = (sheet.wpDmg as Dmg) ?? { sup: 0, agg: 0 };
  const vitMax = num(derived.vitality, num(attrs.vigor) + 3);
  const wpMax = num(derived.willpower, num(attrs.autocontrole) + num(attrs.determinacao));
  const hunger = num(sheet.hunger);
  const humanity = num(sheet.humanity, 7);
  const bp = num(sheet.bloodPotency);
  const bpRow = catalog?.bloodPotency?.find((b) => b.potency === bp);
  const disciplines = ((sheet.disciplines as Discipline[]) ?? []).filter((d) => d?.name);

  const patch = (key: string, value: unknown) => onPersist({ ...sheet, [key]: value });
  const setHunger = (n: number) => patch("hunger", clamp(n, 0, 5));
  const setHumanity = (n: number) => patch("humanity", clamp(n, 0, 10));

  return (
    <div data-testid="session-sheet" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Vitalidade + Força de Vontade — trilhas de dano grandes */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="ss-tracks">
        <div className="panel accent-box" style={{ margin: 0 }} data-testid="ss-vitality">
          <DamageTrack label="Vitalidade" max={vitMax} sup={healthDmg.sup} agg={healthDmg.agg}
            onChange={(s, a) => patch("healthDmg", { sup: s, agg: a })} />
          <p className="muted" style={{ fontSize: 11, margin: "8px 0 0" }}>
            + = tomar dano · − = curar. Superficial cura por noite; Agravado é grave.
          </p>
        </div>
        <div className="panel accent-box" style={{ margin: 0 }} data-testid="ss-willpower">
          <DamageTrack label="Força de Vontade" max={wpMax} sup={wpDmg.sup} agg={wpDmg.agg}
            onChange={(s, a) => patch("wpDmg", { sup: s, agg: a })} />
          <p className="muted" style={{ fontSize: 11, margin: "8px 0 0" }}>
            Gastar FdV = marcar 1 Superficial.
          </p>
        </div>
      </div>

      {/* Fome + Humanidade */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="ss-tracks">
        {/* Fome (0–5) */}
        <div className="panel" style={{ margin: 0 }} data-testid="ss-hunger">
          <div className="track-head">
            <span style={{ fontWeight: 600 }}>Fome</span>
            <span className="mono muted" style={{ fontSize: 12 }}>{hunger}/5</span>
          </div>
          <div style={{ display: "flex", gap: 6, margin: "8px 0" }}>
            {Array.from({ length: 5 }, (_, i) => {
              const on = i < hunger;
              return (
                <button key={i} data-testid={`ss-hunger-${i + 1}`} title={`Fome ${i + 1}`}
                  onClick={() => setHunger(i + 1 === hunger ? i : i + 1)}
                  style={{
                    width: 30, height: 30, borderRadius: "50%", padding: 0, cursor: "pointer",
                    background: on ? "var(--accent)" : "transparent",
                    border: `2px solid ${on ? "var(--accent)" : "var(--border)"}`,
                  }} />
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="secondary" data-testid="ss-rouse" title="Rouse Check falho: +1 Fome"
              onClick={() => setHunger(hunger + 1)} style={{ padding: "3px 10px" }}>Rouse (+1 Fome)</button>
            <button className="secondary" title="Alimentar-se: −1 Fome"
              onClick={() => setHunger(hunger - 1)} style={{ padding: "3px 10px" }}>Alimentar (−1)</button>
          </div>
        </div>

        {/* Humanidade (0–10) */}
        <div className="panel" style={{ margin: 0 }} data-testid="ss-humanity">
          <div className="track-head">
            <span style={{ fontWeight: 600 }}>Humanidade</span>
            <span className="mono muted" style={{ fontSize: 12 }}>{humanity}/10</span>
          </div>
          <div style={{ display: "flex", gap: 4, margin: "8px 0", flexWrap: "wrap" }}>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} style={{
                width: 18, height: 18, borderRadius: 4,
                background: i < humanity ? "var(--text)" : "transparent",
                border: `1px solid ${i < humanity ? "var(--text)" : "var(--border)"}`,
              }} />
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="secondary" data-testid="ss-humanity-dec" onClick={() => setHumanity(humanity - 1)} style={{ padding: "2px 10px" }}>−</button>
            <span className="mono" style={{ minWidth: 18, textAlign: "center" }}>{humanity}</span>
            <button className="secondary" data-testid="ss-humanity-inc" onClick={() => setHumanity(humanity + 1)} style={{ padding: "2px 10px" }}>+</button>
          </div>
        </div>
      </div>

      {/* Tira de referência: Potência de Sangue (consulta rápida na mesa) */}
      {bpRow && (
        <div className="panel" style={{ margin: 0 }} data-testid="ss-bp">
          <span className="kv-label">Potência de Sangue {bp}</span>
          <div className="chips" style={{ marginTop: 6 }}>
            <span className="badge buff">Surto +{bpRow.bloodSurge}</span>
            <span className="badge buff">Bônus Disciplina +{bpRow.disciplineBonus}</span>
            <span className="badge">Cura por Rouse {bpRow.mendingRouse}</span>
            <span className="badge">Gravidade da Perdição {bpRow.baneSeverity}</span>
          </div>
        </div>
      )}

      {/* Disciplinas — consulta do que pode usar na cena */}
      {disciplines.length > 0 && (
        <div className="panel" style={{ margin: 0 }} data-testid="ss-disciplines">
          <span className="kv-label">Disciplinas</span>
          <div className="chips" style={{ marginTop: 6 }}>
            {disciplines.map((d, i) => (
              <span key={i} className="badge">{d.name} {"●".repeat(clamp(num(d.level), 0, 5))}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
