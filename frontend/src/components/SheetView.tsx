"use client";

import type { SchemaShape, V5Catalog, ClanView } from "@/lib/api";
import { DamageTrack } from "@/components/DamageTrack";

type Sheet = Record<string, unknown>;
type Dmg = { sup: number; agg: number };
type Weapon = { name: string; damage: string };
type Item = { name: string; qty: number; category: string; desc: string; equipped: boolean };
type Discipline = { name: string; level: number; powers: string };
type Advantage = { name: string; dots: number; note: string };

const CAT_LABEL: Record<string, string> = { FISICAS: "Físicas", SOCIAIS: "Sociais", MENTAIS: "Mentais" };
const ATTR_CATEGORY: Record<string, string> = {
  forca: "Físicos", destreza: "Físicos", vigor: "Físicos",
  carisma: "Sociais", manipulacao: "Sociais", autocontrole: "Sociais",
  inteligencia: "Mentais", raciocinio: "Mentais", determinacao: "Mentais",
};

/** Visão SOMENTE-LEITURA da ficha completa (painel de visualização). */
export function SheetView({ schema, sheet, catalog }: {
  schema: SchemaShape; sheet: Sheet; catalog?: V5Catalog | null;
}) {
  const attrs = (sheet.attributes as Record<string, number>) ?? {};
  const skillVals = (sheet.skills as Record<string, number>) ?? {};
  const derived = (sheet.derived as Record<string, number>) ?? {};
  const disciplines = (sheet.disciplines as Discipline[]) ?? [];
  const advantages = (sheet.advantages as Advantage[]) ?? [];
  const flaws = (sheet.flaws as Advantage[]) ?? [];
  const convictions = (sheet.convictions as string[]) ?? [];
  const touchstones = (sheet.touchstones as string[]) ?? [];
  const weapons = (sheet.weapons as Weapon[]) ?? [];
  const inventory = (sheet.inventory as Item[]) ?? [];
  const healthDmg = (sheet.healthDmg as Dmg) ?? { sup: 0, agg: 0 };
  const wpDmg = (sheet.wpDmg as Dmg) ?? { sup: 0, agg: 0 };
  const type = (sheet.type as string) ?? "VAMPIRO";
  const clanId = (sheet.clan as string) ?? "";
  const bp = Number(sheet.bloodPotency);
  const clan: ClanView | undefined = catalog?.clans.find((c) => c.id === clanId);
  const skillMeta = buildSkillMeta(catalog);
  const bpRow = catalog?.bloodPotency?.find((b) => b.potency === bp);

  const notes = str(sheet.notes);
  const journal = (sheet.journal as string[]) ?? [];
  const avatarUrl = str(sheet.avatarUrl);

  return (
    <div data-testid="sheet-view">
      {avatarUrl && (
        <div style={{ marginBottom: 14 }}>
          <span className="portrait lg" data-testid="view-portrait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="retrato" />
          </span>
        </div>
      )}
      {/* Identidade */}
      <div className="review-grid">
        <div className="panel" style={{ margin: 0 }}>
          <Kv k="Tipo" v={titleCase(type)} />
          <Kv k="Clã" v={clan?.label || clanId || "—"} />
          <Kv k="Conceito" v={str(sheet.concept) || "—"} />
          <Kv k="Senhor" v={str(sheet.sire) || "—"} />
          <Kv k="Geração / P. Sangue" v={`${str(sheet.generation) || "—"} / ${str(sheet.bloodPotency) || "—"}`} />
          <Kv k="Predador" v={str(sheet.predatorType) || "—"} />
          <Kv k="Coterie" v={str(sheet.coterie) || "—"} />
          <Kv k="Ressonância" v={str(sheet.resonance) || "—"} />
          <Kv k="Ambição" v={str(sheet.ambition) || "—"} />
          <Kv k="Desejo" v={str(sheet.desire) || "—"} />
          <Kv k="Humanidade" v={String((sheet.humanity as number) ?? 7)} />
          <Kv k="Fome" v={String((sheet.hunger as number) ?? 0)} />
          <Kv k="XP disponível" v={xpAvail(sheet)} />
        </div>
        <div className="panel accent-box" style={{ margin: 0 }}>
          <div className="kv-label">Recursos</div>
          <Stat k="Vitalidade" v={derived.vitality ?? "—"} />
          <Stat k="Força de Vontade" v={derived.willpower ?? "—"} />
          <div style={{ marginTop: 8 }}>
            <DamageTrack label="Trilha de Vitalidade" max={derived.vitality ?? 0}
              sup={healthDmg.sup} agg={healthDmg.agg} readOnly />
            <DamageTrack label="Trilha de FdV" max={derived.willpower ?? 0}
              sup={wpDmg.sup} agg={wpDmg.agg} readOnly />
          </div>
          {bpRow && (
            <div style={{ marginTop: 8, fontSize: 13 }} className="muted">
              Surto +{bpRow.bloodSurge} · Disciplina +{bpRow.disciplineBonus} · Gravidade da Perdição {bpRow.baneSeverity} · Cura {bpRow.mendingRouse}
            </div>
          )}
        </div>
      </div>

      {/* Clã: disciplinas, compulsão e MALDIÇÃO (função) */}
      {clan && (
        <div className="panel" style={{ marginTop: 14 }}>
          <h3 style={{ marginTop: 0 }}>{clan.label}</h3>
          <p className="muted" style={{ marginTop: 0 }}>{clan.description}</p>
          <div className="review-grid">
            <div>
              <span className="kv-label">Disciplinas de clã</span>
              <div className="chips" style={{ marginTop: 6 }}>
                {clan.disciplines.length ? clan.disciplines.map((d) => <span key={d} className="badge buff">{d}</span>) : <span className="muted">nenhuma</span>}
              </div>
            </div>
            <div><span className="kv-label">Compulsão</span><p style={{ margin: ".2rem 0 0" }}>{clan.compulsion}</p></div>
          </div>
          <div style={{ marginTop: 10 }}>
            <span className="kv-label">Maldição (fraqueza do clã)</span>
            <p style={{ margin: ".2rem 0 0" }}>{clan.bane}</p>
            <p className="muted" style={{ fontSize: 12, margin: "6px 0 0" }}>
              A maldição é a fraqueza inata do clã. Sua severidade segue a <b>Gravidade da Perdição</b>
              {bpRow ? ` (${bpRow.baneSeverity} nesta Potência de Sangue)` : " (vem da Potência de Sangue)"} — quanto maior a potência, mais forte a maldição.
            </p>
          </div>
        </div>
      )}

      {/* Lore */}
      {(str(sheet.appearance) || str(sheet.personality) || str(sheet.history)) && (
        <div className="panel" style={{ marginTop: 14 }}>
          {str(sheet.appearance) && <><span className="kv-label">Aparência</span><p>{str(sheet.appearance)}</p></>}
          {str(sheet.personality) && <><span className="kv-label">Personalidade</span><p>{str(sheet.personality)}</p></>}
          {str(sheet.history) && <><span className="kv-label">História</span><p style={{ whiteSpace: "pre-wrap" }}>{str(sheet.history)}</p></>}
        </div>
      )}

      {/* Atributos / Perícias */}
      <div className="review-grid" style={{ marginTop: 14 }}>
        <TraitBlock title="Atributos" names={schema.attributes ?? []} values={attrs}
          label={titleCase} groupOf={(n) => ATTR_CATEGORY[n] ?? "Atributos"} />
        <TraitBlock title="Perícias" names={schema.skills ?? []} values={skillVals}
          label={(n) => skillMeta.get(norm(n))?.label ?? titleCase(n)}
          groupOf={(n) => skillMeta.get(norm(n))?.category ?? "Outras"} />
      </div>

      {/* Especializações */}
      {Object.entries((sheet.specialties as Record<string, string>) ?? {}).filter(([, v]) => v).length > 0 && (
        <div className="panel" style={{ marginTop: 14 }}>
          <span className="kv-label">Especializações</span>
          <div className="chips" style={{ marginTop: 6 }}>
            {Object.entries((sheet.specialties as Record<string, string>) ?? {}).filter(([, v]) => v).map(([k, v]) => (
              <span key={k} className="badge">{skillMeta.get(norm(k))?.label ?? titleCase(k)}: <b>{v}</b></span>
            ))}
          </div>
        </div>
      )}

      {/* Disciplinas do personagem */}
      {disciplines.length > 0 && (
        <div className="panel" style={{ marginTop: 14 }}>
          <span className="kv-label">Disciplinas</span>
          {disciplines.map((d, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "3px 0" }}>
              <span><b>{d.name || "—"}</b> <span style={{ color: "var(--accent)" }}>{dots(d.level, 5)}</span></span>
              <span className="muted" style={{ fontSize: 13 }}>{d.powers}</span>
            </div>
          ))}
        </div>
      )}

      {/* Vantagens / Defeitos */}
      {(advantages.length > 0 || flaws.length > 0) && (
        <div className="review-grid" style={{ marginTop: 14 }}>
          <ListBlock title="Vantagens" items={advantages} />
          <ListBlock title="Defeitos" items={flaws} />
        </div>
      )}

      {/* Convicções / Pilares */}
      {(convictions.length > 0 || touchstones.length > 0) && (
        <div className="review-grid" style={{ marginTop: 14 }}>
          <div className="panel" style={{ margin: 0 }}><span className="kv-label">Convicções</span>
            <ul style={{ margin: ".3rem 0 0", paddingLeft: 18 }}>{convictions.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
          <div className="panel" style={{ margin: 0 }}><span className="kv-label">Pilares</span>
            <ul style={{ margin: ".3rem 0 0", paddingLeft: 18 }}>{touchstones.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
        </div>
      )}

      {/* Anotações / Diário */}
      {(notes || journal.length > 0) && (
        <div className="panel" style={{ marginTop: 14 }} data-testid="view-notes">
          {notes && <><span className="kv-label">Anotações</span><p style={{ whiteSpace: "pre-wrap" }}>{notes}</p></>}
          {journal.length > 0 && (
            <>
              <span className="kv-label">Diário de sessão</span>
              <ul style={{ margin: ".3rem 0 0", paddingLeft: 18 }}>{journal.map((j, i) => <li key={i}>{j}</li>)}</ul>
            </>
          )}
        </div>
      )}

      {/* Equipamento */}
      {weapons.length > 0 && (
        <div className="panel" style={{ marginTop: 14 }}>
          <span className="kv-label">Equipamento & Armas</span>
          {weapons.map((w, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "3px 0" }}>
              <span>{w.name || "—"}</span><span className="muted" style={{ fontSize: 13 }}>{w.damage}</span>
            </div>
          ))}
        </div>
      )}

      {/* Inventário */}
      {inventory.length > 0 && (
        <div className="panel" style={{ marginTop: 14 }} data-testid="view-inventory">
          <span className="kv-label">Inventário</span>
          {inventory.map((it, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "3px 0" }}>
              <span>{it.qty > 1 ? `${it.qty}× ` : ""}{it.name || "—"} {it.equipped ? <span className="badge buff" style={{ fontSize: 11 }}>equip.</span> : null}</span>
              <span className="muted" style={{ fontSize: 13 }}>{it.category}{it.desc ? ` · ${it.desc}` : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TraitBlock({ title, names, values, label, groupOf }: {
  title: string; names: string[]; values: Record<string, number>;
  label: (n: string) => string; groupOf: (n: string) => string;
}) {
  const filled = names.filter((n) => (values[n] ?? 0) > 0);
  const groups = groupBy(filled, groupOf);
  return (
    <div className="panel" style={{ margin: 0 }}>
      <span className="kv-label">{title}</span>
      {filled.length === 0 && <p className="muted" style={{ margin: "6px 0 0" }}>—</p>}
      {Object.entries(groups).map(([cat, list]) => (
        <div key={cat} style={{ marginTop: 8 }}>
          <div className="cat-head">{cat}</div>
          {list.map((n) => (
            <div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
              <span>{label(n)}</span><span style={{ color: "var(--accent)" }}>{dots(values[n], 5)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: Advantage[] }) {
  return (
    <div className="panel" style={{ margin: 0 }}>
      <span className="kv-label">{title}</span>
      {items.length === 0 && <p className="muted" style={{ margin: "6px 0 0" }}>—</p>}
      {items.map((a, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "2px 0" }}>
          <span>{a.name || "—"} <span style={{ color: "var(--accent)" }}>{dots(a.dots, 5)}</span></span>
          <span className="muted" style={{ fontSize: 13 }}>{a.note}</span>
        </div>
      ))}
    </div>
  );
}

function Kv({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "3px 0", borderBottom: "1px solid var(--border)" }}>
      <span className="kv-label">{k}</span><span style={{ textAlign: "right" }}>{v}</span>
    </div>
  );
}
function Stat({ k, v }: { k: string; v: number | string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
      <span style={{ fontWeight: 600 }}>{k}</span>
      <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>{v}</span>
    </div>
  );
}

function xpAvail(sheet: Sheet): string {
  const xp = sheet.xp as { total?: number; entries?: { cost: number }[] } | undefined;
  if (!xp) return "—";
  const spent = (xp.entries ?? []).reduce((a, e) => a + (e.cost || 0), 0);
  return `${(xp.total ?? 0) - spent} / ${xp.total ?? 0}`;
}
function dots(n: number, max: number): string { const v = Math.max(0, Math.min(max, n || 0)); return "●".repeat(v) + "○".repeat(max - v); }
function str(v: unknown): string { return v == null ? "" : String(v); }
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
function norm(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}
function titleCase(s: string): string {
  if (!s) return s;
  return s.split(/[_\s]+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}
