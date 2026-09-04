"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { T20Catalog, T20RaceDef, T20AttrDef, T20AttrMod, T20RaceAbility, T20WeaponDef, T20WeaponUpgrade } from "@/lib/api";

/**
 * Ficha de sessão do Tormenta 20 (sistema d20). Núcleo jogável: nível/classe/raça,
 * os 6 atributos, PV/PM/Defesa derivados, as 29 perícias com valor calculado e um
 * rolador 1d20 + valor vs. DT. Auto-salva a cada interação (otimista) via onPersist —
 * o servidor recomputa os derivados e devolve, garantindo a matemática.
 *
 * Isolado do V5: só é renderizado quando o sistema usa o ruleset "t20".
 */

type Sheet = Record<string, unknown>;
type Atributos = Record<string, number>;
type Pericia = { treinada?: boolean; outros?: number };
type Arma = { nome?: string; ataque?: number; dano?: string; critico?: string; tipo?: string; categoria?: string; empunhadura?: string; alcance?: string; obs?: string; aprimoramentos?: string[] };
type Item = { nome?: string; qtd?: number; espacos?: number; obs?: string };

const num = (v: unknown, d = 0): number => (Number.isFinite(Number(v)) ? Number(v) : d);
const str = (v: unknown): string => (typeof v === "string" ? v : "");
const rollD20 = (): number => 1 + Math.floor(Math.random() * 20); // fora do componente (não é "render")

// Espelho local das fórmulas do motor (feedback imediato; o servidor é a autoridade).
const trainingBonus = (nivel: number) => (nivel >= 15 ? 6 : nivel >= 7 ? 4 : 2);
const skillValue = (nivel: number, attr: number, treinada: boolean, outros: number) =>
  Math.floor(nivel / 2) + attr + (treinada ? trainingBonus(nivel) : 0) + outros;

type RollLine = { id: number; label: string; natural: number; bonus: number; total: number; dt: number | null; crit: boolean; fumble: boolean };

export function T20Sheet({ sheet, catalog, onPersist }: {
  sheet: Sheet;
  catalog: T20Catalog | null;
  onPersist: (next: Sheet) => void;
}) {
  const [s, setS] = useState<Sheet>(sheet);
  useEffect(() => { setS(sheet); }, [sheet]);

  const [rolls, setRolls] = useState<RollLine[]>([]);
  const rollId = useRef(0);
  const [spellQuery, setSpellQuery] = useState("");
  const [spellTrad, setSpellTrad] = useState("");
  const [spellSchool, setSpellSchool] = useState("");
  const [spellCircle, setSpellCircle] = useState("");
  const [spellOnlyAllowed, setSpellOnlyAllowed] = useState(false);
  const [powerQuery, setPowerQuery] = useState("");
  const [powerCat, setPowerCat] = useState("");
  const [dtInput, setDtInput] = useState(""); // DT opcional, compartilhada pelas rolagens
  const [step, setStep] = useState(0);

  const STEPS: { key: string; label: string }[] = [
    { key: "identidade", label: "Identidade" },
    { key: "atributos", label: "Atributos" },
    { key: "pericias", label: "Perícias" },
    { key: "combate", label: "Combate" },
    { key: "inventario", label: "Inventário" },
    { key: "historia", label: "História" },
    { key: "referencias", label: "Poderes & Magias" },
  ];
  const cur = STEPS[step]?.key ?? "identidade";

  const nivel = num(s.nivel, 1);
  const pericias = (s.pericias as Record<string, Pericia>) ?? {};
  const attrDefs = catalog?.attributes ?? [];
  const skillDefs = catalog?.skills ?? [];
  const classes = catalog?.classes ?? [];
  const races = catalog?.races ?? [];

  const spells = catalog?.spells ?? [];
  const spellSchools = useMemo(() => [...new Set(spells.map((s) => s.school))].sort(), [spells]);

  const powersFiltered = useMemo(() => {
    const q = powerQuery.trim().toLowerCase();
    return (catalog?.powers ?? []).filter((p) =>
      (!powerCat || p.category === powerCat) &&
      (!q || p.name.toLowerCase().includes(q) || (p.prereq ?? "").toLowerCase().includes(q)),
    );
  }, [catalog, powerQuery, powerCat]);

  const powerMap = useMemo(() => new Map((catalog?.powers ?? []).map((p) => [p.name.toLowerCase(), p])), [catalog]);
  // Lista de nomes de poder; os que existem no catálogo ganham tooltip com a descrição.
  const renderPowers = (names: string[]) => names.map((nm, i) => {
    const p = powerMap.get(nm.toLowerCase());
    return (
      <span key={nm}>
        {i > 0 && ", "}
        {p ? <span className="t20-power" title={[p.desc, p.prereq ? `Pré: ${p.prereq}` : ""].filter(Boolean).join(" · ")}>{nm}</span> : nm}
      </span>
    );
  });

  const selectedRace = races.find((r) => r.id === str(s.raca));
  const selectedOrigin = (catalog?.origins ?? []).find((o) => o.id === str(s.origem));
  const selectedDeity = (catalog?.deities ?? []).find((d) => d.id === str(s.divindade));
  const cls = classes.find((c) => c.id === str(s.classe));

  // Atributos: base (comprado) + modificadores da raça = final (espelha o servidor).
  const atributosBase = (s.atributosBase as Atributos) ?? (s.atributos as Atributos) ?? {};
  const livres = Array.isArray(s.atributosLivres) ? (s.atributosLivres as string[]) : [];
  const racaMods: Atributos = {};
  for (const a of attrDefs) racaMods[a.key] = 0;
  if (selectedRace) {
    for (const m of selectedRace.attrMods) racaMods[m.attr] = (racaMods[m.attr] ?? 0) + m.mod;
    const variant = selectedRace.variants?.find((v) => v.id === str(s.racaVariante)) ?? selectedRace.variants?.[0];
    if (variant) for (const m of variant.attrMods) racaMods[m.attr] = (racaMods[m.attr] ?? 0) + m.mod;
    if (selectedRace.freeAttr) {
      const uniq = [...new Set(livres.filter((k) => attrDefs.some((a) => a.key === k)))].slice(0, selectedRace.freeAttr.count);
      for (const k of uniq) racaMods[k] = (racaMods[k] ?? 0) + selectedRace.freeAttr.each;
    }
  }
  const atributos: Atributos = {};
  for (const a of attrDefs) atributos[a.key] = num(atributosBase[a.key]) + num(racaMods[a.key]);

  // Point-buy de criação (Tabela 1-1): começa tudo em 0, recebe 10 pontos; custo por valor
  // base (−1 a +4). Reduzir a −1 devolve 1 ponto. Só vale na criação — níveis acima sobem
  // atributos por fora, então isto é um guia (avisa se estourar), não um bloqueio.
  const POINT_COST: Record<number, number> = { "-1": -1, 0: 0, 1: 1, 2: 2, 3: 4, 4: 7 };
  const pointCost = (v: number): number | null => (v in POINT_COST ? POINT_COST[v] : null);
  const POINT_BUDGET = 10;
  const pointsUsed = attrDefs.reduce((t, a) => t + (pointCost(num(atributosBase[a.key])) ?? 0), 0);
  const pointsRestantes = POINT_BUDGET - pointsUsed;
  const foraDaFaixa = attrDefs.some((a) => pointCost(num(atributosBase[a.key])) === null);
  function stepAttr(key: string, delta: number) {
    const v = Math.max(-1, Math.min(10, num(atributosBase[key]) + delta));
    return { ...s, atributosBase: { ...atributosBase, [key]: v } };
  }

  const con = num(atributos.constituicao);
  const des = num(atributos.destreza);
  const pvMax = cls ? cls.pvBase + (nivel - 1) * cls.pvPerLevel + nivel * con : null;
  const pmMax = cls ? cls.pmPerLevel * nivel : null;
  const defesa = 10 + des + num(s.armadura) + num(s.escudo) + num(s.defesaOutros);

  // Proficiência de arma pela classe (Simples: todos; Marcial: se a classe tiver; Exótica/Fogo: treino específico).
  const weapons = catalog?.weapons ?? [];
  const profMarcial = cls ? cls.proficiencies.toLowerCase().includes("marci") : false;
  const weaponProficient = (categoria?: string) =>
    !categoria || categoria === "Simples" ? true : categoria === "Marcial" ? profMarcial : false;

  // Conjuração da classe: tradição + maior círculo no nível atual.
  const magic = cls?.magic;
  const maxCircle = magic ? magic.circles.filter((m) => nivel >= m).length : 0;
  // Atributo-chave da conjuração define a CD e o ataque das magias (leva nível + atributo).
  const spellKeyAttr = magic ? num(atributos[magic.keyAttr]) : 0;
  const spellAtk = Math.floor(nivel / 2) + spellKeyAttr;      // ataque de magia (½ nível + atributo)
  const spellCD = 10 + Math.floor(nivel / 2) + spellKeyAttr;  // CD para resistir
  const pmCost = (circle: number) => [0, 1, 3, 6, 10, 15][circle] ?? 0;
  const magias = Array.isArray(s.magias) ? (s.magias as string[]) : [];
  const addMagia = (nome: string) => { if (!magias.includes(nome)) commit({ ...s, magias: [...magias, nome] }); };
  const removeMagia = (nome: string) => commit({ ...s, magias: magias.filter((m) => m !== nome) });

  const spellQ = spellQuery.trim().toLowerCase();
  const spellCirc = spellCircle ? Number(spellCircle) : null;
  const spellsFiltered = spells.filter((sp) =>
    (!spellTrad || sp.tradition === spellTrad) &&
    (!spellSchool || sp.school === spellSchool) &&
    (spellCirc == null || sp.circle === spellCirc) &&
    (!spellOnlyAllowed || (!!magic && sp.tradition === magic.tradition && sp.circle <= maxCircle)) &&
    (!spellQ || sp.name.toLowerCase().includes(spellQ) || sp.school.toLowerCase().includes(spellQ) || sp.summary.toLowerCase().includes(spellQ)),
  );

  // set + persiste (otimista). Inputs chamam no blur; toggles/botões na hora.
  function commit(next: Sheet) { setS(next); onPersist(next); }
  function setLocal(next: Sheet) { setS(next); }

  function setAttr(key: string, v: number) {
    return { ...s, atributosBase: { ...atributosBase, [key]: v } };
  }
  // Alterna um atributo na escolha livre da raça (respeitando o limite `count`).
  function toggleLivre(key: string) {
    const max = selectedRace?.freeAttr?.count ?? 0;
    const has = livres.includes(key);
    let next = has ? livres.filter((k) => k !== key) : [...livres, key];
    if (!has && next.length > max) next = next.slice(next.length - max); // mantém as últimas escolhas
    return { ...s, atributosLivres: next };
  }
  function setPericia(name: string, patch: Pericia) {
    return { ...s, pericias: { ...pericias, [name]: { ...pericias[name], ...patch } } };
  }
  // Escolher classe: já marca as perícias FIXAS como treinadas (não desmarca outras).
  function pickClass(id: string) {
    const c = classes.find((x) => x.id === id);
    let per = { ...pericias };
    if (c) for (const nm of c.skillsFixed) per = { ...per, [nm]: { ...per[nm], treinada: true } };
    commit({ ...s, classe: id, pericias: per });
  }

  // Rolagem inline: usa a DT do campo compartilhado (vazio = rola sem DT). Sem popup.
  function doRoll(label: string, bonus: number) {
    const dt = dtInput.trim() === "" ? null : Math.trunc(Number(dtInput));
    const natural = rollD20();
    setRolls((r) => [{
      id: rollId.current++, label, natural, bonus, total: natural + bonus,
      dt: dt != null && Number.isFinite(dt) ? dt : null, crit: natural === 20, fumble: natural === 1,
    }, ...r].slice(0, 12));
  }
  const rollSkill = doRoll;

  // Armas e inventário (listas livres).
  const armas = (Array.isArray(s.armas) ? s.armas : []) as Arma[];
  const itens = (Array.isArray(s.itens) ? s.itens : []) as Item[];
  const cargaUsada = itens.reduce((t, it) => t + num(it.espacos) * Math.max(1, num(it.qtd, 1)), 0);
  const cargaLimite = num(atributos.forca) + 5; // espaços = Força + 5

  function setArmas(next: Arma[]) { commit({ ...s, armas: next }); }
  function setItens(next: Item[]) { commit({ ...s, itens: next }); }
  const rollAtaque = (nome: string, bonus: number) => doRoll(`Ataque: ${nome}`, bonus);

  if (!catalog) return <p className="muted">Carregando catálogo do Tormenta 20…</p>;

  return (
    <div data-testid="t20-sheet" className="t20-sheet">
      {/* Vitais sempre visíveis */}
      <div className="t20-derived">
        <VitalBox label="PV" atual={pvMax != null ? pvMax - num(s.pvDano) : null} max={pvMax}
          onDelta={(d) => commit({ ...s, pvDano: Math.max(0, num(s.pvDano) - d) })} testid="t20-pv" />
        <VitalBox label="PM" atual={pmMax != null ? pmMax - num(s.pmGasto) : null} max={pmMax}
          onDelta={(d) => commit({ ...s, pmGasto: Math.max(0, num(s.pmGasto) - d) })} testid="t20-pm" />
        <div className="t20-defbox" data-testid="t20-defesa">
          <div className="t20-defbox-val">{defesa}</div>
          <div className="muted" style={{ fontSize: 12 }}>Defesa</div>
          <div className="muted" style={{ fontSize: 11 }}>10 + Des + arm. + esc.</div>
        </div>
      </div>

      {/* Passos (como no V5) */}
      <ol className="stepper" data-testid="t20-steps">
        {STEPS.map((st, i) => (
          <li key={st.key}>
            <button type="button" className={`step-tab${i === step ? " on" : ""}${i < step ? " done" : ""}`}
              data-testid={`t20-step-${st.key}`} onClick={() => setStep(i)}>
              <span className="step-no">{i + 1}</span>{st.label}
            </button>
          </li>
        ))}
      </ol>

      <div className="step-body">
      {cur === "identidade" && (<>
      {/* Identidade */}
      <div className="t20-idrow">
        <label>Nível
          <input type="number" min={1} max={20} value={nivel} data-testid="t20-nivel"
            onChange={(e) => setLocal({ ...s, nivel: num(e.target.value, 1) })}
            onBlur={() => commit(s)} style={{ marginTop: 6 }} />
        </label>
        <label>Classe
          <select value={str(s.classe)} data-testid="t20-classe" onChange={(e) => pickClass(e.target.value)} style={{ marginTop: 6 }}>
            <option value="">—</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label>Raça
          <select value={str(s.raca)} data-testid="t20-raca" onChange={(e) => commit({ ...s, raca: e.target.value })} style={{ marginTop: 6 }}>
            <option value="">—</option>
            {races.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </label>
        <label>Origem
          <select value={str(s.origem)} data-testid="t20-origem" onChange={(e) => commit({ ...s, origem: e.target.value })} style={{ marginTop: 6 }}>
            <option value="">—</option>
            {(catalog?.origins ?? []).map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>
        <label>Divindade
          <select value={str(s.divindade)} data-testid="t20-divindade" onChange={(e) => commit({ ...s, divindade: e.target.value })} style={{ marginTop: 6 }}>
            <option value="">— (sem devoção)</option>
            {(catalog?.deities ?? []).map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </label>
      </div>

      {/* Raça: modificadores + habilidades (referência) */}
      {selectedRace && (
        <RaceInfo race={selectedRace} attrDefs={attrDefs}
          variantId={str(s.racaVariante)} onVariant={(v) => commit({ ...s, racaVariante: v })} />
      )}

      {/* Classe: perícias iniciais + proficiências */}
      {cls && (
        <div className="t20-race" data-testid="t20-class-info">
          <div className="t20-race-head">
            <span className="t20-race-name">{cls.label}</span>
            <span className="muted" style={{ fontSize: 12 }}>PV {cls.pvBase}/+{cls.pvPerLevel} · PM {cls.pmPerLevel}/nível</span>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            <div><b>Perícias treinadas:</b>{" "}
              {[...cls.skillsFixed, ...cls.skillsEither.map((g) => g.join(" ou "))].join(", ")}
              {cls.skillChoices > 0 && <> <span className="muted">+ {cls.skillChoices} à sua escolha</span></>}
            </div>
            <div><b>Proficiências:</b> <span className="muted">armas simples, armaduras leves{cls.proficiencies !== "Nenhuma" ? `, ${cls.proficiencies.toLowerCase()}` : ""}</span></div>
          </div>
        </div>
      )}

      {/* Origem: escolha 2 benefícios (perícias/poderes) */}
      {selectedOrigin && (
        <div className="t20-race" data-testid="t20-origin-info">
          <div className="t20-race-head">
            <span className="t20-race-name">{selectedOrigin.label}</span>
            <span className="muted" style={{ fontSize: 12 }}>escolha 2 benefícios (perícias e/ou poderes)</span>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            {selectedOrigin.skills.length > 0 && <div><b>Perícias:</b> <span className="muted">{selectedOrigin.skills.join(", ")}</span></div>}
            {selectedOrigin.powers.length > 0 && <div><b>Poderes:</b> <span className="muted">{renderPowers(selectedOrigin.powers)}</span></div>}
          </div>
        </div>
      )}

      {/* Divindade: energia, arma, devotos e poderes concedidos (escolha 1 ao se devotar) */}
      {selectedDeity && (
        <div className="t20-race" data-testid="t20-deity-info">
          <div className="t20-race-head">
            <span className="t20-race-name">{selectedDeity.label}</span>
            <span className="muted" style={{ fontSize: 13 }}>{selectedDeity.domain}</span>
          </div>
          <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            <div className="muted"><b style={{ color: "var(--text)" }}>Energia:</b> {selectedDeity.energy} · <b style={{ color: "var(--text)" }}>Arma:</b> {selectedDeity.weapon}</div>
            <div><b>Devotos:</b> <span className="muted">{selectedDeity.devotees}</span></div>
            <div><b>Poderes concedidos:</b> <span className="muted">{renderPowers(selectedDeity.grantedPowers)}</span> <span className="muted" style={{ fontSize: 12 }}>(escolha 1)</span></div>
          </div>
        </div>
      )}

      </>)}

      {cur === "atributos" && (<>
      {/* Atributos: você edita o BASE; a raça soma o modificador; o total é o valor final */}
      <h4 className="t20-h">Atributos <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>(base + raça = total)</span></h4>

      {/* Point-buy de criação: 10 pontos (Tabela 1-1) */}
      <div className={`t20-race${pointsUsed > POINT_BUDGET ? " t20-warn" : ""}`} data-testid="t20-pointbuy" style={{ padding: "8px 12px" }}>
        <span style={{ fontSize: 13 }}>
          <b>Distribuição (criação):</b>{" "}
          <b style={{ color: pointsUsed > POINT_BUDGET ? "var(--err)" : "var(--accent-hover)" }} data-testid="t20-points-used">{pointsUsed}</b>
          <span className="muted"> / {POINT_BUDGET} pontos</span>
          {pointsRestantes >= 0
            ? <span className="muted"> · restam <b style={{ color: "var(--text)" }}>{pointsRestantes}</b></span>
            : <span className="error" style={{ fontSize: 12, marginLeft: 8 }}>⚠ {-pointsRestantes} ponto(s) além do limite</span>}
          {foraDaFaixa && <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>(algum atributo fora da faixa de criação −1 a +4)</span>}
        </span>
        <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>Custo por valor: −1 → −1 · 0 → 0 · +1 → 1 · +2 → 2 · +3 → 4 · +4 → 7. Reduzir a −1 devolve 1 ponto.</div>
      </div>

      <div className="t20-attrs">
        {attrDefs.map((a) => {
          const base = num(atributosBase[a.key]);
          const mod = num(racaMods[a.key]);
          const custo = pointCost(base);
          return (
            <div key={a.key} className="t20-attr" data-testid={`t20-attr-${a.key}`}>
              <span className="t20-attr-abbr">{a.abbr}</span>
              <div className="t20-attr-buy">
                <button type="button" className="ghost" data-testid={`t20-attr-minus-${a.key}`} title="−1"
                  disabled={base <= -1} onClick={() => commit(stepAttr(a.key, -1))}>−</button>
                <input type="number" value={base} data-testid={`t20-attr-base-${a.key}`}
                  onChange={(e) => setLocal(setAttr(a.key, num(e.target.value)))} onBlur={() => commit(s)} />
                <button type="button" className="ghost" data-testid={`t20-attr-plus-${a.key}`} title="+1"
                  onClick={() => commit(stepAttr(a.key, 1))}>＋</button>
              </div>
              <span className="t20-attr-total" data-testid={`t20-attr-total-${a.key}`}>
                = {num(atributos[a.key])}{mod !== 0 && <span className="muted" style={{ fontSize: 11 }}> ({mod > 0 ? "+" : ""}{mod})</span>}
              </span>
              <span className="t20-attr-cost muted" style={{ fontSize: 10.5 }}>{custo == null ? "fora da faixa" : `custo ${custo}`}</span>
              <span className="t20-attr-label">{a.label}</span>
            </div>
          );
        })}
      </div>
      {selectedRace?.freeAttr && (
        <div className="t20-freeattr" data-testid="t20-freeattr">
          <span className="muted" style={{ fontSize: 13 }}>
            {selectedRace.label}: escolha {selectedRace.freeAttr.count} atributo(s) para +{selectedRace.freeAttr.each}
            {" "}({livres.length}/{selectedRace.freeAttr.count}):
          </span>
          {attrDefs.filter((a) => !selectedRace.freeAttr!.except?.includes(a.key)).map((a) => (
            <button key={a.key} type="button" data-testid={`t20-freeattr-${a.key}`}
              className={`t20-freeattr-chip${livres.includes(a.key) ? " on" : ""}`}
              onClick={() => commit(toggleLivre(a.key))}>{a.abbr}</button>
          ))}
        </div>
      )}

      {/* Defesa (equipamento) */}
      <div className="t20-armorrow">
        <label>Armadura <input type="number" value={num(s.armadura)} data-testid="t20-armadura"
          onChange={(e) => setLocal({ ...s, armadura: num(e.target.value) })} onBlur={() => commit(s)} /></label>
        <label>Escudo <input type="number" value={num(s.escudo)}
          onChange={(e) => setLocal({ ...s, escudo: num(e.target.value) })} onBlur={() => commit(s)} /></label>
        <label>Outros <input type="number" value={num(s.defesaOutros)}
          onChange={(e) => setLocal({ ...s, defesaOutros: num(e.target.value) })} onBlur={() => commit(s)} /></label>
      </div>
      </>)}

      {cur === "pericias" && (<>
      {/* Perícias */}
      <h4 className="t20-h">Perícias</h4>
      {(() => {
        const treinadas = skillDefs.filter((sk) => (pericias[sk.name]?.treinada) === true).length;
        const permitidas = cls ? cls.skillsFixed.length + cls.skillsEither.length + cls.skillChoices + Math.max(0, num(atributos.inteligencia)) : null;
        const excedeu = permitidas != null && treinadas > permitidas;
        return (
          <div className={`t20-race${excedeu ? " t20-warn" : ""}`} data-testid="t20-skill-count" style={{ padding: "8px 12px" }}>
            <span style={{ fontSize: 13 }}><b>Treinadas: {treinadas}</b>
              {permitidas != null
                ? <span className="muted"> · {cls!.label} permite ~{permitidas} (fixas {cls!.skillsFixed.length} + escolha {cls!.skillsEither.length + cls!.skillChoices} + Inteligência {Math.max(0, num(atributos.inteligencia))})</span>
                : <span className="muted"> · selecione uma classe para ver o limite</span>}
              {excedeu && <span className="error" style={{ fontSize: 12, marginLeft: 8 }}>⚠ acima do permitido</span>}
            </span>
          </div>
        );
      })()}
      <div className="t20-skills" data-testid="t20-skills">
        {skillDefs.map((sk) => {
          const p = pericias[sk.name] ?? {};
          const treinada = p.treinada === true;
          const attr = num(atributos[sk.key]);
          const val = skillValue(nivel, attr, treinada, num(p.outros));
          const abbr = attrDefs.find((a) => a.key === sk.key)?.abbr ?? "";
          const semUso = sk.trainedOnly && !treinada; // só treinada, sem treino: não pode rolar
          return (
            <div key={sk.name} className={`t20-skill attr-${sk.key}${treinada ? " trained" : ""}${semUso ? " t20-skill-off" : ""}`} data-testid={`t20-skill-${sk.name}`}>
              <input type="checkbox" checked={treinada} title="Treinada"
                data-testid={`t20-skill-treinada-${sk.name}`}
                onChange={(e) => commit(setPericia(sk.name, { treinada: e.target.checked }))} />
              <span className="t20-skill-name">{sk.name}
                <span className="t20-skill-tags">{abbr}{sk.trainedOnly ? " · só treinada" : ""}{sk.armorPenalty ? " · pen. arm." : ""}</span>
              </span>
              <span className="t20-skill-val" data-testid={`t20-skill-val-${sk.name}`}>{val >= 0 ? `+${val}` : val}</span>
              <button className="ghost t20-skill-roll" title={semUso ? "Só treinada — treine para usar" : "Rolar 1d20 + valor"}
                disabled={semUso} data-testid={`t20-skill-roll-${sk.name}`} onClick={() => rollSkill(sk.name, val)}>🎲</button>
            </div>
          );
        })}
      </div>
      </>)}

      {cur === "combate" && (
        <WeaponEditor armas={armas} onChange={setArmas} onRoll={rollAtaque}
          weapons={weapons} proficient={weaponProficient} upgrades={catalog.weaponUpgrades ?? []} />
      )}

      {cur === "inventario" && (
        <InventoryEditor itens={itens} onChange={setItens}
          dinheiro={num(s.dinheiro)} onDinheiro={(v) => commit({ ...s, dinheiro: v })}
          cargaUsada={cargaUsada} cargaLimite={cargaLimite} />
      )}

      {cur === "historia" && (
        <LoreEditor sheet={s} onCommit={commit} />
      )}

      {cur === "referencias" && (<>
      {/* Magias: conjuração da classe + magias conhecidas */}
      <div className="t20-race" data-testid="t20-magic-banner">
        {magic ? (
          <div style={{ fontSize: 13.5 }}>
            <b>Conjuração:</b> {cls?.label} lança magias <b>{magic.tradition === "Arcana" ? "arcanas" : "divinas"}</b> (atributo-chave{" "}
            <b>{attrDefs.find((a) => a.key === magic.keyAttr)?.abbr}</b>), até o <b>{maxCircle}º círculo</b> no nível {nivel}.
            {" "}<span className="muted">Ataque de magia <b>{spellAtk >= 0 ? "+" : ""}{spellAtk}</b> · CD <b>{spellCD}</b>.</span>
            {" "}Escolha as magias no grimório abaixo — elas entram automaticamente em <b>Magias conhecidas</b>.
          </div>
        ) : (
          <div className="muted" style={{ fontSize: 13.5 }}>
            {cls ? `${cls.label} não lança magias.` : "Selecione uma classe na Identidade."} O grimório abaixo é referência.
          </div>
        )}
      </div>
      {magic && (
        <button type="button" className="secondary" data-testid="t20-open-grimoire" style={{ alignSelf: "flex-start" }}
          onClick={() => { const d = document.querySelector('[data-testid="t20-spells-ref"]') as HTMLDetailsElement | null; if (d) { d.open = true; d.scrollIntoView({ block: "center" }); } setSpellOnlyAllowed(true); }}>
          ✨ Selecionar magias (grimório)
        </button>
      )}
      {magias.length > 0 && (
        <div className="t20-invsec" data-testid="t20-known-spells">
          <h4 className="t20-h">Magias conhecidas ({magias.length})</h4>
          {[...magias].map((nm) => spells.find((x) => x.name === nm)).filter(Boolean)
            .sort((a, b) => (a!.tradition.localeCompare(b!.tradition) || a!.circle - b!.circle || a!.name.localeCompare(b!.name)))
            .map((sp) => (
              <div key={sp!.name} className="t20-weapon">
                <span className="t20-power-name" style={{ flex: 1 }}>{sp!.name}
                  <span className="muted" style={{ fontSize: 11 }}> · {sp!.tradition} {sp!.circle}º · {sp!.school} · {pmCost(sp!.circle)} PM · CD {spellCD}</span></span>
                <button type="button" className="ghost" title={`Rolar ataque de magia (1d20 ${spellAtk >= 0 ? "+" : ""}${spellAtk})`} onClick={() => rollSkill(`Conjurar ${sp!.name}`, spellAtk)}>🎲</button>
                <button type="button" className="ghost" style={{ color: "var(--err)" }} data-testid={`t20-spell-remove-${sp!.name}`} onClick={() => removeMagia(sp!.name)}>✕</button>
              </div>
            ))}
          {magias.filter((nm) => !spells.find((x) => x.name === nm)).map((nm) => (
            <div key={nm} className="t20-weapon">
              <span className="t20-power-name" style={{ flex: 1 }}>{nm}</span>
              <button type="button" className="ghost" style={{ color: "var(--err)" }} onClick={() => removeMagia(nm)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Referência de poderes (índice completo por categoria) */}
      {(catalog.powers ?? []).length > 0 && (
        <details className="t20-powers-ref" data-testid="t20-powers-ref">
          <summary>Poderes ({catalog.powers.length}) — referência</summary>
          <div className="t20-spell-filters">
            <input placeholder="Buscar poder…" value={powerQuery}
              data-testid="t20-power-search" onChange={(e) => setPowerQuery(e.target.value)} />
            <select value={powerCat} data-testid="t20-power-cat" onChange={(e) => setPowerCat(e.target.value)} style={{ width: "auto" }}>
              <option value="">Todas</option>
              <option value="Combate">Combate</option>
              <option value="Destino">Destino</option>
              <option value="Magia">Magia</option>
              <option value="Concedido">Concedidos</option>
              <option value="Tormenta">Tormenta</option>
            </select>
            <span className="muted" style={{ fontSize: 12, alignSelf: "center" }}>{powersFiltered.length}</span>
          </div>
          <div className="t20-powers-list" data-testid="t20-power-list">
            {powersFiltered.map((p) => (
              <div key={`${p.category}-${p.name}`} className="t20-power-row">
                <span className="t20-power-name">{p.name}</span>
                <span className="muted" style={{ fontSize: 11 }}> · {p.category}{p.prereq ? ` · Pré: ${p.prereq}` : ""}</span>
                {p.desc && <div className="muted" style={{ fontSize: 13 }}>{p.desc}</div>}
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Grimório: índice de magias (busca + filtro por tradição) */}
      {spells.length > 0 && (
        <details className="t20-powers-ref" data-testid="t20-spells-ref">
          <summary>Magias ({spells.length}) — grimório</summary>
          <div className="t20-spell-filters">
            <input placeholder="Buscar magia…" value={spellQuery}
              data-testid="t20-spell-search" onChange={(e) => setSpellQuery(e.target.value)} />
            <select value={spellTrad} data-testid="t20-spell-trad" onChange={(e) => setSpellTrad(e.target.value)} style={{ width: "auto" }} title="Tradição">
              <option value="">Tradição: todas</option>
              <option value="Arcana">Arcanas</option>
              <option value="Divina">Divinas</option>
            </select>
            <select value={spellSchool} data-testid="t20-spell-school" onChange={(e) => setSpellSchool(e.target.value)} style={{ width: "auto" }} title="Escola">
              <option value="">Escola: todas</option>
              {spellSchools.map((sc) => <option key={sc} value={sc}>{sc}</option>)}
            </select>
            <select value={spellCircle} data-testid="t20-spell-circle" onChange={(e) => setSpellCircle(e.target.value)} style={{ width: "auto" }} title="Círculo">
              <option value="">Círculo: todos</option>
              {[1, 2, 3, 4, 5].map((c) => <option key={c} value={c}>{c}º círculo</option>)}
            </select>
            {magic && (
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, margin: 0, fontSize: 13 }} title="Só as que sua classe pode aprender">
                <input type="checkbox" data-testid="t20-spell-onlyallowed" checked={spellOnlyAllowed}
                  onChange={(e) => setSpellOnlyAllowed(e.target.checked)} style={{ width: "auto" }} /> só permitidas</label>
            )}
            <span className="muted" style={{ fontSize: 12, alignSelf: "center" }}>{spellsFiltered.length} magia(s)</span>
          </div>
          <div className="t20-powers-list" data-testid="t20-spell-list">
            {spellsFiltered.map((sp) => {
              const permitida = !!magic && sp.tradition === magic.tradition && sp.circle <= maxCircle;
              const conhecida = magias.includes(sp.name);
              return (
                <div key={`${sp.tradition}-${sp.circle}-${sp.name}`} className="t20-power-row">
                  <span className="t20-power-name">{sp.name}</span>
                  <span className="muted" style={{ fontSize: 11 }}> · {sp.tradition} {sp.circle}º · {sp.school} · {pmCost(sp.circle)} PM</span>
                  {conhecida
                    ? <button type="button" className="ghost" style={{ color: "var(--ok)", marginLeft: 6 }} title="Remover das conhecidas" onClick={() => removeMagia(sp.name)}>✓ conhecida</button>
                    : permitida && <button type="button" className="ghost" style={{ marginLeft: 6 }} data-testid={`t20-spell-add-${sp.name}`} onClick={() => addMagia(sp.name)}>+ conhecer</button>}
                  <div className="muted" style={{ fontSize: 12 }}>{sp.exec}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{sp.summary}</div>
                </div>
              );
            })}
          </div>
        </details>
      )}
      </>)}
      </div>

      {/* Rolagens (sempre visíveis) */}
      <div className="t20-rolls" data-testid="t20-rolls">
        <div className="t20-invhead" style={{ marginBottom: 4 }}>
          <h4 className="t20-h" style={{ marginRight: "auto" }}>Rolagens</h4>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, margin: 0, fontSize: 13 }} title="Dificuldade opcional aplicada às próximas rolagens">DT
            <input type="number" data-testid="t20-dt" value={dtInput} placeholder="—" style={{ width: 70 }}
              onChange={(e) => setDtInput(e.target.value)} /></label>
          {rolls.length > 0 && <button type="button" className="ghost" data-testid="t20-rolls-clear" onClick={() => setRolls([])}>limpar</button>}
        </div>
        {rolls.length === 0
          ? <p className="muted" style={{ fontSize: 13, margin: 0 }}>Clique no 🎲 de uma perícia, arma ou magia. Defina uma DT acima para ver sucesso/falha.</p>
          : rolls.map((r) => (
            <div key={r.id} className={`t20-roll${r.dt != null ? (r.total >= r.dt ? " ok" : " fail") : ""}`}>
              <b>{r.label}</b>
              <span className="mono"> 1d20 ({r.natural}) {r.bonus >= 0 ? "+" : ""}{r.bonus} = <b>{r.total}</b></span>
              {r.dt != null && <span className="muted"> vs DT {r.dt} → {r.total >= r.dt ? "sucesso" : "falha"}</span>}
              {r.crit && <span style={{ color: "var(--ok)" }}> · 20 natural!</span>}
              {r.fumble && <span style={{ color: "var(--err)" }}> · 1 natural</span>}
            </div>
          ))}
      </div>

      <div className="step-nav">
        <button type="button" className="secondary" data-testid="t20-step-prev" disabled={step === 0}
          onClick={() => setStep((n) => Math.max(0, n - 1))}>← Anterior</button>
        <span className="muted" style={{ fontSize: 13, alignSelf: "center" }}>{step + 1} / {STEPS.length}</span>
        <button type="button" data-testid="t20-step-next" disabled={step === STEPS.length - 1}
          onClick={() => setStep((n) => Math.min(STEPS.length - 1, n + 1))}>Próximo →</button>
      </div>
    </div>
  );
}

function fmtMods(mods: T20AttrMod[], attrDefs: T20AttrDef[]): string {
  const abbr = (k: string) => attrDefs.find((a) => a.key === k)?.abbr ?? k;
  return mods.map((m) => `${abbr(m.attr)} ${m.mod >= 0 ? "+" : ""}${m.mod}`).join(", ");
}

function RaceInfo({ race, attrDefs, variantId, onVariant }: {
  race: T20RaceDef; attrDefs: T20AttrDef[]; variantId: string; onVariant: (v: string) => void;
}) {
  const variant = race.variants?.find((v) => v.id === variantId) ?? race.variants?.[0];
  const mods = [...race.attrMods, ...(variant?.attrMods ?? [])];
  const abilities: T20RaceAbility[] = [...race.abilities, ...(variant?.abilities ?? [])];
  const modStr = fmtMods(mods, attrDefs)
    + (race.freeAttr ? `${mods.length ? " · " : ""}+${race.freeAttr.each} em ${race.freeAttr.count} atributos diferentes${race.freeAttr.except?.length ? ` (exceto ${race.freeAttr.except.map((k) => attrDefs.find((a) => a.key === k)?.abbr ?? k).join(", ")})` : ""}` : "");
  return (
    <div className="t20-race" data-testid="t20-race-info">
      <div className="t20-race-head">
        <span className="t20-race-name">{race.label}</span>
        <span className="muted" style={{ fontSize: 13 }}>{modStr}</span>
        {race.variants && (
          <select value={variant?.id ?? ""} data-testid="t20-raca-variante"
            onChange={(e) => onVariant(e.target.value)} style={{ width: "auto", padding: "4px 8px", fontSize: 13, marginLeft: "auto" }}>
            {race.variants.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
          </select>
        )}
      </div>
      <ul className="t20-race-abils">
        {abilities.map((a) => (
          <li key={a.name}><b>{a.name}.</b> <span className="muted">{a.desc}</span></li>
        ))}
      </ul>
    </div>
  );
}

function VitalBox({ label, atual, max, onDelta, testid }: {
  label: string; atual: number | null; max: number | null; onDelta: (d: number) => void; testid: string;
}) {
  return (
    <div className="t20-vitalbox" data-testid={testid}>
      <div className="t20-vital-head">
        <span className="t20-vital-val">{atual ?? "—"}</span>
        <span className="muted"> / {max ?? "—"}</span>
      </div>
      <div className="muted" style={{ fontSize: 12 }}>{label}</div>
      <div className="t20-vital-ctrls">
        <button className="ghost" onClick={() => onDelta(-1)} title={`-1 ${label}`}>−</button>
        <button className="ghost" onClick={() => onDelta(1)} title={`+1 ${label}`}>＋</button>
      </div>
    </div>
  );
}

// Editor de armas/ataques. Digita local; persiste no blur; adiciona/remove na hora.
function WeaponEditor({ armas, onChange, onRoll, weapons, proficient, upgrades }: {
  armas: Arma[]; onChange: (a: Arma[]) => void; onRoll: (nome: string, bonus: number) => void;
  weapons: T20WeaponDef[]; proficient: (categoria?: string) => boolean; upgrades: T20WeaponUpgrade[];
}) {
  const [rows, setRows] = useState<Arma[]>(armas);
  const ref = useRef<Arma[]>(armas);
  useEffect(() => { ref.current = armas; setRows(armas); }, [armas]);
  const edit = (i: number, patch: Arma) => { const next = ref.current.map((a, j) => (j === i ? { ...a, ...patch } : a)); ref.current = next; setRows(next); };
  const flush = () => onChange(ref.current);
  const push = (next: Arma[]) => { ref.current = next; onChange(next); };
  const addFromBook = (nome: string) => {
    const w = weapons.find((x) => x.nome === nome);
    if (!w) return;
    push([...ref.current, { nome: w.nome, dano: w.dano, critico: w.critico, tipo: w.tipo, categoria: w.categoria, empunhadura: w.empunhadura, alcance: w.alcance }]);
  };
  // Aprimoramentos aplicáveis à arma (à distância: applies distancia/any; corpo a corpo: corpo/any).
  const upgradesFor = (a: Arma) => upgrades.filter((u) => u.applies === "any" || (a.alcance ? u.applies === "distancia" : u.applies === "corpo"));
  const cats = ["Simples", "Marcial", "Exótica", "Fogo"];
  return (
    <div className="t20-invsec" data-testid="t20-weapons">
      <div className="t20-invhead"><h4 className="t20-h">Armas & Ataques</h4>
        <select data-testid="t20-weapon-book" defaultValue="" style={{ width: "auto" }}
          onChange={(e) => { if (e.target.value) { addFromBook(e.target.value); e.target.value = ""; } }}>
          <option value="">+ Arma do livro…</option>
          {cats.map((c) => (
            <optgroup key={c} label={c}>
              {weapons.filter((w) => w.categoria === c).map((w) => <option key={w.nome} value={w.nome}>{w.nome} ({w.dano} {w.critico})</option>)}
            </optgroup>
          ))}
        </select>
        <button type="button" className="secondary" data-testid="t20-weapon-add" onClick={() => push([...ref.current, {}])}>+ Vazia</button></div>
      {rows.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Nenhuma arma. Escolha uma do livro acima e ajuste modificações.</p>}
      {rows.map((a, i) => {
        const semProf = a.categoria && !proficient(a.categoria);
        return (
          <div key={i} className="t20-weaponblock" data-testid="t20-weapon-row">
            <div className="t20-weapon">
              <input placeholder="Nome" value={str(a.nome)} style={{ flex: 2, minWidth: 120 }}
                onChange={(e) => edit(i, { nome: e.target.value })} onBlur={flush} />
              <input type="number" placeholder="Atq" title="Bônus de ataque (some For/Des + treino + modificações)" value={num(a.ataque)} style={{ width: 64 }}
                onChange={(e) => edit(i, { ataque: num(e.target.value) })} onBlur={flush} />
              <input placeholder="Dano" title="Ex.: 1d8+3" value={str(a.dano)} style={{ width: 110 }}
                onChange={(e) => edit(i, { dano: e.target.value })} onBlur={flush} />
              <input placeholder="Crít." value={str(a.critico)} style={{ width: 70 }}
                onChange={(e) => edit(i, { critico: e.target.value })} onBlur={flush} />
              <input placeholder="Tipo" value={str(a.tipo)} style={{ width: 100 }}
                onChange={(e) => edit(i, { tipo: e.target.value })} onBlur={flush} />
              <button type="button" className="ghost" title="Rolar 1d20 + ataque" onClick={() => onRoll(str(a.nome) || "arma", num(a.ataque))}>🎲</button>
              <button type="button" className="ghost" style={{ color: "var(--err)" }} title="Remover" onClick={() => push(ref.current.filter((_, j) => j !== i))}>✕</button>
            </div>
            <div className="t20-weapon">
              {a.categoria && <span className="badge" style={{ fontSize: 11 }}>{a.categoria}{a.empunhadura ? ` · ${a.empunhadura}` : ""}{a.alcance ? " · distância" : " · corpo a corpo"}</span>}
              {semProf && <span className="error" style={{ fontSize: 12 }}>⚠ sem proficiência ({a.categoria}) — –5 no ataque</span>}
              <select data-testid={`t20-weapon-upg-${i}`} defaultValue="" style={{ width: "auto" }} title="Aprimoramentos aplicáveis a esta arma"
                onChange={(e) => { if (e.target.value) { const cur = a.aprimoramentos ?? []; if (!cur.includes(e.target.value)) edit(i, { aprimoramentos: [...cur, e.target.value] }), flush(); e.target.value = ""; } }}>
                <option value="">+ Aprimoramento…</option>
                {upgradesFor(a).map((u) => <option key={u.nome} value={u.nome} title={u.efeito}>{u.nome} — {u.efeito}</option>)}
              </select>
              <input placeholder="Modificações / observações…" value={str(a.obs)} style={{ flex: 1, minWidth: 160 }}
                onChange={(e) => edit(i, { obs: e.target.value })} onBlur={flush} />
            </div>
            {(a.aprimoramentos?.length ?? 0) > 0 && (
              <div className="t20-weapon" style={{ gap: 6 }}>
                {a.aprimoramentos!.map((up) => {
                  const info = upgrades.find((u) => u.nome === up);
                  return (
                    <span key={up} className="badge buff" style={{ fontSize: 11 }} title={info?.efeito}>{up}
                      <button type="button" className="ghost" style={{ padding: "0 4px", color: "var(--err)" }}
                        onClick={() => { edit(i, { aprimoramentos: (a.aprimoramentos ?? []).filter((x) => x !== up) }); flush(); }}>✕</button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Inventário: itens (nome/qtd/espaços/obs) + dinheiro (T$) + carga (espaços = Força + 5).
function InventoryEditor({ itens, onChange, dinheiro, onDinheiro, cargaUsada, cargaLimite }: {
  itens: Item[]; onChange: (it: Item[]) => void; dinheiro: number; onDinheiro: (v: number) => void;
  cargaUsada: number; cargaLimite: number;
}) {
  const [rows, setRows] = useState<Item[]>(itens);
  const [tibar, setTibar] = useState(dinheiro);
  const ref = useRef<Item[]>(itens);
  useEffect(() => { ref.current = itens; setRows(itens); }, [itens]);
  useEffect(() => { setTibar(dinheiro); }, [dinheiro]);
  const edit = (i: number, patch: Item) => { const next = ref.current.map((it, j) => (j === i ? { ...it, ...patch } : it)); ref.current = next; setRows(next); };
  const flush = () => onChange(ref.current);
  const push = (next: Item[]) => { ref.current = next; onChange(next); };
  const sobrecarga = cargaUsada > cargaLimite;
  return (
    <div className="t20-invsec" data-testid="t20-inventory">
      <div className="t20-invhead">
        <h4 className="t20-h">Inventário</h4>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, margin: 0 }}>T$
          <input type="number" data-testid="t20-money" value={tibar} style={{ width: 100 }}
            onChange={(e) => setTibar(num(e.target.value))} onBlur={() => onDinheiro(tibar)} /></label>
        <span className={`muted${sobrecarga ? " t20-overload" : ""}`} data-testid="t20-carga" style={{ fontSize: 13 }}>
          Carga: {cargaUsada} / {cargaLimite} espaços{sobrecarga ? " · sobrecarregado!" : ""}</span>
        <button type="button" className="secondary" data-testid="t20-item-add" onClick={() => push([...ref.current, { qtd: 1 }])}>+ Item</button>
      </div>
      {rows.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Nenhum item ainda.</p>}
      {rows.map((it, i) => (
        <div key={i} className="t20-weapon" data-testid="t20-item-row">
          <input placeholder="Item" value={str(it.nome)} style={{ flex: 2, minWidth: 140 }}
            onChange={(e) => edit(i, { nome: e.target.value })} onBlur={flush} />
          <input type="number" placeholder="Qtd" title="Quantidade" value={num(it.qtd, 1)} style={{ width: 64 }}
            onChange={(e) => edit(i, { qtd: num(e.target.value, 1) })} onBlur={flush} />
          <input type="number" placeholder="Esp." title="Espaços (carga)" value={num(it.espacos)} style={{ width: 64 }}
            onChange={(e) => edit(i, { espacos: num(e.target.value) })} onBlur={flush} />
          <input placeholder="Observações" value={str(it.obs)} style={{ flex: 1, minWidth: 120 }}
            onChange={(e) => edit(i, { obs: e.target.value })} onBlur={flush} />
          <button type="button" className="ghost" style={{ color: "var(--err)" }} title="Remover" onClick={() => push(ref.current.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
    </div>
  );
}

// História & personalização: campos livres de lore. Digita local; persiste no blur.
function LoreEditor({ sheet, onCommit }: { sheet: Sheet; onCommit: (next: Sheet) => void }) {
  const FIELDS: { key: string; label: string; area?: boolean; ph?: string }[] = [
    { key: "conceito", label: "Conceito", ph: "ex.: cavaleiro exilado em busca de redenção" },
    { key: "tendencia", label: "Tendência (alinhamento)", ph: "ex.: Leal e Bom, Neutro, Caótico…" },
    { key: "aparencia", label: "Aparência", area: true },
    { key: "personalidade", label: "Personalidade", area: true },
    { key: "objetivo", label: "Objetivos & Motivação", area: true },
    { key: "historia", label: "História", area: true },
    { key: "anotacoes", label: "Anotações", area: true },
  ];
  const [vals, setVals] = useState<Record<string, string>>({});
  const ref = useRef<Record<string, string>>({});
  const sheetRef = useRef(sheet);
  useEffect(() => {
    sheetRef.current = sheet;
    const init: Record<string, string> = {};
    for (const f of FIELDS) init[f.key] = str(sheet[f.key]);
    ref.current = init; setVals(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheet]);
  const edit = (key: string, v: string) => { ref.current = { ...ref.current, [key]: v }; setVals(ref.current); };
  const flush = (key: string) => onCommit({ ...sheetRef.current, [key]: ref.current[key] ?? "" });
  return (
    <div className="t20-lore" data-testid="t20-lore">
      {FIELDS.map((f) => (
        <label key={f.key} style={{ display: "block" }}>{f.label}
          {f.area
            ? <textarea data-testid={`t20-lore-${f.key}`} value={vals[f.key] ?? ""} placeholder={f.ph} rows={3}
                style={{ marginTop: 6, resize: "vertical" }}
                onChange={(e) => edit(f.key, e.target.value)} onBlur={() => flush(f.key)} />
            : <input data-testid={`t20-lore-${f.key}`} value={vals[f.key] ?? ""} placeholder={f.ph}
                style={{ marginTop: 6 }}
                onChange={(e) => edit(f.key, e.target.value)} onBlur={() => flush(f.key)} />}
        </label>
      ))}
    </div>
  );
}
