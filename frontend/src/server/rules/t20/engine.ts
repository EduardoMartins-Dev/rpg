/**
 * Motor de regras do Tormenta 20 (livro básico). Puro e determinístico, sem I/O —
 * espelha o papel do v5/engine.ts, mas para um sistema d20 completamente diferente
 * (rola 1d20 + valor vs. uma Dificuldade/DT). Não interfere no V5: é um módulo à parte,
 * escolhido pelo ruleset do sistema.
 *
 * Fórmulas confirmadas no livro básico:
 *  - Valor de perícia = ⌊nível/2⌋ + atributo-chave + bônus de treinamento (pág. da perícia).
 *  - Bônus de treinamento (se treinado): +2 (1º–6º), +4 (7º–14º), +6 (15º–20º).
 *  - Defesa = 10 + Destreza + bônus de armadura + bônus de escudo (+ outros).
 *  - PV: base da classe + Constituição no 1º nível; +ganho por nível (+Con) a cada nível.
 *  - PM: ganho por nível da classe × nível.
 */

export const ATTRIBUTE_MIN = -5;
export const ATTRIBUTE_MAX = 10;
export const LEVEL_MIN = 1;
export const LEVEL_MAX = 20;

/** Bônus de treinamento por nível (só conta em perícia treinada). */
export function trainingBonus(level: number): number {
  if (level >= 15) return 6;
  if (level >= 7) return 4;
  return 2;
}

/** Valor de perícia = ⌊nível/2⌋ + atributo-chave + (treinado ? treino : 0) + outros. */
export function skillValue(level: number, keyAttr: number, trained: boolean, other = 0): number {
  const half = Math.floor(level / 2);
  return half + keyAttr + (trained ? trainingBonus(level) : 0) + other;
}

/** Defesa = 10 + Destreza + armadura + escudo + outros. */
export function defense(des: number, armor = 0, shield = 0, other = 0): number {
  return 10 + des + armor + shield + other;
}

/**
 * PV máximo. `base` = PV no 1º nível (antes de Con); `perLevel` = ganho por nível seguinte
 * (antes de Con). Constituição entra em TODOS os níveis. Ex.: guerreiro (20/+5) nível 3, Con 2
 * → 20 + 2×5 + 3×2 = 36.
 */
export function pvMax(base: number, perLevel: number, level: number, con: number): number {
  return base + (level - 1) * perLevel + level * con;
}

/** PM máximo = ganho por nível da classe × nível. */
export function pmMax(perLevel: number, level: number): number {
  return perLevel * level;
}

// --- Rolagem d20 --------------------------------------------------------------------

export type D20Result = {
  faces: number[];      // dados rolados (normalmente 1; 2+ quando há vantagem/desvantagem)
  natural: number;      // o d20 que conta (maior na vantagem, menor na desvantagem)
  bonus: number;
  total: number;        // natural + bonus
  dt: number | null;    // Dificuldade; null = rolagem sem DT (só total)
  success: boolean | null;
  critical: boolean;    // 20 natural
  fumble: boolean;      // 1 natural
};

export type D20Mode = "normal" | "vantagem" | "desvantagem";

/** Resolve uma rolagem d20 a partir das faces já sorteadas (determinístico). */
export function resolveD20(faces: number[], bonus: number, dt: number | null, mode: D20Mode = "normal"): D20Result {
  if (faces.length === 0) throw new Error("é preciso ao menos 1 dado");
  for (const f of faces) if (f < 1 || f > 20) throw new Error(`face de d20 fora de 1–20: ${f}`);
  const natural = mode === "desvantagem" ? Math.min(...faces) : mode === "vantagem" ? Math.max(...faces) : faces[0];
  const total = natural + bonus;
  return {
    faces: [...faces],
    natural,
    bonus,
    total,
    dt,
    success: dt == null ? null : total >= dt,
    critical: natural === 20,
    fumble: natural === 1,
  };
}

export function requireAttributeRange(v: number): void {
  if (v < ATTRIBUTE_MIN || v > ATTRIBUTE_MAX) throw new Error(`atributo fora de ${ATTRIBUTE_MIN}–${ATTRIBUTE_MAX}: ${v}`);
}

export function requireLevelRange(v: number): void {
  if (v < LEVEL_MIN || v > LEVEL_MAX) throw new Error(`nível fora de ${LEVEL_MIN}–${LEVEL_MAX}: ${v}`);
}
