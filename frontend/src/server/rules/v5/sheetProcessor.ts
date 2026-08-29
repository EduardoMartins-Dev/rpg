/**
 * Port of backend/src/main/java/com/portalrpg/character/V5SheetProcessor.java.
 * Interprets the character sheet (dynamic jsonb) applying the V5 engine. The STRUCTURE
 * of fields comes from the system's sheet-schema (declared attributes/skills), the
 * numeric RULES come from ./engine. Server-computed fields (derived/clanDisciplines/
 * bane/compulsion) are overwritten here — never trusted from client input.
 */
import { ApiError } from "@/server/http/errors";
import * as V5Catalog from "./catalog";
import * as V5Engine from "./engine";

export type SheetData = Record<string, unknown>;
export type SheetSchema = { attributes?: string[]; skills?: string[]; [key: string]: unknown } | null | undefined;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function hasNonNull(obj: Record<string, unknown>, key: string): boolean {
  return key in obj && obj[key] != null;
}

/** Mirrors Jackson's lenient JsonNode.canConvertToInt()+asInt(): accepts a number or a
 * numeric string; returns null if not convertible. */
function toInt(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.trunc(value) : null;
  }
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Math.trunc(Number(value));
  }
  return null;
}

function parseType(sheet: SheetData): V5Catalog.CharacterType {
  const raw = typeof sheet.type === "string" ? sheet.type : "VAMPIRO";
  const upper = raw.trim().toUpperCase();
  if (!(V5Catalog.CHARACTER_TYPES as readonly string[]).includes(upper)) {
    throw ApiError.badRequest(`unknown character type: ${raw}`);
  }
  sheet.type = upper;
  return upper as V5Catalog.CharacterType;
}

function declaredNames(schema: SheetSchema, group: "attributes" | "skills"): Set<string> {
  const names = new Set<string>();
  const arr = schema?.[group];
  if (Array.isArray(arr)) {
    for (const n of arr) names.add(String(n));
  }
  return names;
}

function validateGroup(sheet: SheetData, schema: SheetSchema, group: "attributes" | "skills"): void {
  const node = sheet[group];
  if (node == null) return;
  if (!isPlainObject(node)) {
    throw ApiError.badRequest(`${group} must be a JSON object of name→value`);
  }
  const declared = declaredNames(schema, group);
  for (const [key, value] of Object.entries(node)) {
    if (declared.size > 0 && !declared.has(key)) {
      throw ApiError.badRequest(`unknown ${group} field: ${key}`);
    }
    const intValue = toInt(value);
    if (intValue === null) {
      throw ApiError.badRequest(`${group}.${key} must be an integer`);
    }
    try {
      V5Engine.requireTraitRange(intValue);
    } catch (e) {
      throw ApiError.badRequest(`${group}.${key}: ${e instanceof Error ? e.message : "invalid"}`);
    }
  }
}

/** Attributes/skills: belong to the schema (if declared) and stay in range 1–5; Hunger 0–5. */
function validateTraits(sheet: SheetData, schema: SheetSchema): void {
  validateGroup(sheet, schema, "attributes");
  validateGroup(sheet, schema, "skills");
  if (hasNonNull(sheet, "hunger")) {
    const h = toInt(sheet.hunger);
    try {
      V5Engine.requireHungerRange(h ?? NaN);
    } catch (e) {
      throw ApiError.badRequest(e instanceof Error ? e.message : "invalid hunger");
    }
  }
}

/** Selecting a clan auto-populates disciplines + bane + compulsion. */
function autoPopulateClan(sheet: SheetData): void {
  if (!hasNonNull(sheet, "clan")) return;
  let info: V5Catalog.ClanInfo;
  try {
    info = V5Catalog.clan(V5Catalog.clanOf(String(sheet.clan)));
  } catch (e) {
    throw ApiError.badRequest(e instanceof Error ? e.message : "unknown clan");
  }
  sheet.clan = info.clan;
  sheet.clanDisciplines = [...info.disciplines];
  sheet.bane = info.bane;
  sheet.compulsion = info.compulsion;
}

/** Mortal has no clan/disciplines/predator type. Carniçal/Vampiro have a clan. */
function applyTypeRules(sheet: SheetData, type: V5Catalog.CharacterType): void {
  if (type === "MORTAL") {
    if (hasNonNull(sheet, "clan") || hasNonNull(sheet, "predatorType")) {
      throw ApiError.badRequest("mortal has no clan or predator type");
    }
    delete sheet.clanDisciplines;
    delete sheet.bane;
    delete sheet.compulsion;
    return;
  }
  autoPopulateClan(sheet);
}

/** Vitality = Vigor+3; Willpower = Autocontrole+Determinação. Always recomputed. */
function recomputeDerived(sheet: SheetData): void {
  const attrs = sheet.attributes;
  if (!isPlainObject(attrs)) return;
  const derived: Record<string, number> = {};
  if (attrs.vigor != null) {
    derived.vitality = V5Engine.vitality(toInt(attrs.vigor) ?? 0);
  }
  if (attrs.autocontrole != null && attrs.determinacao != null) {
    derived.willpower = V5Engine.willpower(toInt(attrs.autocontrole) ?? 0, toInt(attrs.determinacao) ?? 0);
  }
  sheet.derived = derived;
}

/** Validates against the schema, applies V5 rules, and returns the enriched sheet (a copy). */
export function process(sheetData: unknown, schema: SheetSchema): SheetData {
  if (!isPlainObject(sheetData)) {
    throw ApiError.badRequest("sheetData must be a JSON object");
  }
  const sheet: SheetData = structuredClone(sheetData);
  const type = parseType(sheet);
  validateTraits(sheet, schema);
  applyTypeRules(sheet, type);
  recomputeDerived(sheet);
  return sheet;
}
