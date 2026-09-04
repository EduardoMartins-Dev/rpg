"use client";

import { useMemo, useState } from "react";
import type { SchemaShape, V5Catalog, ClanView, MeritView } from "@/lib/api";
import { DamageTrack } from "@/components/DamageTrack";
import { AttributeRadial } from "@/components/AttributeRadial";
import { ClanTrait } from "@/components/ClanTrait";
import { AuthImage } from "@/components/AuthImage";
import { UserImageField } from "@/components/UserImageField";

type Dmg = { sup: number; agg: number };
type XpUndo =
  | { group: "attributes" | "skills"; key: string; prev: number }
  | { group: "bloodPotency"; prev: number }
  | { group: "discipline"; key: string; prev: number }
  | { group: "specialty"; key: string; prev: string };
type XpEntry = { id?: string; desc: string; cost: number; undo?: XpUndo };
type Xp = { total: number; entries: XpEntry[] };

const XP_COSTS: [string, string][] = [
  ["Aumento de Atributo", "novo nível × 5"],
  ["Aumento de Habilidade", "novo nível × 3"],
  ["Nova Especialização", "3"],
  ["Disciplina de Clã", "novo nível × 5"],
  ["Outra Disciplina", "novo nível × 7"],
  ["Disciplina Caitiff", "novo nível × 6"],
  ["Ritual / Fórmula", "nível × 3"],
  ["Vantagem", "3 por ponto"],
  ["Potência de Sangue", "novo nível × 10"],
];

type Sheet = Record<string, unknown>;
type Weapon = { name: string; damage: string };
type Item = { name: string; qty: number; category: string; desc: string; equipped: boolean };
type Power = { name: string; level: number };
type Discipline = { name: string; level: number; powers: Power[] };
type Advantage = { name: string; dots: number; note: string };

// Aceita dados antigos: powers como string ("A · B") vira lista de poderes.
function normPowers(p: unknown): Power[] {
  if (Array.isArray(p)) {
    return p.map((x) => (typeof x === "string"
      ? { name: x, level: 0 }
      : { name: String((x as Power)?.name ?? ""), level: Number((x as Power)?.level ?? 0) }))
      .filter((x) => x.name.trim() !== "" || x.level > 0);
  }
  if (typeof p === "string" && p.trim()) {
    return p.split(/[·,;]+/).map((s) => ({ name: s.trim(), level: 0 })).filter((x) => x.name);
  }
  return [];
}
function normDisciplines(raw: unknown): Discipline[] {
  const list = Array.isArray(raw) ? raw : [];
  return list.map((d) => ({
    name: String((d as Discipline)?.name ?? ""),
    level: Number((d as Discipline)?.level ?? 0),
    powers: normPowers((d as { powers?: unknown })?.powers),
  }));
}

const ITEM_CATEGORIES = ["Arma", "Armadura", "Consumível", "Equipamento", "Tesouro", "Documento", "Outro"];

/**
 * Ficha V5 em ETAPAS (estilo C.R.I.S). Ordem do livro: Clã → Conceito/Lore →
 * Atributos → Perícias → Disciplinas → Vantagens/Defeitos → Convicções & Pilares →
 * Equipamento → Revisão (ficha completa). Campos numéricos (atributos/perícias/fome),
 * clã e derivados são validados/computados no servidor; o resto persiste no sheet_data.
 */

const ATTR_CATEGORY: Record<string, string> = {
  forca: "Físicos", destreza: "Físicos", vigor: "Físicos",
  carisma: "Sociais", manipulacao: "Sociais", autocontrole: "Sociais",
  inteligencia: "Mentais", raciocinio: "Mentais", determinacao: "Mentais",
};
const CAT_LABEL: Record<string, string> = { FISICAS: "Físicas", SOCIAIS: "Sociais", MENTAIS: "Mentais" };

export function DynamicSheet({
  schema, sheet, onChange, catalog,
}: {
  schema: SchemaShape; sheet: Sheet; onChange: (next: Sheet) => void; catalog?: V5Catalog | null;
}) {
  const attributes = schema.attributes ?? [];
  const skills = schema.skills ?? [];

  const attrs = (sheet.attributes as Record<string, number>) ?? {};
  const skillVals = (sheet.skills as Record<string, number>) ?? {};
  const derived = (sheet.derived as Record<string, number>) ?? {};
  const clanDisc = (sheet.clanDisciplines as string[]) ?? [];
  const weapons = (sheet.weapons as Weapon[]) ?? [];
  const inventory = (sheet.inventory as Item[]) ?? [];
  const disciplines = normDisciplines(sheet.disciplines);
  const advantages = (sheet.advantages as Advantage[]) ?? [];
  const flaws = (sheet.flaws as Advantage[]) ?? [];
  const convictions = (sheet.convictions as string[]) ?? [];
  const touchstones = (sheet.touchstones as string[]) ?? [];
  const type = (sheet.type as string) ?? "VAMPIRO";
  const clanId = (sheet.clan as string) ?? "";

  const types = catalog?.types ?? ["VAMPIRO", "MORTAL", "CARNICAL"];
  const selectedClan: ClanView | undefined = catalog?.clans.find((c) => c.id === clanId);
  const canHaveClan = type !== "MORTAL";
  const skillMeta = useMemo(() => buildSkillMeta(catalog), [catalog]);

  const healthDmg = (sheet.healthDmg as Dmg) ?? { sup: 0, agg: 0 };
  const wpDmg = (sheet.wpDmg as Dmg) ?? { sup: 0, agg: 0 };
  // máximos (usa o derivado do servidor; fallback calculado p/ funcionar antes de salvar)
  const vitMax = derived.vitality ?? ((attrs.vigor ?? 0) + 3);
  const wpMax = derived.willpower ?? ((attrs.autocontrole ?? 0) + (attrs.determinacao ?? 0));

  const steps: { key: string; label: string }[] = [
    { key: "cla", label: "Clã" },
    { key: "conceito", label: "Conceito & Lore" },
    { key: "atributos", label: "Atributos" },
    { key: "pericias", label: "Perícias" },
    { key: "disciplinas", label: "Disciplinas" },
    { key: "vantagens", label: "Vantagens & Defeitos" },
    { key: "conviccoes", label: "Convicções & Pilares" },
    { key: "estado", label: "Estado" },
    { key: "equipamento", label: "Equipamento" },
    { key: "notas", label: "Notas" },
    { key: "revisao", label: "Revisão" },
  ];
  const [step, setStep] = useState(0);
  const [infoClan, setInfoClan] = useState<string | null>(null);
  // Perícias adicionadas manualmente para especialização (mesmo sem pontos). Efêmero:
  // ao digitar a especialização ela persiste em sheet.specialties e passa a aparecer sozinha.
  const [addedSpecs, setAddedSpecs] = useState<string[]>([]);
  // Trava de edição: protege as bolinhas (atributos/perícias/níveis) contra clique
  // acidental. Ficha já construída abre TRAVADA; ficha nova abre destravada p/ montar.
  const built = Object.values(attrs).some((v) => Number(v) > 0);
  const [locked, setLocked] = useState(built);
  const cur = steps[step].key;
  // detalhe exibido: o clã que está com o (i) aberto, senão o selecionado
  const detailClan: ClanView | undefined = catalog?.clans.find((c) => c.id === (infoClan ?? clanId));

  function setTop(key: string, value: unknown) { onChange({ ...sheet, [key]: value }); }
  function setNumGroup(group: "attributes" | "skills", key: string, raw: string) {
    const current = (sheet[group] as Record<string, number>) ?? {};
    const next = { ...current };
    // Trava em 1–5 no cliente (o servidor também valida): sem isto, digitar 9 no campo só
    // falhava no salvar. Vazio ou ≤0 = traço não comprado (perícia destreinada), então remove.
    const n = Math.floor(Number(raw));
    if (raw === "" || !Number.isFinite(n) || n <= 0) delete next[key];
    else next[key] = Math.min(5, n);
    onChange({ ...sheet, [group]: next });
  }
  const set = <T,>(key: string, v: T) => setTop(key, v);

  const attrGroups = groupBy(attributes, (n) => ATTR_CATEGORY[n] ?? "Atributos");
  const skillGroups = groupBy(skills, (n) => skillMeta.get(norm(n))?.category ?? "Outras");

  function loadClanDisciplines() {
    if (!selectedClan) return;
    const existing = new Set(disciplines.map((d) => norm(d.name)));
    const add = selectedClan.disciplines
      .filter((d) => !existing.has(norm(d)))
      .map((d) => ({ name: d, level: 0, powers: [] as Power[] }));
    set("disciplines", [...disciplines, ...add]);
  }

  // --- edição de disciplinas/poderes ---
  const setDisc = (next: Discipline[]) => set("disciplines", next);
  const updDisc = (i: number, patch: Partial<Discipline>) =>
    setDisc(disciplines.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const addPower = (i: number) =>
    setDisc(disciplines.map((d, j) => (j === i ? { ...d, powers: [...d.powers, { name: "", level: d.level || 1 }] } : d)));
  const updPower = (i: number, pi: number, patch: Partial<Power>) =>
    setDisc(disciplines.map((d, j) => (j === i ? { ...d, powers: d.powers.map((p, k) => (k === pi ? { ...p, ...patch } : p)) } : d)));
  const delPower = (i: number, pi: number) =>
    setDisc(disciplines.map((d, j) => (j === i ? { ...d, powers: d.powers.filter((_, k) => k !== pi) } : d)));

  // Adiciona um poder específico do catálogo à disciplina (cria a disciplina se não existir).
  function addCatalogPower(discName: string, powerName: string, level: number) {
    const idx = disciplines.findIndex((d) => norm(d.name) === norm(discName));
    if (idx === -1) {
      setDisc([...disciplines, { name: discName, level: Math.max(level, 1), powers: [{ name: powerName, level }] }]);
      return;
    }
    const d = disciplines[idx];
    if (d.powers.some((p) => norm(p.name) === norm(powerName))) return;
    setDisc(disciplines.map((x, j) => (j === idx
      ? { ...x, level: Math.max(x.level, level), powers: [...x.powers, { name: powerName, level }] }
      : x)));
  }

  return (
    <div data-testid="dynamic-sheet" className="sheet">
      <ol className="stepper" data-testid="sheet-steps">
        {steps.map((s, i) => (
          <li key={s.key}>
            <button type="button" className={`step-tab${i === step ? " on" : ""}${i < step ? " done" : ""}`}
              data-testid={`step-${s.key}`} onClick={() => setStep(i)}>
              <span className="step-no">{i + 1}</span>{s.label}
            </button>
          </li>
        ))}
      </ol>

      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 4px", flexWrap: "wrap" }}>
        <button type="button" className={locked ? "" : "secondary"} data-testid="traits-lock"
          onClick={() => setLocked((l) => !l)} style={{ padding: "4px 12px" }}>
          {locked ? "🔒 Traços travados" : "🔓 Editando traços"}
        </button>
        <span className="muted" style={{ fontSize: 12 }}>
          {locked
            ? "Atributos, perícias e níveis protegidos contra clique acidental. Destrave para editar."
            : "Bolinhas editáveis. Trave ao terminar para não mudar valores sem querer."}
        </span>
      </div>

      <div className="step-body">
        {/* 1 · CLÃ */}
        {cur === "cla" && (
          <section>
            <div className="grid2" style={{ marginBottom: ".8rem", maxWidth: 460 }}>
              <div>
                <label htmlFor="sheet-type">Tipo de personagem</label>
                <select id="sheet-type" data-testid="sheet-type" value={type}
                  onChange={(e) => setTop("type", e.target.value)}>
                  {types.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="sheet-clan">Clã (id)</label>
                <input id="sheet-clan" data-testid="sheet-clan" value={clanId}
                  placeholder={canHaveClan ? "selecione abaixo" : "—"} disabled={!canHaveClan}
                  onChange={(e) => setTop("clan", e.target.value || undefined)} />
              </div>
            </div>

            {!canHaveClan && <p className="muted">Mortais não possuem clã nem disciplinas.</p>}

            {catalog && canHaveClan && (
              <>
                <h3>Escolha o clã <span className="muted" style={{ fontSize: ".8rem" }}>(clique pra selecionar · ⓘ pra ver as regras)</span></h3>
                <div className="clan-grid" data-testid="clan-grid">
                  {catalog.clans.map((c) => (
                    <div key={c.id} role="button" tabIndex={0}
                      className={`clan-card${c.id === clanId ? " sel" : ""}`}
                      data-testid={`clan-${c.id}`}
                      onClick={() => { setTop("clan", c.id); setInfoClan(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setTop("clan", c.id); setInfoClan(null); } }}>
                      <span className="clan-name">
                        {c.label}
                        <span className={`clan-i${infoClan === c.id ? " on" : ""}`} role="button" tabIndex={0}
                          aria-label={`Informações de ${c.label}`} title="Ver informações"
                          data-testid={`clan-info-${c.id}`}
                          onClick={(e) => { e.stopPropagation(); setInfoClan(infoClan === c.id ? null : c.id); }}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); setInfoClan(infoClan === c.id ? null : c.id); } }}>
                          ⓘ
                        </span>
                      </span>
                      <span className="clan-disc">{c.disciplines.length ? c.disciplines.join(" · ") : "sem disciplinas fixas"}</span>
                    </div>
                  ))}
                </div>
                {detailClan && (
                  <div className="clan-detail" data-testid="clan-detail">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                      <h4 style={{ margin: 0 }}>{detailClan.label}</h4>
                      {detailClan.id !== clanId && (
                        <button type="button" className="secondary" style={{ padding: "6px 12px", fontSize: 13 }}
                          onClick={() => { setTop("clan", detailClan.id); setInfoClan(null); }}>Selecionar este clã</button>
                      )}
                      {detailClan.id === clanId && <span className="badge role-MASTER">selecionado</span>}
                    </div>
                    <p style={{ marginTop: 0, lineHeight: 1.55 }}>{detailClan.description}</p>
                    <div>
                      <span className="kv-label">Disciplinas de clã</span>
                      <div className="chips" style={{ marginTop: 4 }}>
                        {detailClan.disciplines.length
                          ? detailClan.disciplines.map((d) => <span key={d} className="badge buff">{d}</span>)
                          : <span className="muted">nenhuma</span>}
                      </div>
                    </div>
                    <ClanTrait kind="bane" text={detailClan.bane} />
                    <ClanTrait kind="compulsion" text={detailClan.compulsion} />
                  </div>
                )}
              </>
            )}
            {!catalog && canHaveClan && <p className="muted">Catálogo de clãs indisponível para este sistema — digite o id do clã acima.</p>}
          </section>
        )}

        {/* 2 · CONCEITO & LORE */}
        {cur === "conceito" && (
          <section>
            <h3>Retrato</h3>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap", marginBottom: ".6rem" }}>
              <span className="portrait" data-testid="sheet-portrait">
                {str(sheet.avatarUrl)
                  ? <AuthImage src={str(sheet.avatarUrl)} alt="retrato" />
                  : <span className="muted" style={{ fontSize: 12, textAlign: "center", padding: 8 }}>sem foto</span>}
              </span>
              <div style={{ flex: 1, minWidth: 220 }}>
                <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>Foto do personagem</label>
                <UserImageField testid="sheet-avatar" value={str(sheet.avatarUrl)}
                  onChange={(v) => set("avatarUrl", v || undefined)} />
                <p className="muted" style={{ fontSize: 12, margin: "6px 0 0" }}>Envie uma imagem do dispositivo ou cole o link de uma arte/retrato.</p>
              </div>
            </div>
            <h3>Conceito</h3>
            <div className="grid2">
              <Field label="Conceito" v={str(sheet.concept)} on={(v) => set("concept", v)} ph="ex.: detetive amaldiçoado" />
              <Field label="Senhor (Sire)" v={str(sheet.sire)} on={(v) => set("sire", v)} />
              <Field label="Geração" type="number" v={str(sheet.generation)} on={(v) => set("generation", v ? Number(v) : undefined)} ph="ex.: 13" />
              <Field label="Potência de Sangue (0–6)" type="number" v={str(sheet.bloodPotency)} on={(v) => set("bloodPotency", v ? Number(v) : undefined)} />
              <PredatorField catalog={catalog} value={str(sheet.predatorType)} disabled={!canHaveClan}
                onChange={(v) => set("predatorType", v || undefined)} />
              <Field label="Idade aparente" v={str(sheet.apparentAge)} on={(v) => set("apparentAge", v)} />
            </div>
            {sheet.generation != null && sheet.generation !== "" && (
              <button type="button" className="secondary" style={{ marginTop: 8 }}
                onClick={() => set("bloodPotency", genToBloodPotency(Number(sheet.generation)))}>
                Calcular Potência de Sangue pela Geração ({genToBloodPotency(Number(sheet.generation))})
              </button>
            )}
            <BloodPotencyEffects catalog={catalog} potency={Number(sheet.bloodPotency)} />

            {(catalog?.coterieTypes || catalog?.resonances) && (
              <div className="grid2" style={{ marginTop: 12 }}>
                {catalog?.coterieTypes && (
                  <CatalogSelect label="Coterie" value={str(sheet.coterie)} onChange={(v) => set("coterie", v || undefined)}
                    options={catalog.coterieTypes.map((c) => ({ name: c.name, detail: c.summary }))} />
                )}
                {catalog?.resonances && (
                  <CatalogSelect label="Ressonância do sangue" value={str(sheet.resonance)} onChange={(v) => set("resonance", v || undefined)}
                    options={catalog.resonances.map((r) => ({ name: r.name, detail: `${r.emotion} · ${r.disciplines.join(", ")}` }))} />
                )}
              </div>
            )}

            <h3 style={{ marginTop: "1.1rem" }}>Motivação</h3>
            <div className="grid2">
              <Field label="Ambição" v={str(sheet.ambition)} on={(v) => set("ambition", v)} ph="objetivo de longo prazo" />
              <Field label="Desejo" v={str(sheet.desire)} on={(v) => set("desire", v)} ph="vontade imediata" />
            </div>

            <h3 style={{ marginTop: "1.1rem" }}>Descrição & História</h3>
            <Area label="Aparência" v={str(sheet.appearance)} on={(v) => set("appearance", v)} />
            <Area label="Personalidade" v={str(sheet.personality)} on={(v) => set("personality", v)} />
            <Area label="História / Lore" v={str(sheet.history)} on={(v) => set("history", v)} rows={6} />
          </section>
        )}

        {/* 3 · ATRIBUTOS */}
        {cur === "atributos" && (
          <section>
            <div className="grid2" style={{ marginBottom: ".8rem", maxWidth: 300 }}>
              <div>
                <label htmlFor="sheet-hunger">Fome (0–5)</label>
                <input id="sheet-hunger" data-testid="sheet-hunger" type="number" min={0} max={5}
                  value={(sheet.hunger as number) ?? 0}
                  onChange={(e) => setTop("hunger", Math.max(0, Math.min(5, Math.floor(Number(e.target.value)) || 0)))} />
              </div>
            </div>
            <h3>Atributos <span className="muted" style={{ fontSize: ".8rem" }}>(1 com 4 · 3 com 3 · 4 com 2 · 1 com 1)</span></h3>
            <AttrBudget attributes={attributes} attrs={attrs} />
            {attributes.length === 0 && <p className="muted">Schema sem atributos.</p>}
            <div className="attr-layout">
              <div className="trait-cols">
                {Object.entries(attrGroups).map(([cat, names]) => (
                  <div key={cat} className="trait-col">
                    <div className="cat-head">{cat}</div>
                    {names.map((name) => (
                      <DotRating key={name} name={titleCase(name)} testid={`attr-${name}`} min={1} max={5}
                        value={attrs[name] ?? ""} disabled={locked} onChange={(raw) => setNumGroup("attributes", name, raw)} />
                    ))}
                  </div>
                ))}
              </div>
              {attributes.length >= 3 && <AttributeRadial names={attributes} values={attrs} pentagram={!!catalog} />}
            </div>
          </section>
        )}

        {/* 4 · PERÍCIAS */}
        {cur === "pericias" && (
          <section>
            <h3>Perícias <span className="muted" style={{ fontSize: ".8rem" }}>(escolha uma distribuição do livro)</span></h3>
            {skills.length === 0 && <p className="muted">Schema sem perícias.</p>}
            <div className="trait-cols">
              {Object.entries(skillGroups).map(([cat, names]) => (
                <div key={cat} className="trait-col">
                  <div className="cat-head">{cat}</div>
                  {names.map((name) => (
                    <DotRating key={name} name={skillMeta.get(norm(name))?.label ?? titleCase(name)}
                      testid={`skill-${name}`} min={0} max={5} value={skillVals[name] ?? ""}
                      disabled={locked} onChange={(raw) => setNumGroup("skills", name, raw)} />
                  ))}
                </div>
              ))}
            </div>

            {/* Especializações — qualquer perícia pode ter, mesmo sem pontos (regra V5). */}
            {(() => {
              const specialties = (sheet.specialties as Record<string, string>) ?? {};
              // Mostradas: com pontos, ou já com especialização, ou adicionadas à mão.
              const shown = skills.filter((n) => (skillVals[n] ?? 0) > 0 || (specialties[n] ?? "").trim().length > 0 || addedSpecs.includes(n));
              const addable = skills.filter((n) => !shown.includes(n));
              const label = (n: string) => skillMeta.get(norm(n))?.label ?? titleCase(n);
              function setSpec(n: string, v: string) { setTop("specialties", { ...specialties, [n]: v }); }
              function dropSpec(n: string) {
                const next = { ...specialties }; delete next[n];
                setTop("specialties", next);
                setAddedSpecs((xs) => xs.filter((x) => x !== n));
              }
              return (
                <div className="sheet-section">
                  <h3 style={{ fontSize: "1rem" }}>Especializações <span className="muted" style={{ fontSize: ".8rem" }}>(foco dentro da perícia — vale mesmo sem pontos)</span></h3>
                  {shown.length === 0 && (
                    <p className="muted" style={{ fontSize: 13 }}>Nenhuma ainda. Escolha uma perícia abaixo para especializar.</p>
                  )}
                  {shown.map((n) => (
                    <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ flex: "0 0 130px", fontSize: 14 }}>{label(n)}</span>
                      <input style={{ flex: 1 }} data-testid={`spec-${n}`} value={specialties[n] ?? ""} placeholder="ex.: Facas, Mentir, Pistolas…"
                        onChange={(e) => setSpec(n, e.target.value)} />
                      <button type="button" className="ghost" title="Remover especialização" aria-label="Remover"
                        onClick={() => dropSpec(n)} style={{ padding: "2px 8px", color: "var(--err)" }}>✕</button>
                    </div>
                  ))}
                  {addable.length > 0 && (
                    <select data-testid="spec-add" value="" style={{ marginTop: 8, maxWidth: 320 }}
                      onChange={(e) => { const v = e.target.value; if (v) setAddedSpecs((xs) => (xs.includes(v) ? xs : [...xs, v])); }}>
                      <option value="">+ especializar outra perícia…</option>
                      {addable.map((n) => <option key={n} value={n}>{label(n)}</option>)}
                    </select>
                  )}
                </div>
              );
            })()}
          </section>
        )}

        {/* 5 · DISCIPLINAS */}
        {cur === "disciplinas" && (
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <h3 style={{ margin: 0 }}>Disciplinas</h3>
              {catalog && selectedClan && (
                <button type="button" className="secondary" onClick={loadClanDisciplines}>+ Disciplinas do clã ({selectedClan.label})</button>
              )}
            </div>
            {!canHaveClan && <p className="muted">Mortais não têm disciplinas.</p>}
            {canHaveClan && (
              <>
                <p className="muted" style={{ fontSize: 13 }}>Na criação: 2 disciplinas do clã (2 pontos numa, 1 noutra). Cada disciplina pode ter vários poderes (um por nível). Adicione quantos quiser.</p>
                <div data-testid="disciplines-list" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {disciplines.map((d, i) => (
                    <div key={i} className="disc-block" data-testid="discipline-row">
                      <div className="disc-head-row">
                        <input aria-label="disciplina" placeholder="Disciplina" value={d.name}
                          onChange={(e) => updDisc(i, { name: e.target.value })} />
                        <DotsOnly value={d.level} max={5} disabled={locked} onChange={(lv) => updDisc(i, { level: lv })} />
                        <button type="button" className="secondary" aria-label="remover disciplina"
                          onClick={() => setDisc(disciplines.filter((_, j) => j !== i))}>✕</button>
                      </div>
                      <div className="disc-powers">
                        {d.powers.length === 0 && <p className="muted" style={{ fontSize: 12, margin: "0 0 6px" }}>Sem poderes. Adicione abaixo ou pelo catálogo.</p>}
                        {d.powers.map((p, pi) => (
                          <div key={pi} className="power-row" data-testid="power-row">
                            <select aria-label="nível do poder" value={p.level}
                              onChange={(e) => updPower(i, pi, { level: Number(e.target.value) })}>
                              {[1, 2, 3, 4, 5].map((lv) => <option key={lv} value={lv}>•{lv}</option>)}
                            </select>
                            <input aria-label="poder" placeholder="Nome do poder (ex.: Sentir o Inimigo)" value={p.name}
                              onChange={(e) => updPower(i, pi, { name: e.target.value })} />
                            <button type="button" className="secondary" aria-label="remover poder"
                              onClick={() => delPower(i, pi)}>✕</button>
                          </div>
                        ))}
                        <button type="button" className="ghost" style={{ padding: "2px 8px", marginTop: 4 }}
                          onClick={() => addPower(i)}>+ Poder</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" className="secondary" style={{ marginTop: 10 }}
                  onClick={() => setDisc([...disciplines, { name: "", level: 1, powers: [] }])}>+ Disciplina</button>

                {catalog?.disciplines && catalog.disciplines.length > 0 && (
                  <DisciplineCatalog
                    list={catalog.disciplines}
                    onAdd={(name) => {
                      if (disciplines.some((d) => norm(d.name) === norm(name))) return;
                      setDisc([...disciplines, { name, level: 1, powers: [] }]);
                    }}
                    onAddPower={addCatalogPower} />
                )}
              </>
            )}
          </section>
        )}

        {/* 6 · VANTAGENS & DEFEITOS */}
        {cur === "vantagens" && (
          <section>
            <h3>Vantagens & Antecedentes <Budget used={sumDots(advantages)} max={7} /></h3>
            <AdvantageEditor items={advantages} testid="advantages" onChange={(v) => set("advantages", v)}
              ph="ex.: Refúgio, Aliados, Recursos, Mawla…" options={catalog?.advantages} />
            <h3 style={{ marginTop: "1.1rem" }}>Defeitos <Budget used={sumDots(flaws)} max={2} /> <span className="muted" style={{ fontSize: ".8rem" }}>(+ os do predador)</span></h3>
            <AdvantageEditor items={flaws} testid="flaws" onChange={(v) => set("flaws", v)}
              ph="ex.: Inimigo, Suspeito, Presa Restrita…" options={catalog?.flaws} />
          </section>
        )}

        {/* 7 · CONVICÇÕES & PILARES */}
        {cur === "conviccoes" && (
          <section>
            <div className="grid2" style={{ maxWidth: 300, marginBottom: ".8rem" }}>
              <div>
                <label htmlFor="sheet-humanity">Humanidade (0–10)</label>
                <input id="sheet-humanity" data-testid="sheet-humanity" type="number" min={0} max={10}
                  value={(sheet.humanity as number) ?? 7} onChange={(e) => setTop("humanity", Number(e.target.value))} />
              </div>
            </div>
            <h3>Convicções <span className="muted" style={{ fontSize: ".8rem" }}>(1 a 3)</span></h3>
            <StringList items={convictions} onChange={(v) => set("convictions", v)} ph="ex.: Nunca abandono um aliado" max={3} />
            <h3 style={{ marginTop: "1.1rem" }}>Pilares (Touchstones)</h3>
            <p className="muted" style={{ fontSize: 13 }}>Cada Pilar conectado a uma Convicção — pessoas que te prendem à Humanidade.</p>
            <StringList items={touchstones} onChange={(v) => set("touchstones", v)} ph="ex.: Maria, sua irmã mortal" />
          </section>
        )}

        {/* 7.5 · ESTADO (trilhas de dano) */}
        {cur === "estado" && (
          <section>
            <h3>Estado <span className="muted" style={{ fontSize: ".8rem" }}>(marque o dano durante o jogo)</span></h3>
            <div className="trait-cols">
              <div className="trait-col">
                <DamageTrack label="Vitalidade" max={vitMax} sup={healthDmg.sup} agg={healthDmg.agg}
                  onChange={(s, a) => setTop("healthDmg", { sup: s, agg: a })} />
                <p className="muted" style={{ fontSize: 12, margin: 0 }}>Vitalidade = Vigor + 3. Superficial cura por noite; Agravado é grave.</p>
              </div>
              <div className="trait-col">
                <DamageTrack label="Força de Vontade" max={wpMax} sup={wpDmg.sup} agg={wpDmg.agg}
                  onChange={(s, a) => setTop("wpDmg", { sup: s, agg: a })} />
                <p className="muted" style={{ fontSize: 12, margin: 0 }}>FdV = Autocontrole + Determinação.</p>
              </div>
            </div>
            <div className="grid2" style={{ maxWidth: 320, marginTop: 12 }}>
              <div>
                <label>Fome (0–5)</label>
                <input type="number" min={0} max={5} value={(sheet.hunger as number) ?? 0}
                  onChange={(e) => setTop("hunger", Number(e.target.value))} />
              </div>
              <div>
                <label>Humanidade (0–10)</label>
                <input type="number" min={0} max={10} value={(sheet.humanity as number) ?? 7}
                  onChange={(e) => setTop("humanity", Number(e.target.value))} />
              </div>
              <div>
                <label>Manchas (0–10)</label>
                <input type="number" min={0} max={10} value={(sheet.stains as number) ?? 0}
                  onChange={(e) => setTop("stains", Number(e.target.value))} />
              </div>
            </div>

            <XpPanel
              sheet={sheet}
              onSheet={onChange}
              attrList={attributes.map((n) => ({ key: n, label: titleCase(n), value: attrs[n] ?? 0 }))}
              skillList={skills.map((n) => ({ key: n, label: skillMeta.get(norm(n))?.label ?? titleCase(n), value: skillVals[n] ?? 0 }))}
              clanDiscs={(sheet.clanDisciplines as string[]) ?? []}
            />
          </section>
        )}

        {/* 8 · EQUIPAMENTO */}
        {cur === "equipamento" && (
          <section>
            <h3>Equipamento & Armas</h3>
            <div data-testid="weapons-list">
              {weapons.map((w, i) => (
                <div key={i} className="weapon-row" data-testid="weapon-row">
                  <input aria-label="arma" placeholder="Arma / item" value={w.name}
                    onChange={(e) => set("weapons", weapons.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                  <input aria-label="dano" placeholder="Dano / notas" value={w.damage}
                    onChange={(e) => set("weapons", weapons.map((x, j) => j === i ? { ...x, damage: e.target.value } : x))} />
                  <button type="button" className="secondary" onClick={() => set("weapons", weapons.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
            </div>
            <button type="button" className="secondary" style={{ marginTop: 8 }}
              onClick={() => set("weapons", [...weapons, { name: "", damage: "" }])}>+ Adicionar arma/item</button>

            <h3 style={{ marginTop: "1.4rem" }}>Inventário <span className="muted" style={{ fontSize: ".8rem" }}>(itens que o personagem carrega)</span></h3>
            <InventoryEditor items={inventory} onChange={(v) => set("inventory", v)} />
          </section>
        )}

        {/* 8.5 · NOTAS — anotações livres do jogador */}
        {cur === "notas" && (
          <section data-testid="notes-section">
            <h3>Anotações <span className="muted" style={{ fontSize: ".8rem" }}>(suas notas livres — segredos, contatos, objetivos)</span></h3>
            <textarea data-testid="sheet-notes" value={str(sheet.notes)} rows={14}
              placeholder="Anote o que quiser sobre a crônica, pistas, NPCs, planos…"
              style={{ fontFamily: "var(--ui)", minHeight: 0, lineHeight: 1.6 }}
              onChange={(e) => set("notes", e.target.value)} />
            <h3 style={{ marginTop: "1.1rem" }}>Diário de sessão</h3>
            <StringList items={(sheet.journal as string[]) ?? []} onChange={(v) => set("journal", v)}
              ph="ex.: Sessão 3 — fizemos um pacto com o Príncipe" />
          </section>
        )}

        {/* 9 · REVISÃO — ficha completa */}
        {cur === "revisao" && (
          <section className="review">
            <h3>Ficha completa</h3>
            <div className="review-grid">
              <div className="panel" style={{ margin: 0 }}>
                <Kv k="Tipo" v={titleCase(type)} />
                <Kv k="Clã" v={selectedClan?.label || clanId || "—"} />
                <Kv k="Conceito" v={str(sheet.concept) || "—"} />
                <Kv k="Senhor" v={str(sheet.sire) || "—"} />
                <Kv k="Geração / P. Sangue" v={`${str(sheet.generation) || "—"} / ${str(sheet.bloodPotency) || "—"}`} />
                <Kv k="Predador" v={str(sheet.predatorType) || "—"} />
                <Kv k="Ambição" v={str(sheet.ambition) || "—"} />
                <Kv k="Desejo" v={str(sheet.desire) || "—"} />
                <Kv k="Humanidade" v={String((sheet.humanity as number) ?? 7)} />
                <Kv k="Fome" v={String((sheet.hunger as number) ?? 0)} />
              </div>
              {attributes.length >= 3 && <AttributeRadial names={attributes} values={attrs} pentagram={!!catalog} />}
            </div>

            {(str(sheet.appearance) || str(sheet.personality) || str(sheet.history)) && (
              <div className="panel" style={{ marginTop: 14 }}>
                {str(sheet.appearance) && <><span className="kv-label">Aparência</span><p>{str(sheet.appearance)}</p></>}
                {str(sheet.personality) && <><span className="kv-label">Personalidade</span><p>{str(sheet.personality)}</p></>}
                {str(sheet.history) && <><span className="kv-label">História</span><p style={{ whiteSpace: "pre-wrap" }}>{str(sheet.history)}</p></>}
              </div>
            )}

            <div className="review-grid" style={{ marginTop: 14 }}>
              <ReviewTraits title="Atributos" names={attributes} values={attrs} label={titleCase} />
              <ReviewTraits title="Perícias" names={skills} values={skillVals} label={(n) => skillMeta.get(norm(n))?.label ?? titleCase(n)} />
            </div>

            {disciplines.length > 0 && (
              <div className="panel" style={{ marginTop: 14 }}>
                <span className="kv-label">Disciplinas</span>
                {disciplines.map((d, i) => (
                  <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ fontWeight: 600 }}>{d.name || "—"} <span style={{ color: "var(--accent)" }}>{"●".repeat(d.level)}</span></div>
                    {d.powers.length > 0 && (
                      <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                        {d.powers.map((p) => `${p.level ? `•${p.level} ` : ""}${p.name}`).join(" · ")}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {(advantages.length > 0 || flaws.length > 0) && (
              <div className="review-grid" style={{ marginTop: 14 }}>
                <ReviewList title="Vantagens" items={advantages} />
                <ReviewList title="Defeitos" items={flaws} />
              </div>
            )}

            {(convictions.length > 0 || touchstones.length > 0) && (
              <div className="review-grid" style={{ marginTop: 14 }}>
                <div className="panel" style={{ margin: 0 }}><span className="kv-label">Convicções</span>
                  <ul style={{ margin: ".3rem 0 0", paddingLeft: 18 }}>{convictions.map((c, i) => <li key={i}>{c}</li>)}</ul></div>
                <div className="panel" style={{ margin: 0 }}><span className="kv-label">Pilares</span>
                  <ul style={{ margin: ".3rem 0 0", paddingLeft: 18 }}>{touchstones.map((t, i) => <li key={i}>{t}</li>)}</ul></div>
              </div>
            )}

            {inventory.length > 0 && (
              <div className="panel" style={{ marginTop: 14 }}>
                <span className="kv-label">Inventário</span>
                {inventory.map((it, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "3px 0" }}>
                    <span>{it.qty > 1 ? `${it.qty}× ` : ""}{it.name || "—"} {it.equipped ? <span className="badge buff" style={{ fontSize: 11 }}>equip.</span> : null}</span>
                    <span className="muted" style={{ fontSize: 13 }}>{it.category}{it.desc ? ` · ${it.desc}` : ""}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="muted" style={{ marginTop: 14 }}>Confira e clique em <b>Salvar ficha</b> abaixo. Derivados recalculam no servidor.</p>
          </section>
        )}
      </div>

      <div className="step-nav">
        <button type="button" className="secondary" data-testid="step-prev" disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}>← Voltar</button>
        <span className="muted" style={{ fontSize: ".85rem" }}>Etapa {step + 1} de {steps.length} · {steps[step].label}</span>
        <button type="button" data-testid="step-next" disabled={step === steps.length - 1}
          onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>Próximo →</button>
      </div>

      <div className="sheet-foot">
        <div className="stat-pill"><span className="kv-label">Vitalidade</span>
          <span className="badge stat" data-testid="derived-vitality">{derived.vitality ?? "—"}</span></div>
        <div className="stat-pill"><span className="kv-label">Força de Vontade</span>
          <span className="badge stat" data-testid="derived-willpower">{derived.willpower ?? "—"}</span></div>
        {clanDisc.length > 0 && (
          <span className="muted" data-testid="clan-disciplines">
            Disciplinas de clã: {clanDisc.join(", ")}
            {sheet.compulsion ? ` · Compulsão: ${String(sheet.compulsion)}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}

// --- subcomponentes ----------------------------------------------------------

function DisciplineCatalog({ list, onAdd, onAddPower }: {
  list: NonNullable<V5Catalog["disciplines"]>; onAdd: (name: string) => void;
  onAddPower: (discipline: string, power: string, level: number) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="sheet-section" data-testid="discipline-catalog">
      <h3>Todas as disciplinas <span className="muted" style={{ fontSize: ".8rem" }}>(clique para ver o que faz)</span></h3>
      <div className="disc-cat">
        {list.map((d) => {
          const isOpen = open === d.name;
          const byLevel = groupBy(d.powers, (p) => String(p.level));
          return (
            <div key={d.name} className={`disc-item${isOpen ? " on" : ""}`}>
              <button type="button" className="disc-head" data-testid={`disc-cat-${d.name}`}
                onClick={() => setOpen(isOpen ? null : d.name)}>
                <span>{d.name}</span>
                <span className="muted" style={{ fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
              </button>
              {isOpen && (
                <div className="disc-detail">
                  <p className="muted" style={{ margin: "0 0 8px" }}>{d.summary}</p>
                  {Object.entries(byLevel).sort((a, b) => Number(a[0]) - Number(b[0])).map(([lvl, powers]) => (
                    <div key={lvl} style={{ display: "flex", gap: 8, padding: "3px 0", alignItems: "flex-start" }}>
                      <span className="badge" style={{ minWidth: 28, justifyContent: "center" }}>•{lvl}</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1 }}>
                        {powers.map((p) => (
                          <button key={p.name} type="button" className="badge" style={{ cursor: "pointer" }}
                            title="Adicionar este poder à ficha"
                            onClick={() => onAddPower(d.name, p.name, Number(lvl))}>+ {p.name}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <p className="muted" style={{ fontSize: 12, margin: "8px 0 0" }}>
                    Clique num poder para adicioná-lo à ficha. Texto completo: pergunte no <b>Chat (IA)</b> da campanha.
                  </p>
                  <button type="button" className="secondary" style={{ marginTop: 8 }}
                    onClick={() => onAdd(d.name)}>+ Adicionar disciplina (vazia)</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BloodPotencyEffects({ catalog, potency }: { catalog?: V5Catalog | null; potency: number }) {
  const bp = catalog?.bloodPotency?.find((b) => b.potency === potency);
  if (!bp || Number.isNaN(potency)) return null;
  const items: [string, string][] = [
    ["Surto de Sangue", `+${bp.bloodSurge}`],
    ["Bônus de Disciplina", `+${bp.disciplineBonus}`],
    ["Rerrolar Rouse até", bp.rouseReroll > 0 ? `nível ${bp.rouseReroll}` : "—"],
    ["Gravidade da Perdição", String(bp.baneSeverity)],
    ["Cura por Rouse", String(bp.mendingRouse)],
  ];
  return (
    <div className="panel" style={{ margin: "10px 0 0" }} data-testid="blood-potency-effects">
      <span className="kv-label">Potência de Sangue {potency} · efeitos</span>
      <div className="chips" style={{ marginTop: 8 }}>
        {items.map(([k, v]) => (
          <span key={k} className="badge" style={{ gap: 6 }}>{k}: <b style={{ color: "var(--accent)" }}>{v}</b></span>
        ))}
      </div>
    </div>
  );
}

function sumDots(items: { dots: number }[]): number {
  return items.reduce((a, b) => a + (b.dots || 0), 0);
}

// Geração → Potência de Sangue inicial (tabela por geração do livro).
function genToBloodPotency(gen: number): number {
  if (!gen || gen >= 14) return 0;
  if (gen >= 12) return 1;
  if (gen >= 10) return 2;
  if (gen >= 8) return 3;
  if (gen >= 6) return 4;
  if (gen >= 4) return 5;
  return 6;
}

function Budget({ used, max }: { used: number; max: number }) {
  const ok = used === max;
  return <span className={`budget ${ok ? "ok" : "warn"}`}>{used}/{max} pts {ok ? "✓" : ""}</span>;
}

function AttrBudget({ attributes, attrs }: { attributes: string[]; attrs: Record<string, number> }) {
  // alvo da criação: um 4, três 3, quatro 2, um 1 (9 atributos)
  const target: Record<number, number> = { 4: 1, 3: 3, 2: 4, 1: 1 };
  const have: Record<number, number> = { 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const n of attributes) { const v = attrs[n] ?? 0; if (have[v] !== undefined) have[v]++; }
  return (
    <div className="chips" style={{ margin: "0 0 10px" }}>
      {[4, 3, 2, 1].map((v) => {
        const ok = have[v] === target[v];
        return <span key={v} className={`budget ${ok ? "ok" : "warn"}`} style={{ padding: "3px 8px", border: "1px solid var(--border)", borderRadius: 999 }}>
          {have[v]}/{target[v]} com {v} {ok ? "✓" : "⚠"}</span>;
      })}
    </div>
  );
}

function CatalogSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { name: string; detail: string }[];
}) {
  const sel = options.find((o) => o.name === value);
  return (
    <div>
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ marginTop: 7 }}>
        <option value="">—</option>
        {options.map((o) => <option key={o.name} value={o.name}>{o.name}</option>)}
      </select>
      {sel && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{sel.detail}</div>}
    </div>
  );
}

type XpAction = "attributes" | "skills" | "discipline" | "bloodPotency" | "specialty" | "free";
type TraitOpt = { key: string; label: string; value: number };

/**
 * XP interativo: escolhe a ação (subir atributo/perícia/disciplina/potência, nova
 * especialização, ou gasto livre), calcula o custo pelo livro, confirma, e aplica no
 * traço + registra no histórico. Cada gasto guarda o valor anterior para DESFAZER
 * (reverte o traço e devolve o XP). Trava se o custo passa do disponível.
 */
function XpPanel({ sheet, onSheet, attrList, skillList, clanDiscs }: {
  sheet: Sheet; onSheet: (next: Sheet) => void;
  attrList: TraitOpt[]; skillList: TraitOpt[]; clanDiscs: string[];
}) {
  const xp: Xp = (sheet.xp as Xp) ?? { total: 0, entries: [] };
  const entries = xp.entries ?? [];
  const spent = entries.reduce((a, e) => a + (e.cost || 0), 0);
  const available = (xp.total || 0) - spent;
  const discList = normDisciplines(sheet.disciplines);
  const bp = Number(sheet.bloodPotency) || 0;

  const [action, setAction] = useState<XpAction>("attributes");
  const [target, setTarget] = useState("");
  const [specName, setSpecName] = useState("");
  const [freeDesc, setFreeDesc] = useState("");
  const [freeCost, setFreeCost] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  type Plan = { label: string; cost: number; apply: () => { next: Sheet; undo: XpUndo } };
  function plan(): Plan | null {
    if (action === "attributes" || action === "skills") {
      const list = action === "attributes" ? attrList : skillList;
      const t = list.find((x) => x.key === target);
      if (!t || t.value >= 5) return null;
      const to = t.value + 1;
      const cost = to * (action === "attributes" ? 5 : 3);
      return { label: `${t.label} ${t.value}→${to}`, cost, apply: () => ({
        next: { ...sheet, [action]: { ...((sheet[action] as Record<string, number>) ?? {}), [t.key]: to } },
        undo: { group: action, key: t.key, prev: t.value },
      }) };
    }
    if (action === "discipline") {
      const d = discList.find((x) => x.name === target);
      if (!d || d.level >= 5) return null;
      const to = d.level + 1;
      const isClan = clanDiscs.includes(d.name);
      const cost = to * (isClan ? 5 : 7);
      return { label: `${d.name} ${d.level}→${to}${isClan ? " (clã)" : ""}`, cost, apply: () => ({
        next: { ...sheet, disciplines: discList.map((x) => (x.name === d.name ? { ...x, level: to } : x)) },
        undo: { group: "discipline", key: d.name, prev: d.level },
      }) };
    }
    if (action === "bloodPotency") {
      if (bp >= 6) return null;
      const to = bp + 1;
      return { label: `Potência de Sangue ${bp}→${to}`, cost: to * 10, apply: () => ({
        next: { ...sheet, bloodPotency: to },
        undo: { group: "bloodPotency", prev: bp },
      }) };
    }
    if (action === "specialty") {
      const t = skillList.find((x) => x.key === target);
      if (!t || !specName.trim()) return null;
      const specs = (sheet.specialties as Record<string, string>) ?? {};
      const prev = specs[t.key] ?? "";
      const nextVal = prev ? `${prev}, ${specName.trim()}` : specName.trim();
      return { label: `Especialização — ${t.label}: ${specName.trim()}`, cost: 3, apply: () => ({
        next: { ...sheet, specialties: { ...specs, [t.key]: nextVal } },
        undo: { group: "specialty", key: t.key, prev },
      }) };
    }
    return null;
  }

  const p = action === "free" ? null : plan();

  function spend() {
    setErr(null);
    if (action === "free") {
      if (!freeDesc.trim() || freeCost <= 0) { setErr("Preencha descrição e custo."); return; }
      if (freeCost > available) { setErr(`XP insuficiente: custa ${freeCost}, você tem ${available}.`); return; }
      onSheet({ ...sheet, xp: { ...xp, entries: [...entries, { id: crypto.randomUUID(), desc: freeDesc.trim(), cost: freeCost }] } });
      setFreeDesc(""); setFreeCost(0);
      return;
    }
    if (!p) { setErr("Escolha um alvo válido (ou já está no máximo)."); return; }
    if (p.cost > available) { setErr(`XP insuficiente: custa ${p.cost}, você tem ${available}.`); return; }
    const msg = action === "specialty"
      ? `Esta ação vai custar ${p.cost} de XP e adicionar "${specName.trim()}". Tem certeza?`
      : `Esta ação vai custar ${p.cost} de XP e realizar "${p.label}". Tem certeza?`;
    if (!confirm(msg)) return;
    const { next, undo } = p.apply();
    onSheet({ ...next, xp: { ...xp, entries: [...entries, { id: crypto.randomUUID(), desc: p.label, cost: p.cost, undo }] } });
    setTarget(""); setSpecName("");
  }

  function undoEntry(e: XpEntry) {
    let next: Sheet = sheet;
    const u = e.undo;
    if (u) {
      if (u.group === "attributes" || u.group === "skills") {
        next = { ...next, [u.group]: { ...((next[u.group] as Record<string, number>) ?? {}), [u.key]: u.prev } };
      } else if (u.group === "bloodPotency") {
        next = { ...next, bloodPotency: u.prev };
      } else if (u.group === "discipline") {
        next = { ...next, disciplines: normDisciplines(next.disciplines).map((x) => (x.name === u.key ? { ...x, level: u.prev } : x)) };
      } else if (u.group === "specialty") {
        const specs = { ...((next.specialties as Record<string, string>) ?? {}) };
        if (u.prev) specs[u.key] = u.prev; else delete specs[u.key];
        next = { ...next, specialties: specs };
      }
    }
    onSheet({ ...next, xp: { ...xp, entries: entries.filter((x) => x !== e) } });
  }

  const needsTarget = action === "attributes" || action === "skills" || action === "discipline" || action === "specialty";
  const targetOpts = action === "discipline"
    ? discList.map((d) => ({ key: d.name, label: `${d.name} (${d.level})` }))
    : (action === "attributes" ? attrList : skillList).map((t) => ({ key: t.key, label: `${t.label} (${t.value})` }));

  return (
    <div className="sheet-section" data-testid="xp-panel">
      <h3 style={{ fontSize: "1rem" }}>Experiência (XP)</h3>
      <div className="row" style={{ alignItems: "center", maxWidth: 520 }}>
        <div style={{ maxWidth: 140 }}>
          <label>Total ganho</label>
          <input type="number" min={0} data-testid="xp-total" value={xp.total || 0}
            onChange={(e) => onSheet({ ...sheet, xp: { ...xp, total: Number(e.target.value) } })} />
        </div>
        <span className="badge" style={{ alignSelf: "center" }}>Gasto: {spent}</span>
        <span data-testid="xp-available" className={`budget ${available < 0 ? "warn" : "ok"}`}
          style={{ alignSelf: "center", padding: "5px 10px", border: "1px solid var(--border)", borderRadius: 999, color: available < 0 ? "var(--err)" : "var(--ok)" }}>
          Disponível: {available}
        </span>
      </div>

      {/* Gastar XP (interativo) */}
      <div className="panel" style={{ margin: "12px 0 0", padding: 14 }}>
        <div className="kv-label" style={{ marginBottom: 8 }}>Gastar XP</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select data-testid="xp-action" value={action} onChange={(e) => { setAction(e.target.value as XpAction); setTarget(""); setErr(null); }} style={{ maxWidth: 210 }}>
            <option value="attributes">Aumentar atributo (×5)</option>
            <option value="skills">Aumentar perícia (×3)</option>
            <option value="discipline">Aumentar disciplina (clã ×5 / outra ×7)</option>
            <option value="bloodPotency">Potência de Sangue (×10)</option>
            <option value="specialty">Nova especialização (3)</option>
            <option value="free">Gasto livre</option>
          </select>
          {needsTarget && (
            <select data-testid="xp-target" value={target} onChange={(e) => setTarget(e.target.value)} style={{ maxWidth: 210 }}>
              <option value="">escolher…</option>
              {targetOpts.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          )}
          {action === "specialty" && (
            <input data-testid="xp-spec-name" value={specName} placeholder="nome da especialização"
              onChange={(e) => setSpecName(e.target.value)} style={{ maxWidth: 200 }} />
          )}
          {action === "free" && (
            <>
              <input data-testid="xp-free-desc" value={freeDesc} placeholder="descrição" onChange={(e) => setFreeDesc(e.target.value)} style={{ maxWidth: 200 }} />
              <input data-testid="xp-free-cost" type="number" min={0} value={freeCost} placeholder="custo" onChange={(e) => setFreeCost(Number(e.target.value))} style={{ maxWidth: 90 }} />
            </>
          )}
          <button type="button" data-testid="xp-spend" onClick={spend}>
            Gastar{p ? ` ${p.cost} XP` : action === "free" && freeCost > 0 ? ` ${freeCost} XP` : ""}
          </button>
        </div>
        {p && p.cost > available && <p className="muted" style={{ color: "var(--err)", fontSize: 12, margin: "8px 0 0" }}>Custa {p.cost}, você tem {available}.</p>}
        {err && <p className="error" data-testid="xp-error" style={{ margin: "8px 0 0" }}>⚠ {err}</p>}
      </div>

      {/* Histórico com desfazer */}
      {entries.length > 0 && (
        <div style={{ marginTop: 12 }} data-testid="xp-log">
          <div className="kv-label" style={{ marginBottom: 6 }}>Histórico de gastos</div>
          {entries.map((e) => (
            <div key={e.id ?? e.desc} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ flex: 1, fontSize: 14 }}>{e.desc}</span>
              <span className="mono" style={{ color: "var(--err)" }}>−{e.cost}</span>
              <button type="button" className="ghost" data-testid={`xp-undo-${e.id ?? ""}`} onClick={() => undoEntry(e)} style={{ padding: "2px 8px" }}>desfazer</button>
            </div>
          ))}
        </div>
      )}

      <details style={{ marginTop: 12 }}>
        <summary className="muted" style={{ fontSize: 13, cursor: "pointer" }}>Tabela de custos (livro)</summary>
        <div style={{ marginTop: 8 }}>
          {XP_COSTS.map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "2px 0", borderBottom: "1px solid var(--border)" }}>
              <span>{k}</span><span className="mono muted">{v}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function PredatorField({ catalog, value, onChange, disabled }: {
  catalog?: V5Catalog | null; value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  const list = catalog?.predatorTypes;
  const sel = list?.find((p) => p.name === value);
  if (!list || list.length === 0) {
    return <Field label="Tipo de Predador" v={value} on={onChange} disabled={disabled} ph="ex.: Gatuno, Sereia…" />;
  }
  return (
    <div>
      <label>Tipo de Predador</label>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} style={{ marginTop: 7 }}>
        <option value="">—</option>
        {list.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
      </select>
      {sel && (
        <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
          {sel.summary} · aumenta <b style={{ color: "var(--accent)" }}>{sel.disciplines.join(" ou ")}</b>
        </div>
      )}
    </div>
  );
}

function Field({ label, v, on, ph, type = "text", disabled }: {
  label: string; v: string; on: (v: string) => void; ph?: string; type?: string; disabled?: boolean;
}) {
  return (
    <div>
      <label>{label}</label>
      <input type={type} value={v} placeholder={ph} disabled={disabled} onChange={(e) => on(e.target.value)} />
    </div>
  );
}

function Area({ label, v, on, rows = 3 }: { label: string; v: string; on: (v: string) => void; rows?: number }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label>{label}</label>
      <textarea value={v} rows={rows} style={{ fontFamily: "var(--ui)", minHeight: 0 }}
        onChange={(e) => on(e.target.value)} />
    </div>
  );
}

function DotRating({ value, max, min, onChange, testid, name, disabled }: {
  value: number | ""; max: number; min: number; onChange: (raw: string) => void;
  testid: string; name: string; disabled?: boolean;
}) {
  const v = typeof value === "number" ? value : 0;
  return (
    <div className="trait-row">
      <span className="trait-name">{name}</span>
      <span className="dots">
        {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
          <button key={i} type="button" tabIndex={-1} aria-label={`${name} ${i}`}
            className={`dot${v >= i ? " on" : ""}`}
            style={disabled ? { cursor: "not-allowed" } : undefined}
            onClick={() => { if (!disabled) onChange(String(v === i ? i - 1 : i)); }} />
        ))}
      </span>
      <input className="num" type="number" min={min} max={max} data-testid={testid} aria-label={name}
        value={value} readOnly={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function DotsOnly({ value, max, onChange, disabled }: {
  value: number; max: number; onChange: (v: number) => void; disabled?: boolean;
}) {
  return (
    <span className="dots">
      {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
        <button key={i} type="button" tabIndex={-1} className={`dot${value >= i ? " on" : ""}`}
          style={disabled ? { cursor: "not-allowed" } : undefined}
          onClick={() => { if (!disabled) onChange(value === i ? i - 1 : i); }} />
      ))}
    </span>
  );
}

function AdvantageEditor({ items, onChange, ph, testid, options }: {
  items: Advantage[]; onChange: (v: Advantage[]) => void; ph?: string; testid: string; options?: MeritView[];
}) {
  const listId = `${testid}-opts`;
  // Agrupa as opções pelas categorias do livro (Antecedentes, Aparência, Alimentação…),
  // preservando a ordem em que aparecem no catálogo.
  const groups: { name: string; opts: MeritView[] }[] = [];
  for (const o of options ?? []) {
    let g = groups.find((x) => x.name === o.group);
    if (!g) { g = { name: o.group, opts: [] }; groups.push(g); }
    g.opts.push(o);
  }
  return (
    <div data-testid={testid}>
      {options && options.length > 0 && (
        <>
          <datalist id={listId}>{options.map((o) => <option key={o.name} value={o.name} />)}</datalist>
          <div className="merit-picker">
            {groups.map((g) => (
              <div key={g.name} className="merit-group">
                <span className="merit-group-label">{g.name}</span>
                <div className="chips">
                  {g.opts.map((o) => (
                    <button key={o.name} type="button" className="badge merit-chip" style={{ cursor: "pointer" }}
                      title={o.hint ? `${o.name} — ${o.hint} ponto(s)` : o.name}
                      onClick={() => onChange([...items, { name: o.name, dots: 1, note: "" }])}>
                      + {o.name}{o.hint ? <span className="merit-hint">{o.hint}</span> : null}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {items.map((a, i) => (
        <div key={i} className="disc-row">
          <input aria-label="nome" placeholder={ph} value={a.name} list={listId}
            onChange={(e) => onChange(items.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
          <DotsOnly value={a.dots} max={5} onChange={(d) => onChange(items.map((x, j) => j === i ? { ...x, dots: d } : x))} />
          <input aria-label="nota" placeholder="nota" value={a.note}
            onChange={(e) => onChange(items.map((x, j) => j === i ? { ...x, note: e.target.value } : x))} />
          <button type="button" className="secondary" onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button type="button" className="secondary" style={{ marginTop: 8 }}
        onClick={() => onChange([...items, { name: "", dots: 1, note: "" }])}>+ Adicionar</button>
    </div>
  );
}

function InventoryEditor({ items, onChange }: { items: Item[]; onChange: (v: Item[]) => void }) {
  const upd = (i: number, patch: Partial<Item>) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  return (
    <div data-testid="inventory-list">
      {items.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Nenhum item ainda. Adicione abaixo.</p>}
      {items.map((it, i) => (
        <div key={i} className="inv-row" data-testid="inventory-row">
          <input aria-label="item" placeholder="Item" value={it.name}
            onChange={(e) => upd(i, { name: e.target.value })} />
          <input aria-label="quantidade" type="number" min={1} value={it.qty || 1}
            onChange={(e) => upd(i, { qty: Math.max(1, Number(e.target.value) || 1) })} />
          <select aria-label="categoria" value={it.category || "Equipamento"}
            onChange={(e) => upd(i, { category: e.target.value })}>
            {ITEM_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input aria-label="descrição" placeholder="notas / efeito" value={it.desc}
            onChange={(e) => upd(i, { desc: e.target.value })} />
          <label className="inv-eq" title="Item equipado / em uso">
            <input type="checkbox" checked={!!it.equipped} onChange={(e) => upd(i, { equipped: e.target.checked })} /> equip.
          </label>
          <button type="button" className="secondary" aria-label="remover item"
            onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button type="button" className="secondary" style={{ marginTop: 8 }}
        onClick={() => onChange([...items, { name: "", qty: 1, category: "Equipamento", desc: "", equipped: false }])}>
        + Adicionar item
      </button>
    </div>
  );
}

function StringList({ items, onChange, ph, max }: {
  items: string[]; onChange: (v: string[]) => void; ph?: string; max?: number;
}) {
  return (
    <div>
      {items.map((s, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
          <input value={s} placeholder={ph} onChange={(e) => onChange(items.map((x, j) => j === i ? e.target.value : x))} />
          <button type="button" className="secondary" onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      {(max === undefined || items.length < max) && (
        <button type="button" className="secondary" onClick={() => onChange([...items, ""])}>+ Adicionar</button>
      )}
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

function ReviewTraits({ title, names, values, label }: {
  title: string; names: string[]; values: Record<string, number>; label: (n: string) => string;
}) {
  const filled = names.filter((n) => (values[n] ?? 0) > 0);
  return (
    <div className="panel" style={{ margin: 0 }}>
      <span className="kv-label">{title}</span>
      <div style={{ marginTop: 6 }}>
        {filled.length === 0 && <span className="muted">—</span>}
        {filled.map((n) => (
          <div key={n} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
            <span>{label(n)}</span><span style={{ color: "var(--accent)" }}>{"●".repeat(values[n])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewList({ title, items }: { title: string; items: Advantage[] }) {
  return (
    <div className="panel" style={{ margin: 0 }}>
      <span className="kv-label">{title}</span>
      <div style={{ marginTop: 6 }}>
        {items.length === 0 && <span className="muted">—</span>}
        {items.map((a, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "2px 0" }}>
            <span>{a.name || "—"} {"●".repeat(a.dots)}</span>
            <span className="muted" style={{ fontSize: 13 }}>{a.note}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- helpers -----------------------------------------------------------------

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
