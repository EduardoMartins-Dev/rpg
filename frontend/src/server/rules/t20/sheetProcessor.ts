/**
 * Processador de ficha do Tormenta 20. Valida o sheetData e recalcula os campos
 * DERIVADOS no servidor (nunca confiando no cliente): valor de cada perícia, PV/PM
 * máximos e Defesa. Espelha o papel de v5/sheetProcessor.ts, para o ruleset "t20".
 *
 * Formato do sheetData (T20):
 *   {
 *     type: "T20",
 *     nivel: number, classe: string, raca: string, origem: string,
 *     atributos: { forca, destreza, constituicao, inteligencia, sabedoria, carisma },
 *     pericias: { [nome]: { treinada?: boolean, outros?: number } },
 *     armadura: number, escudo: number, defesaOutros: number,
 *     pvDano: number, pmGasto: number,           // estado de sessão
 *     derived: { pvMax, pmMax, defesa, pericias: { [nome]: valor } }  // recomputado aqui
 *   }
 */
import { ApiError } from "@/server/http/errors";
import * as Cat from "./catalog";
import * as Eng from "./engine";

export type SheetData = Record<string, unknown>;
export type SheetSchema = { attributes?: string[]; skills?: string[]; [k: string]: unknown } | null | undefined;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function toInt(value: unknown, dflt: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Math.trunc(Number(value));
  return dflt;
}

function readAttributes(sheet: SheetData): Record<Cat.AttrKey, number> {
  const raw = isPlainObject(sheet.atributos) ? sheet.atributos : {};
  const out = {} as Record<Cat.AttrKey, number>;
  for (const k of Cat.ATTRIBUTE_KEYS) {
    const v = toInt(raw[k], 0);
    Eng.requireAttributeRange(v);
    out[k] = v;
  }
  return out;
}

/** Valida contra o catálogo e devolve a ficha enriquecida (uma cópia) com `derived`. */
export function process(sheetData: unknown): SheetData {
  if (!isPlainObject(sheetData)) {
    throw ApiError.badRequest("sheetData must be a JSON object");
  }
  const sheet: SheetData = structuredClone(sheetData);
  sheet.type = "T20";

  const nivel = toInt(sheet.nivel, 1);
  Eng.requireLevelRange(nivel);
  sheet.nivel = nivel;

  const attrs = readAttributes(sheet);
  sheet.atributos = attrs;

  // Perícias: só nomes conhecidos; guarda { treinada, outros }.
  const periciasIn = isPlainObject(sheet.pericias) ? sheet.pericias : {};
  const pericias: Record<string, { treinada: boolean; outros: number }> = {};
  const derivedPericias: Record<string, number> = {};
  for (const sk of Cat.SKILLS) {
    const entry = isPlainObject(periciasIn[sk.name]) ? (periciasIn[sk.name] as Record<string, unknown>) : {};
    const treinada = entry.treinada === true;
    const outros = toInt(entry.outros, 0);
    pericias[sk.name] = { treinada, outros };
    derivedPericias[sk.name] = Eng.skillValue(nivel, attrs[sk.key], treinada, outros);
  }
  // Rejeita nomes de perícia desconhecidos (erro de digitação no cliente).
  for (const name of Object.keys(periciasIn)) {
    if (!Cat.skill(name)) throw ApiError.badRequest(`unknown skill: ${name}`);
  }
  sheet.pericias = pericias;

  // Classe (opcional): dita PV/PM. Se ausente/desconhecida, PV/PM ficam nulos.
  const classe = typeof sheet.classe === "string" ? sheet.classe.trim() : "";
  const cls = classe ? Cat.classInfo(classe) : undefined;
  if (classe && !cls) throw ApiError.badRequest(`unknown class: ${classe}`);
  sheet.classe = cls ? cls.id : "";

  const con = attrs.constituicao;
  const des = attrs.destreza;
  const armadura = toInt(sheet.armadura, 0);
  const escudo = toInt(sheet.escudo, 0);
  const defesaOutros = toInt(sheet.defesaOutros, 0);
  sheet.armadura = armadura;
  sheet.escudo = escudo;
  sheet.defesaOutros = defesaOutros;

  sheet.derived = {
    pvMax: cls ? Eng.pvMax(cls.pvBase, cls.pvPerLevel, nivel, con) : null,
    pmMax: cls ? Eng.pmMax(cls.pmPerLevel, nivel) : null,
    defesa: Eng.defense(des, armadura, escudo, defesaOutros),
    pericias: derivedPericias,
  };

  return sheet;
}
