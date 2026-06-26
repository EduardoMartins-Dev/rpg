"use client";

import { useMemo, useState } from "react";
import type { SchemaShape, V5Catalog, ClanView } from "@/lib/api";

type Sheet = Record<string, unknown>;
type Weapon = { name: string; damage: string };

/**
 * Criação/edição de ficha em ETAPAS (wizard), dirigida pelo sheet-schema. Quando o
 * sistema expõe catálogo de regras (V5), enriquece: clã em cards (descrição/buffs) e
 * um diagrama radial de atributos com motivo de pentagrama. Etapas:
 *   1 Atributos · 2 Origem/Clã · 3 Perícias · 4 Equipamento · 5 Revisão
 * Rodapé fixo mostra derivados (Vitalidade/FdV) e disciplinas — computados no servidor.
 */

const ATTR_CATEGORY: Record<string, string> = {
  forca: "Físicos", destreza: "Físicos", vigor: "Físicos",
  carisma: "Sociais", manipulacao: "Sociais", autocontrole: "Sociais",
  inteligencia: "Mentais", raciocinio: "Mentais", determinacao: "Mentais",
};
const CAT_LABEL: Record<string, string> = {
  FISICAS: "Físicas", SOCIAIS: "Sociais", MENTAIS: "Mentais",
};

export function DynamicSheet({
  schema, sheet, onChange, catalog,
}: {
  schema: SchemaShape;
  sheet: Sheet;
  onChange: (next: Sheet) => void;
  catalog?: V5Catalog | null;
}) {
  const attributes = schema.attributes ?? [];
  const skills = schema.skills ?? [];

  const attrs = (sheet.attributes as Record<string, number>) ?? {};
  const skillVals = (sheet.skills as Record<string, number>) ?? {};
  const derived = (sheet.derived as Record<string, number>) ?? {};
  const clanDisc = (sheet.clanDisciplines as string[]) ?? [];
  const weapons = (sheet.weapons as Weapon[]) ?? [];
  const type = (sheet.type as string) ?? "VAMPIRO";
  const clanId = (sheet.clan as string) ?? "";

  const types = catalog?.types ?? ["VAMPIRO", "MORTAL", "CARNICAL"];
  const selectedClan: ClanView | undefined = catalog?.clans.find((c) => c.id === clanId);
  const canHaveClan = type !== "MORTAL";

  const skillMeta = useMemo(() => buildSkillMeta(catalog), [catalog]);
  const steps = ["Atributos", canHaveClan ? "Origem / Clã" : "Origem", "Perícias", "Equipamento", "Revisão"];
  const [step, setStep] = useState(0);

  function setTop(key: string, value: unknown) { onChange({ ...sheet, [key]: value }); }
  function setNumGroup(group: "attributes" | "skills", key: string, raw: string) {
    const current = (sheet[group] as Record<string, number>) ?? {};
    const next = { ...current };
    if (raw === "") delete next[key];
    else next[key] = Number(raw);
    onChange({ ...sheet, [group]: next });
  }
  function setWeapons(next: Weapon[]) { onChange({ ...sheet, weapons: next }); }

  const attrGroups = groupBy(attributes, (n) => ATTR_CATEGORY[n] ?? "Atributos");
  const skillGroups = groupBy(skills, (n) => skillMeta.get(norm(n))?.category ?? "Outras");

  return (
    <div data-testid="dynamic-sheet" className="sheet">
      {/* Stepper */}
      <ol className="stepper" data-testid="sheet-steps">
        {steps.map((label, i) => (
          <li key={label}>
            <button type="button" className={`step-tab${i === step ? " on" : ""}${i < step ? " done" : ""}`}
              data-testid={`step-tab-${i}`} onClick={() => setStep(i)}>
              <span className="step-no">{i + 1}</span>{label}
            </button>
          </li>
        ))}
      </ol>

      <div className="step-body">
        {/* 1 · Atributos */}
        {step === 0 && (
          <section>
            <div className="grid2" style={{ marginBottom: ".8rem" }}>
              <div>
                <label htmlFor="sheet-type">Tipo de personagem</label>
                <select id="sheet-type" data-testid="sheet-type" value={type}
                  onChange={(e) => setTop("type", e.target.value)}>
                  {types.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="sheet-hunger">Fome (0–5)</label>
                <input id="sheet-hunger" data-testid="sheet-hunger" type="number" min={0} max={5}
                  value={(sheet.hunger as number) ?? 0}
                  onChange={(e) => setTop("hunger", Number(e.target.value))} />
              </div>
              <div>
                <label htmlFor="sheet-humanity">Humanidade (0–10)</label>
                <input id="sheet-humanity" data-testid="sheet-humanity" type="number" min={0} max={10}
                  value={(sheet.humanity as number) ?? 7}
                  onChange={(e) => setTop("humanity", Number(e.target.value))} />
              </div>
            </div>

            <h3>Atributos base</h3>
            {attributes.length === 0 && <p className="muted">Schema sem atributos.</p>}
            <div className="attr-layout">
              <div className="trait-cols">
                {Object.entries(attrGroups).map(([cat, names]) => (
                  <div key={cat} className="trait-col">
                    <div className="cat-head">{cat}</div>
                    {names.map((name) => (
                      <DotRating key={name} name={titleCase(name)} testid={`attr-${name}`}
                        min={1} max={5} value={attrs[name] ?? ""}
                        onChange={(raw) => setNumGroup("attributes", name, raw)} />
                    ))}
                  </div>
                ))}
              </div>
              {attributes.length >= 3 && (
                <AttributeRadial names={attributes} values={attrs} pentagram={!!catalog} />
              )}
            </div>
          </section>
        )}

        {/* 2 · Origem / Clã */}
        {step === 1 && (
          <section>
            <h3>{canHaveClan ? "Origem / Clã" : "Origem"}</h3>
            <div style={{ maxWidth: 360, marginBottom: ".8rem" }}>
              <label htmlFor="sheet-clan">Clã (id)</label>
              <input id="sheet-clan" data-testid="sheet-clan" value={clanId}
                placeholder={canHaveClan ? "selecione abaixo ou digite (ex.: BRUJAH)" : "—"}
                disabled={!canHaveClan}
                onChange={(e) => setTop("clan", e.target.value || undefined)} />
            </div>

            {catalog && canHaveClan && (
              <>
                <div className="clan-grid" data-testid="clan-grid">
                  {catalog.clans.map((c) => (
                    <button key={c.id} type="button"
                      className={`clan-card${c.id === clanId ? " sel" : ""}`}
                      data-testid={`clan-${c.id}`} onClick={() => setTop("clan", c.id)}>
                      <span className="clan-name">{c.label}</span>
                      <span className="clan-disc">
                        {c.disciplines.length ? c.disciplines.join(" · ") : "sem disciplinas fixas"}
                      </span>
                    </button>
                  ))}
                </div>

                {selectedClan && (
                  <div className="clan-detail" data-testid="clan-detail">
                    <h4>{selectedClan.label}</h4>
                    <p className="muted">{selectedClan.description}</p>
                    <div className="grid2">
                      <div>
                        <span className="kv-label">Disciplinas (buffs)</span>
                        <div className="chips">
                          {selectedClan.disciplines.length
                            ? selectedClan.disciplines.map((d) => <span key={d} className="badge buff">{d}</span>)
                            : <span className="muted">nenhuma</span>}
                        </div>
                      </div>
                      <div>
                        <span className="kv-label">Compulsão</span>
                        <p style={{ margin: ".2rem 0 0" }}>{selectedClan.compulsion}</p>
                      </div>
                    </div>
                    <div style={{ marginTop: ".5rem" }}>
                      <span className="kv-label">Maldição (bane)</span>
                      <p style={{ margin: ".2rem 0 0" }}>{selectedClan.bane}</p>
                    </div>
                  </div>
                )}
              </>
            )}
            {!canHaveClan && <p className="muted">Mortais não possuem clã nem disciplinas.</p>}
          </section>
        )}

        {/* 3 · Perícias */}
        {step === 2 && (
          <section>
            <h3>Perícias</h3>
            {skills.length === 0 && <p className="muted">Schema sem perícias.</p>}
            <div className="trait-cols">
              {Object.entries(skillGroups).map(([cat, names]) => (
                <div key={cat} className="trait-col">
                  <div className="cat-head">{cat}</div>
                  {names.map((name) => (
                    <DotRating key={name} name={skillMeta.get(norm(name))?.label ?? titleCase(name)}
                      testid={`skill-${name}`} min={0} max={5} value={skillVals[name] ?? ""}
                      onChange={(raw) => setNumGroup("skills", name, raw)} />
                  ))}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4 · Equipamento */}
        {step === 3 && (
          <section>
            <h3>Equipamento & Armas</h3>
            <div data-testid="weapons-list">
              {weapons.map((w, i) => (
                <div key={i} className="weapon-row" data-testid="weapon-row">
                  <input aria-label="arma" placeholder="Arma / item" value={w.name}
                    data-testid={`weapon-name-${i}`}
                    onChange={(e) => setWeapons(weapons.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                  <input aria-label="dano" placeholder="Dano / notas" value={w.damage}
                    data-testid={`weapon-damage-${i}`}
                    onChange={(e) => setWeapons(weapons.map((x, j) => j === i ? { ...x, damage: e.target.value } : x))} />
                  <button type="button" className="secondary" data-testid={`weapon-remove-${i}`}
                    onClick={() => setWeapons(weapons.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
            </div>
            <button type="button" className="secondary" data-testid="weapon-add" style={{ marginTop: ".5rem" }}
              onClick={() => setWeapons([...weapons, { name: "", damage: "" }])}>+ Adicionar arma/item</button>
          </section>
        )}

        {/* 5 · Revisão */}
        {step === 4 && (
          <section>
            <h3>Revisão</h3>
            <div className="review-grid">
              <div className="panel" style={{ margin: 0 }}>
                <span className="kv-label">Tipo</span><p style={{ margin: ".1rem 0 .6rem" }}>{titleCase(type)}</p>
                <span className="kv-label">Clã</span>
                <p style={{ margin: ".1rem 0 .6rem" }}>{selectedClan?.label || clanId || "—"}</p>
                {selectedClan && (
                  <>
                    <span className="kv-label">Disciplinas</span>
                    <div className="chips">{selectedClan.disciplines.map((d) => <span key={d} className="badge buff">{d}</span>)}</div>
                  </>
                )}
              </div>
              {attributes.length >= 3 && (
                <AttributeRadial names={attributes} values={attrs} pentagram={!!catalog} />
              )}
            </div>
            <p className="muted" style={{ marginTop: ".6rem" }}>Confira e clique em <b>Salvar ficha</b> abaixo. Derivados são recalculados no servidor.</p>
          </section>
        )}
      </div>

      {/* Navegação */}
      <div className="step-nav">
        <button type="button" className="secondary" data-testid="step-prev"
          disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>← Voltar</button>
        <span className="muted" style={{ fontSize: ".85rem" }}>Etapa {step + 1} de {steps.length}</span>
        <button type="button" data-testid="step-next"
          disabled={step === steps.length - 1} onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>Próximo →</button>
      </div>

      {/* Rodapé fixo: derivados + disciplinas (sempre visível) */}
      <div className="sheet-foot">
        <div className="stat-pill"><span className="kv-label">Vitalidade</span>
          <span className="badge stat" data-testid="derived-vitality">{derived.vitality ?? "—"}</span></div>
        <div className="stat-pill"><span className="kv-label">Força de Vontade</span>
          <span className="badge stat" data-testid="derived-willpower">{derived.willpower ?? "—"}</span></div>
        {clanDisc.length > 0 && (
          <span className="muted" data-testid="clan-disciplines">
            Disciplinas: {clanDisc.join(", ")}
            {sheet.compulsion ? ` · Compulsão: ${String(sheet.compulsion)}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}

// --- avaliação por pontos ----------------------------------------------------

function DotRating({
  value, max, min, onChange, testid, name,
}: {
  value: number | ""; max: number; min: number;
  onChange: (raw: string) => void; testid: string; name: string;
}) {
  const v = typeof value === "number" ? value : 0;
  const dots = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="trait-row">
      <span className="trait-name">{name}</span>
      <span className="dots">
        {dots.map((i) => (
          <button key={i} type="button" tabIndex={-1} aria-label={`${name} ${i}`}
            className={`dot${v >= i ? " on" : ""}`}
            onClick={() => onChange(String(v === i ? i - 1 : i))} />
        ))}
      </span>
      <input className="num" type="number" min={min} max={max} data-testid={testid} aria-label={name}
        value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// --- diagrama radial (pentagrama p/ V5) --------------------------------------

function AttributeRadial({
  names, values, pentagram,
}: {
  names: string[]; values: Record<string, number>; pentagram: boolean;
}) {
  const size = 230, c = size / 2, R = 86, max = 5;
  const n = names.length;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, r: number) => [c + r * Math.cos(ang(i)), c + r * Math.sin(ang(i))];

  const rings = [1, 2, 3, 4, 5].map((lvl) =>
    names.map((_, i) => pt(i, (lvl / max) * R).join(",")).join(" "));
  const valPoly = names.map((nm, i) => pt(i, ((values[nm] ?? 0) / max) * R).join(",")).join(" ");

  // estrela de 5 pontas (motivo pentagrama V5)
  const starPts = pentagram
    ? [0, 2, 4, 1, 3].map((k) => {
        const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
        return [c + R * Math.cos(a), c + R * Math.sin(a)].join(",");
      }).join(" ")
    : "";

  return (
    <svg className="radial" width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      data-testid="attr-radial" role="img" aria-label="diagrama de atributos">
      {rings.map((p, i) => (
        <polygon key={i} points={p} className="radial-ring" />
      ))}
      {names.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} className="radial-axis" />;
      })}
      {pentagram && <polygon points={starPts} className="radial-star" />}
      <polygon points={valPoly} className="radial-val" />
      {names.map((nm, i) => {
        const [x, y] = pt(i, R + 14);
        return <text key={nm} x={x} y={y} className="radial-label"
          textAnchor="middle" dominantBaseline="middle">{abbr(nm)}</text>;
      })}
    </svg>
  );
}

// --- helpers -----------------------------------------------------------------

function groupBy<T>(items: T[], key: (t: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const it of items) { const k = key(it); (out[k] ??= []).push(it); }
  return out;
}

function buildSkillMeta(catalog?: V5Catalog | null): Map<string, { category: string; label: string }> {
  const m = new Map<string, { category: string; label: string }>();
  if (!catalog) return m;
  for (const g of catalog.abilities) {
    const category = CAT_LABEL[g.category] ?? titleCase(g.category);
    for (const a of g.abilities) m.set(norm(a), { category, label: a });
  }
  return m;
}

// remove acentos e separadores p/ casar "armas_brancas" com "Armas Brancas"
function norm(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function titleCase(s: string): string {
  if (!s) return s;
  return s.split(/[_\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

function abbr(s: string): string {
  return s.slice(0, 3).toUpperCase();
}
