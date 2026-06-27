"use client";

import { useMemo, useState } from "react";
import type { SchemaShape, V5Catalog, ClanView } from "@/lib/api";

type Sheet = Record<string, unknown>;
type Weapon = { name: string; damage: string };
type Discipline = { name: string; level: number; powers: string };
type Advantage = { name: string; dots: number; note: string };

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
  const disciplines = (sheet.disciplines as Discipline[]) ?? [];
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

  const steps: { key: string; label: string }[] = [
    { key: "cla", label: "Clã" },
    { key: "conceito", label: "Conceito & Lore" },
    { key: "atributos", label: "Atributos" },
    { key: "pericias", label: "Perícias" },
    { key: "disciplinas", label: "Disciplinas" },
    { key: "vantagens", label: "Vantagens & Defeitos" },
    { key: "conviccoes", label: "Convicções & Pilares" },
    { key: "equipamento", label: "Equipamento" },
    { key: "revisao", label: "Revisão" },
  ];
  const [step, setStep] = useState(0);
  const [infoClan, setInfoClan] = useState<string | null>(null);
  const cur = steps[step].key;
  // detalhe exibido: o clã que está com o (i) aberto, senão o selecionado
  const detailClan: ClanView | undefined = catalog?.clans.find((c) => c.id === (infoClan ?? clanId));

  function setTop(key: string, value: unknown) { onChange({ ...sheet, [key]: value }); }
  function setNumGroup(group: "attributes" | "skills", key: string, raw: string) {
    const current = (sheet[group] as Record<string, number>) ?? {};
    const next = { ...current };
    if (raw === "") delete next[key]; else next[key] = Number(raw);
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
      .map((d) => ({ name: d, level: 0, powers: "" }));
    set("disciplines", [...disciplines, ...add]);
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
                    <p className="muted">{detailClan.description}</p>
                    <div className="grid2">
                      <div>
                        <span className="kv-label">Disciplinas (buffs)</span>
                        <div className="chips">
                          {detailClan.disciplines.length
                            ? detailClan.disciplines.map((d) => <span key={d} className="badge buff">{d}</span>)
                            : <span className="muted">nenhuma</span>}
                        </div>
                      </div>
                      <div><span className="kv-label">Compulsão</span><p style={{ margin: ".2rem 0 0" }}>{detailClan.compulsion}</p></div>
                    </div>
                    <div style={{ marginTop: ".5rem" }}><span className="kv-label">Maldição (bane)</span><p style={{ margin: ".2rem 0 0" }}>{detailClan.bane}</p></div>
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
            <h3>Conceito</h3>
            <div className="grid2">
              <Field label="Conceito" v={str(sheet.concept)} on={(v) => set("concept", v)} ph="ex.: detetive amaldiçoado" />
              <Field label="Senhor (Sire)" v={str(sheet.sire)} on={(v) => set("sire", v)} />
              <Field label="Geração" type="number" v={str(sheet.generation)} on={(v) => set("generation", v ? Number(v) : undefined)} ph="ex.: 13" />
              <Field label="Potência de Sangue (0–6)" type="number" v={str(sheet.bloodPotency)} on={(v) => set("bloodPotency", v ? Number(v) : undefined)} />
              <Field label="Tipo de Predador" v={str(sheet.predatorType)} on={(v) => set("predatorType", v || undefined)} disabled={!canHaveClan} ph="ex.: Alcateia, Sedutor…" />
              <Field label="Idade aparente" v={str(sheet.apparentAge)} on={(v) => set("apparentAge", v)} />
            </div>
            <BloodPotencyEffects catalog={catalog} potency={Number(sheet.bloodPotency)} />

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
                  value={(sheet.hunger as number) ?? 0} onChange={(e) => setTop("hunger", Number(e.target.value))} />
              </div>
            </div>
            <h3>Atributos <span className="muted" style={{ fontSize: ".8rem" }}>(1 com 4 · 3 com 3 · 4 com 2 · 1 com 1)</span></h3>
            {attributes.length === 0 && <p className="muted">Schema sem atributos.</p>}
            <div className="attr-layout">
              <div className="trait-cols">
                {Object.entries(attrGroups).map(([cat, names]) => (
                  <div key={cat} className="trait-col">
                    <div className="cat-head">{cat}</div>
                    {names.map((name) => (
                      <DotRating key={name} name={titleCase(name)} testid={`attr-${name}`} min={1} max={5}
                        value={attrs[name] ?? ""} onChange={(raw) => setNumGroup("attributes", name, raw)} />
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
                      onChange={(raw) => setNumGroup("skills", name, raw)} />
                  ))}
                </div>
              ))}
            </div>
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
                <p className="muted" style={{ fontSize: 13 }}>Na criação: 2 disciplinas do clã (2 pontos numa, 1 noutra). O texto dos poderes vem do livro (Chat IA).</p>
                <div data-testid="disciplines-list">
                  {disciplines.map((d, i) => (
                    <div key={i} className="disc-row" data-testid="discipline-row">
                      <input aria-label="disciplina" placeholder="Disciplina" value={d.name}
                        onChange={(e) => set("disciplines", disciplines.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                      <DotsOnly value={d.level} max={5} onChange={(lv) => set("disciplines", disciplines.map((x, j) => j === i ? { ...x, level: lv } : x))} />
                      <input aria-label="poderes" placeholder="Poderes (ex.: Sentir o Inimigo…)" value={d.powers}
                        onChange={(e) => set("disciplines", disciplines.map((x, j) => j === i ? { ...x, powers: e.target.value } : x))} />
                      <button type="button" className="secondary" onClick={() => set("disciplines", disciplines.filter((_, j) => j !== i))}>✕</button>
                    </div>
                  ))}
                </div>
                <button type="button" className="secondary" style={{ marginTop: 8 }}
                  onClick={() => set("disciplines", [...disciplines, { name: "", level: 1, powers: "" }])}>+ Disciplina</button>
              </>
            )}
          </section>
        )}

        {/* 6 · VANTAGENS & DEFEITOS */}
        {cur === "vantagens" && (
          <section>
            <h3>Vantagens & Antecedentes <span className="muted" style={{ fontSize: ".8rem" }}>(7 pontos)</span></h3>
            <AdvantageEditor items={advantages} testid="advantages" onChange={(v) => set("advantages", v)} ph="ex.: Refúgio, Aliados, Recursos, Mentor…" />
            <h3 style={{ marginTop: "1.1rem" }}>Defeitos <span className="muted" style={{ fontSize: ".8rem" }}>(2 pontos + do predador)</span></h3>
            <AdvantageEditor items={flaws} testid="flaws" onChange={(v) => set("flaws", v)} ph="ex.: Inimigo, Caçado, Suspeito…" />
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
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "3px 0" }}>
                    <span>{d.name || "—"} {"●".repeat(d.level)}</span>
                    <span className="muted" style={{ fontSize: 13 }}>{d.powers}</span>
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

function DotRating({ value, max, min, onChange, testid, name }: {
  value: number | ""; max: number; min: number; onChange: (raw: string) => void; testid: string; name: string;
}) {
  const v = typeof value === "number" ? value : 0;
  return (
    <div className="trait-row">
      <span className="trait-name">{name}</span>
      <span className="dots">
        {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
          <button key={i} type="button" tabIndex={-1} aria-label={`${name} ${i}`}
            className={`dot${v >= i ? " on" : ""}`} onClick={() => onChange(String(v === i ? i - 1 : i))} />
        ))}
      </span>
      <input className="num" type="number" min={min} max={max} data-testid={testid} aria-label={name}
        value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function DotsOnly({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  return (
    <span className="dots">
      {Array.from({ length: max }, (_, i) => i + 1).map((i) => (
        <button key={i} type="button" tabIndex={-1} className={`dot${value >= i ? " on" : ""}`}
          onClick={() => onChange(value === i ? i - 1 : i)} />
      ))}
    </span>
  );
}

function AdvantageEditor({ items, onChange, ph, testid }: {
  items: Advantage[]; onChange: (v: Advantage[]) => void; ph?: string; testid: string;
}) {
  return (
    <div data-testid={testid}>
      {items.map((a, i) => (
        <div key={i} className="disc-row">
          <input aria-label="nome" placeholder={ph} value={a.name}
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

function AttributeRadial({ names, values, pentagram }: {
  names: string[]; values: Record<string, number>; pentagram: boolean;
}) {
  const size = 230, c = size / 2, R = 86, max = 5, n = names.length;
  const ang = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, r: number) => [c + r * Math.cos(ang(i)), c + r * Math.sin(ang(i))];
  const rings = [1, 2, 3, 4, 5].map((lvl) => names.map((_, i) => pt(i, (lvl / max) * R).join(",")).join(" "));
  const valPoly = names.map((nm, i) => pt(i, ((values[nm] ?? 0) / max) * R).join(",")).join(" ");
  const starPts = pentagram ? [0, 2, 4, 1, 3].map((k) => {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5; return [c + R * Math.cos(a), c + R * Math.sin(a)].join(",");
  }).join(" ") : "";
  return (
    <svg className="radial" width={size} height={size} viewBox={`0 0 ${size} ${size}`} data-testid="attr-radial" role="img" aria-label="diagrama de atributos">
      {rings.map((p, i) => <polygon key={i} points={p} className="radial-ring" />)}
      {names.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={c} y1={c} x2={x} y2={y} className="radial-axis" />; })}
      {pentagram && <polygon points={starPts} className="radial-star" />}
      <polygon points={valPoly} className="radial-val" />
      {names.map((nm, i) => { const [x, y] = pt(i, R + 14); return <text key={nm} x={x} y={y} className="radial-label" textAnchor="middle" dominantBaseline="middle">{abbr(nm)}</text>; })}
    </svg>
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
function abbr(s: string): string { return s.slice(0, 3).toUpperCase(); }
