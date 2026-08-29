/**
 * Port of backend/src/main/java/com/portalrpg/rules/V5Engine.java — pure V5 rules
 * engine, no I/O, fully deterministic. No REST endpoint currently exposes this (dice
 * roll / damage / XP / point-buy), same as in the Java backend — ported for parity in
 * case a future feature needs it.
 */

export const TRAIT_MIN = 1;
export const TRAIT_MAX = 5;
export const HUNGER_MIN = 0;
export const HUNGER_MAX = 5;

// --- Derivados -----------------------------------------------------------------

/** Vitalidade = Vigor + 3. */
export function vitality(vigor: number): number {
  return vigor + 3;
}

/** Força de Vontade = Autocontrole + Determinação. */
export function willpower(composure: number, resolve: number): number {
  return composure + resolve;
}

export function requireTraitRange(value: number): void {
  if (value < TRAIT_MIN || value > TRAIT_MAX) {
    throw new Error(`trait out of range 1–5: ${value}`);
  }
}

export function requireHungerRange(value: number): void {
  if (value < HUNGER_MIN || value > HUNGER_MAX) {
    throw new Error(`hunger out of range 0–5: ${value}`);
  }
}

// --- Rolagem --------------------------------------------------------------------

export type Die = { face: number; hunger: boolean };

function makeDie(face: number, hunger: boolean): Die {
  if (face < 1 || face > 10) {
    throw new Error(`die face out of range 1–10: ${face}`);
  }
  return { face, hunger };
}

export type RollOutcome = "CRITICAL_WIN" | "WIN" | "FAILURE" | "BESTIAL_FAILURE";

export type RollResult = {
  dice: Die[];
  difficulty: number;
  successes: number;
  outcome: RollOutcome;
  criticalWin: boolean;
  bloodyCritical: boolean;
  bestialFailure: boolean;
};

/** Dice pool composition: Hunger dice replace normal dice, fixed total size. */
export type DicePool = { total: number; normal: number; hunger: number };

export function pool(attribute: number, skill: number, hunger: number): DicePool {
  requireHungerRange(hunger);
  const total = attribute + skill;
  const hungerDice = Math.min(hunger, total);
  return { total, normal: total - hungerDice, hunger: hungerDice };
}

function evaluateDice(dice: Die[], difficulty: number): RollResult {
  let tens = 0;
  let hungerTens = 0;
  let hungerOnes = 0;
  let base = 0;
  for (const d of dice) {
    if (d.face >= 6) base++;
    if (d.face === 10) {
      tens++;
      if (d.hunger) hungerTens++;
    }
    if (d.face === 1 && d.hunger) hungerOnes++;
  }
  // pair of 10s = 4 successes: each pair adds +2 beyond the 2 already counted in base.
  const successes = base + 2 * Math.floor(tens / 2);
  const win = successes >= difficulty;
  const criticalWin = win && tens >= 2;
  const bloodyCritical = criticalWin && hungerTens >= 1;
  const bestialFailure = !win && hungerOnes >= 1;

  let outcome: RollOutcome;
  if (criticalWin) outcome = "CRITICAL_WIN";
  else if (win) outcome = "WIN";
  else if (bestialFailure) outcome = "BESTIAL_FAILURE";
  else outcome = "FAILURE";

  return { dice: [...dice], difficulty, successes, outcome, criticalWin, bloodyCritical, bestialFailure };
}

/** Evaluates a roll from the dice faces. Deterministic: takes faces, not a rng. */
export function evaluate(normalFaces: number[], hungerFaces: number[], difficulty: number): RollResult {
  const dice: Die[] = [
    ...normalFaces.map((f) => makeDie(f, false)),
    ...hungerFaces.map((f) => makeDie(f, true)),
  ];
  return evaluateDice(dice, difficulty);
}

/** Live roll: builds the pool and draws faces via the given d10 supplier. */
export function roll(attribute: number, skill: number, hunger: number, difficulty: number, d10: () => number): RollResult {
  const p = pool(attribute, skill, hunger);
  const normal: number[] = [];
  const hungerFaces: number[] = [];
  for (let i = 0; i < p.normal; i++) normal.push(d10());
  for (let i = 0; i < p.hunger; i++) hungerFaces.push(d10());
  return evaluate(normal, hungerFaces, difficulty);
}

/** Willpower rerolls up to 3 NORMAL dice. A Hunger die never rerolls. `dieIndices`
 * point into `prev.dice`; `newFaces` carries the new faces in the same order. */
export function willpowerReroll(prev: RollResult, dieIndices: number[], newFaces: number[]): RollResult {
  if (dieIndices.length > 3) {
    throw new Error("willpower rerolls at most 3 dice");
  }
  if (dieIndices.length !== newFaces.length) {
    throw new Error("dieIndices and newFaces must match");
  }
  const dice = [...prev.dice];
  for (let k = 0; k < dieIndices.length; k++) {
    const idx = dieIndices[k];
    const d = dice[idx];
    if (d.hunger) {
      throw new Error("cannot reroll a Hunger die");
    }
    dice[idx] = makeDie(newFaces[k], false);
  }
  return evaluateDice(dice, prev.difficulty);
}

/** Companion errata: Compulsion can trigger on Bestial Failure OR Bloody Critical. */
export function compulsionTriggered(r: RollResult): boolean {
  return r.bestialFailure || r.bloodyCritical;
}

// --- Rouse Check ------------------------------------------------------------------

export type RouseResult = { hunger: number; increased: boolean };

/** 1 die: <6 -> Hunger+1 (capped at 5); 6+ keeps it. */
export function rouse(currentHunger: number, face: number): RouseResult {
  requireHungerRange(currentHunger);
  if (face < 6) {
    return { hunger: Math.min(HUNGER_MAX, currentHunger + 1), increased: true };
  }
  return { hunger: currentHunger, increased: false };
}

// --- Dano ---------------------------------------------------------------------------

export type HealthTrack = { max: number; superficial: number; aggravated: number };

function makeHealthTrack(max: number, superficial: number, aggravated: number): HealthTrack {
  if (max < 0 || superficial < 0 || aggravated < 0) {
    throw new Error("track values must be non-negative");
  }
  return { max, superficial, aggravated };
}

export function totalMarked(t: HealthTrack): number {
  return t.superficial + t.aggravated;
}

/** Full track -> Impaired (-2 dice penalty on linked pools). */
export function impaired(t: HealthTrack): boolean {
  return totalMarked(t) >= t.max;
}

export function penalty(t: HealthTrack): number {
  return impaired(t) ? -2 : 0;
}

/** Full aggravated track -> torpor. */
export function torpor(t: HealthTrack): boolean {
  return t.aggravated >= t.max;
}

function markSuperficial(t: HealthTrack, amount: number): HealthTrack {
  let superficial = t.superficial + amount;
  let aggravated = t.aggravated;
  const total = superficial + aggravated;
  if (total > t.max) {
    // superficial overflow is promoted to aggravated, one-for-one
    const overflow = total - t.max;
    aggravated = Math.min(t.max, aggravated + overflow);
    superficial = Math.max(0, t.max - aggravated);
  }
  return makeHealthTrack(t.max, superficial, aggravated);
}

/** Vampiric superficial damage: halved rounding up before marking. */
export function applySuperficialVampiric(t: HealthTrack, raw: number): HealthTrack {
  const halved = Math.floor((raw + 1) / 2);
  return markSuperficial(t, halved);
}

/** Aggravated damage is never reduced. */
export function applyAggravated(t: HealthTrack, raw: number): HealthTrack {
  const aggravated = Math.min(t.max, t.aggravated + raw);
  const superficial = Math.min(t.superficial, Math.max(0, t.max - aggravated));
  return makeHealthTrack(t.max, superficial, aggravated);
}

// --- XP --------------------------------------------------------------------------------

export type TraitType =
  | "ATTRIBUTE"
  | "ABILITY"
  | "SPECIALIZATION"
  | "CLAN_DISCIPLINE"
  | "OTHER_DISCIPLINE"
  | "CAITIFF_DISCIPLINE"
  | "ADVANTAGE"
  | "BLOOD_POTENCY";

/** XP cost of buying `newLevel` (or, for an advantage, `newLevel` points). */
export function xpCost(type: TraitType, newLevel: number): number {
  if (newLevel < 1) {
    throw new Error("newLevel must be >= 1");
  }
  switch (type) {
    case "ATTRIBUTE": return newLevel * 5;
    case "ABILITY": return newLevel * 3;
    case "SPECIALIZATION": return 3;
    case "CLAN_DISCIPLINE": return newLevel * 5;
    case "OTHER_DISCIPLINE": return newLevel * 7;
    case "CAITIFF_DISCIPLINE": return newLevel * 6;
    case "ADVANTAGE": return newLevel * 3;
    case "BLOOD_POTENCY": return newLevel * 10;
  }
}

/** Raise 1 level (can't skip levels): cost of currentLevel -> currentLevel+1. */
export function xpCostRaise(type: TraitType, currentLevel: number): number {
  return xpCost(type, currentLevel + 1);
}

// --- Point-buy de criação -----------------------------------------------------------------

/** Attribute pattern: one 4, three 3s, four 2s, one 1 (fixed multiset). */
const ATTRIBUTE_PATTERN = [4, 3, 3, 3, 2, 2, 2, 2, 1].slice().sort((a, b) => a - b);

export function isValidAttributeSpread(values: number[]): boolean {
  if (values.length !== ATTRIBUTE_PATTERN.length) return false;
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted.every((v, i) => v === ATTRIBUTE_PATTERN[i]);
}

export function requireValidAttributeSpread(values: number[]): void {
  if (!isValidAttributeSpread(values)) {
    throw new Error("invalid attribute spread; expected one 4, three 3, four 2, one 1");
  }
}
