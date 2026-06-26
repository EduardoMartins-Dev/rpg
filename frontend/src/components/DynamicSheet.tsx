"use client";

import type { SchemaShape } from "@/lib/api";

type Sheet = Record<string, unknown>;

/**
 * Renderiza o formulário da ficha DINAMICAMENTE a partir do sheet-schema do sistema
 * (arrays attributes[]/skills[]). Nada de campos hardcoded por sistema — trocar o
 * sistema (e seu schema) muda o formulário sem mudar este componente. Os derivados
 * (Vitalidade/FdV) são calculados no servidor e exibidos somente-leitura.
 */
export function DynamicSheet({
  schema, sheet, onChange,
}: {
  schema: SchemaShape;
  sheet: Sheet;
  onChange: (next: Sheet) => void;
}) {
  const attributes = schema.attributes ?? [];
  const skills = schema.skills ?? [];

  const attrs = (sheet.attributes as Record<string, number>) ?? {};
  const skillVals = (sheet.skills as Record<string, number>) ?? {};
  const derived = (sheet.derived as Record<string, number>) ?? {};
  const clanDisc = (sheet.clanDisciplines as string[]) ?? [];

  function setTop(key: string, value: unknown) {
    onChange({ ...sheet, [key]: value });
  }
  function setNumGroup(group: "attributes" | "skills", key: string, raw: string) {
    const current = (sheet[group] as Record<string, number>) ?? {};
    const next = { ...current };
    if (raw === "") delete next[key];
    else next[key] = Number(raw);
    onChange({ ...sheet, [group]: next });
  }

  return (
    <div data-testid="dynamic-sheet">
      <div className="grid2">
        <div>
          <label htmlFor="sheet-type">Tipo</label>
          <select id="sheet-type" data-testid="sheet-type"
            value={(sheet.type as string) ?? "VAMPIRO"}
            onChange={(e) => setTop("type", e.target.value)}>
            <option value="VAMPIRO">Vampiro</option>
            <option value="MORTAL">Mortal</option>
            <option value="CARNICAL">Carniçal</option>
          </select>
        </div>
        <div>
          <label htmlFor="sheet-clan">Clã (opcional)</label>
          <input id="sheet-clan" data-testid="sheet-clan"
            value={(sheet.clan as string) ?? ""}
            placeholder="BRUJAH, NOSFERATU, RAVNOS…"
            onChange={(e) => setTop("clan", e.target.value || undefined)} />
        </div>
        <div>
          <label htmlFor="sheet-hunger">Fome (0–5)</label>
          <input id="sheet-hunger" data-testid="sheet-hunger" type="number" min={0} max={5}
            value={(sheet.hunger as number) ?? 0}
            onChange={(e) => setTop("hunger", Number(e.target.value))} />
        </div>
        <div>
          <label htmlFor="sheet-humanity">Humanidade</label>
          <input id="sheet-humanity" data-testid="sheet-humanity" type="number" min={0} max={10}
            value={(sheet.humanity as number) ?? 7}
            onChange={(e) => setTop("humanity", Number(e.target.value))} />
        </div>
      </div>

      <h3 style={{ marginTop: "1rem" }}>Atributos</h3>
      <div className="grid2" data-testid="attributes-group">
        {attributes.map((name) => (
          <div key={name}>
            <label htmlFor={`attr-${name}`}>{name}</label>
            <input id={`attr-${name}`} data-testid={`attr-${name}`} type="number" min={1} max={5}
              value={attrs[name] ?? ""} onChange={(e) => setNumGroup("attributes", name, e.target.value)} />
          </div>
        ))}
        {attributes.length === 0 && <p className="muted">Schema sem atributos.</p>}
      </div>

      <h3 style={{ marginTop: "1rem" }}>Perícias</h3>
      <div className="grid2" data-testid="skills-group">
        {skills.map((name) => (
          <div key={name}>
            <label htmlFor={`skill-${name}`}>{name}</label>
            <input id={`skill-${name}`} data-testid={`skill-${name}`} type="number" min={1} max={5}
              value={skillVals[name] ?? ""} onChange={(e) => setNumGroup("skills", name, e.target.value)} />
          </div>
        ))}
        {skills.length === 0 && <p className="muted">Schema sem perícias.</p>}
      </div>

      <h3 style={{ marginTop: "1rem" }}>Derivados (calculados no servidor)</h3>
      <div className="row">
        <div>
          <label>Vitalidade</label>
          <div className="badge" data-testid="derived-vitality">{derived.vitality ?? "—"}</div>
        </div>
        <div>
          <label>Força de Vontade</label>
          <div className="badge" data-testid="derived-willpower">{derived.willpower ?? "—"}</div>
        </div>
      </div>

      {clanDisc.length > 0 && (
        <p className="muted" data-testid="clan-disciplines" style={{ marginTop: ".6rem" }}>
          Disciplinas de clã: {clanDisc.join(", ")}
          {sheet.compulsion ? ` · Compulsão: ${String(sheet.compulsion)}` : ""}
        </p>
      )}
    </div>
  );
}
