"use client";

import { useEffect, useRef, useState } from "react";
import type { T20Catalog } from "@/lib/api";

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

const num = (v: unknown, d = 0): number => (Number.isFinite(Number(v)) ? Number(v) : d);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

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

  const nivel = num(s.nivel, 1);
  const atributos = (s.atributos as Atributos) ?? {};
  const pericias = (s.pericias as Record<string, Pericia>) ?? {};
  const attrDefs = catalog?.attributes ?? [];
  const skillDefs = catalog?.skills ?? [];
  const classes = catalog?.classes ?? [];
  const races = catalog?.races ?? [];

  const cls = classes.find((c) => c.id === str(s.classe));
  const con = num(atributos.constituicao);
  const des = num(atributos.destreza);
  const pvMax = cls ? cls.pvBase + (nivel - 1) * cls.pvPerLevel + nivel * con : null;
  const pmMax = cls ? cls.pmPerLevel * nivel : null;
  const defesa = 10 + des + num(s.armadura) + num(s.escudo) + num(s.defesaOutros);

  // set + persiste (otimista). Inputs chamam no blur; toggles/botões na hora.
  function commit(next: Sheet) { setS(next); onPersist(next); }
  function setLocal(next: Sheet) { setS(next); }

  function setAttr(key: string, v: number) {
    return { ...s, atributos: { ...atributos, [key]: v } };
  }
  function setPericia(name: string, patch: Pericia) {
    return { ...s, pericias: { ...pericias, [name]: { ...pericias[name], ...patch } } };
  }

  function rollSkill(name: string, value: number) {
    const dtRaw = window.prompt(`Dificuldade (DT) para ${name}? Deixe vazio para rolar sem DT.`, "");
    if (dtRaw === null) return; // cancelou
    const dt = dtRaw.trim() === "" ? null : Math.trunc(Number(dtRaw));
    const natural = 1 + Math.floor(Math.random() * 20);
    const line: RollLine = {
      id: rollId.current++, label: name, natural, bonus: value, total: natural + value,
      dt: dt != null && Number.isFinite(dt) ? dt : null,
      crit: natural === 20, fumble: natural === 1,
    };
    setRolls((r) => [line, ...r].slice(0, 12));
  }

  if (!catalog) return <p className="muted">Carregando catálogo do Tormenta 20…</p>;

  return (
    <div data-testid="t20-sheet" className="t20-sheet">
      {/* Identidade */}
      <div className="t20-idrow">
        <label>Nível
          <input type="number" min={1} max={20} value={nivel} data-testid="t20-nivel"
            onChange={(e) => setLocal({ ...s, nivel: num(e.target.value, 1) })}
            onBlur={() => commit(s)} style={{ marginTop: 6 }} />
        </label>
        <label>Classe
          <select value={str(s.classe)} data-testid="t20-classe" onChange={(e) => commit({ ...s, classe: e.target.value })} style={{ marginTop: 6 }}>
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
        <label style={{ flex: 1 }}>Origem
          <input value={str(s.origem)} data-testid="t20-origem" placeholder="ex.: Acólito, Batedor…"
            onChange={(e) => setLocal({ ...s, origem: e.target.value })} onBlur={() => commit(s)} style={{ marginTop: 6 }} />
        </label>
      </div>

      {/* Derivados */}
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

      {/* Atributos */}
      <h4 className="t20-h">Atributos</h4>
      <div className="t20-attrs">
        {attrDefs.map((a) => (
          <label key={a.key} className="t20-attr" data-testid={`t20-attr-${a.key}`}>
            <span className="t20-attr-abbr">{a.abbr}</span>
            <input type="number" value={num(atributos[a.key])}
              onChange={(e) => setLocal(setAttr(a.key, num(e.target.value)))}
              onBlur={() => commit(s)} />
            <span className="t20-attr-label">{a.label}</span>
          </label>
        ))}
      </div>

      {/* Defesa (equipamento) */}
      <div className="t20-armorrow">
        <label>Armadura <input type="number" value={num(s.armadura)} data-testid="t20-armadura"
          onChange={(e) => setLocal({ ...s, armadura: num(e.target.value) })} onBlur={() => commit(s)} /></label>
        <label>Escudo <input type="number" value={num(s.escudo)}
          onChange={(e) => setLocal({ ...s, escudo: num(e.target.value) })} onBlur={() => commit(s)} /></label>
        <label>Outros <input type="number" value={num(s.defesaOutros)}
          onChange={(e) => setLocal({ ...s, defesaOutros: num(e.target.value) })} onBlur={() => commit(s)} /></label>
      </div>

      {/* Perícias */}
      <h4 className="t20-h">Perícias</h4>
      <div className="t20-skills" data-testid="t20-skills">
        {skillDefs.map((sk) => {
          const p = pericias[sk.name] ?? {};
          const attr = num(atributos[sk.key]);
          const val = skillValue(nivel, attr, p.treinada === true, num(p.outros));
          const abbr = attrDefs.find((a) => a.key === sk.key)?.abbr ?? "";
          return (
            <div key={sk.name} className="t20-skill" data-testid={`t20-skill-${sk.name}`}>
              <input type="checkbox" checked={p.treinada === true} title="Treinada"
                data-testid={`t20-skill-treinada-${sk.name}`}
                onChange={(e) => commit(setPericia(sk.name, { treinada: e.target.checked }))} />
              <span className="t20-skill-name">{sk.name}
                <span className="muted" style={{ fontSize: 11 }}> ({abbr}){sk.trainedOnly ? " ·só treinada" : ""}</span>
              </span>
              <span className="t20-skill-val" data-testid={`t20-skill-val-${sk.name}`}>{val >= 0 ? `+${val}` : val}</span>
              <button className="ghost t20-skill-roll" title="Rolar 1d20 + valor"
                data-testid={`t20-skill-roll-${sk.name}`} onClick={() => rollSkill(sk.name, val)}>🎲</button>
            </div>
          );
        })}
      </div>

      {/* Resultados de rolagem */}
      {rolls.length > 0 && (
        <div className="t20-rolls" data-testid="t20-rolls">
          <h4 className="t20-h">Rolagens</h4>
          {rolls.map((r) => (
            <div key={r.id} className={`t20-roll${r.dt != null ? (r.total >= r.dt ? " ok" : " fail") : ""}`}>
              <b>{r.label}</b>
              <span className="mono"> 1d20 ({r.natural}) {r.bonus >= 0 ? "+" : ""}{r.bonus} = <b>{r.total}</b></span>
              {r.dt != null && <span className="muted"> vs DT {r.dt} → {r.total >= r.dt ? "sucesso" : "falha"}</span>}
              {r.crit && <span style={{ color: "var(--ok)" }}> · 20 natural!</span>}
              {r.fumble && <span style={{ color: "var(--err)" }}> · 1 natural</span>}
            </div>
          ))}
        </div>
      )}
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
