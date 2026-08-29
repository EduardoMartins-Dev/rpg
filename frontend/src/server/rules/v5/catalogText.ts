/**
 * Port of backend/src/main/java/com/portalrpg/rules/V5CatalogText.java. Renders the V5
 * catalog (the app's own reference data) as compact text to give the LLM the CANONICAL
 * list — the 13 clans, disciplines, and coterie types — for completeness on broad
 * questions without depending on retrieval. The book (RAG) details each one.
 */
import * as V5Catalog from "./catalog";
import type { ClanInfo, DisciplineInfo } from "./catalog";

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase();
}

/** true if the normalized question contains the normalized term, guarded by min length. */
function mentions(qn: string, term: string | null | undefined): boolean {
  if (!term) return false;
  const t = normalize(term);
  return t.length >= 4 && qn.includes(t);
}

/** A discipline is relevant if the question cites its name or one of its powers' name (PT or EN). */
function disciplineRelevant(qn: string, d: DisciplineInfo): boolean {
  if (mentions(qn, d.name)) return true;
  return d.powers.some((p) => mentions(qn, p.name) || mentions(qn, p.en));
}

function disciplineLines(d: DisciplineInfo): string {
  const powers = [...d.powers]
    .sort((a, b) => a.level - b.level)
    .map((p) => `N${p.level} ${p.name}${p.en ? ` [${p.en}]` : ""}`)
    .join("; ");
  return `- ${d.name} — ${d.summary} Poderes: ${powers}.`;
}

function clanLine(c: ClanInfo): string {
  const disc = c.disciplines.join(", ");
  return `- ${c.label}: ${c.description} Disciplinas de clã: ${disc.length === 0 ? "(especiais)" : disc}.`;
}

/** Contextual reference block: names always; detail only for what the question cites. */
export function referenceBlock(question?: string | null): string {
  const qn = normalize(question ?? "");

  const clanNames = V5Catalog.clans().map((c) => c.label).join(", ");
  const discNames = V5Catalog.disciplines().map((d) => d.name).join(", ");
  const coteries = V5Catalog.coterieTypes().map((c) => c.name).join(", ");

  // "clã/clãs/clan/clans" (word) — after diacritics-strip normalization, "clã" -> "cla".
  const broadClans = /\bcla[sn]?\b/.test(qn);
  const clansDetail = V5Catalog.clans().filter((c) => broadClans || mentions(qn, c.label));
  const discDetail = V5Catalog.disciplines().filter((d) => disciplineRelevant(qn, d));

  let out = `REFERÊNCIA OFICIAL DO SISTEMA (Vampiro: A Máscara V5) — lista canônica.
Use esta lista como verdade para os NOMES e NÍVEIS de clãs, disciplinas e
poderes; os trechos do livro detalham custo/mecânica de cada um. NÃO invente
poderes fora desta lista nem custos de experiência.
`;
  out += `\nOs 13 clãs: ${clanNames}`;
  out += `\nDisciplinas: ${discNames}`;
  out += `\nTipos de coterie: ${coteries}`;

  if (clansDetail.length > 0) {
    out += `\n\nDetalhe de clã:\n${clansDetail.map(clanLine).join("\n")}`;
  }
  if (discDetail.length > 0) {
    out += `\n\nPoderes por nível (nomes canônicos):\n${discDetail.map(disciplineLines).join("\n\n")}`;
  }
  return out;
}

/** Terms to EXPAND the retrieval query: names (PT + English) of powers of disciplines
 * mentioned in the question. Empty if no discipline is mentioned. */
export function retrievalExpansion(question?: string | null): string {
  const qn = normalize(question ?? "");
  return V5Catalog.disciplines()
    .filter((d) => disciplineRelevant(qn, d))
    .flatMap((d) => d.powers)
    .flatMap((p) => [p.name, p.en])
    .filter((s): s is string => !!s && s.trim().length > 0)
    .join(" ");
}

/** One search query PER POWER (PT name + English) for the disciplines mentioned. */
export function powerQueries(question?: string | null): string[] {
  const qn = normalize(question ?? "");
  return V5Catalog.disciplines()
    .filter((d) => disciplineRelevant(qn, d))
    .flatMap((d) => d.powers)
    .map((p) => (p.en == null ? p.name : `${p.name} ${p.en}`));
}

/** English power names for the disciplines mentioned — exact terms for keyword search. */
export function powerKeywords(question?: string | null): string[] {
  const qn = normalize(question ?? "");
  return V5Catalog.disciplines()
    .filter((d) => disciplineRelevant(qn, d))
    .flatMap((d) => d.powers)
    .map((p) => p.en)
    .filter((s): s is string => !!s && s.trim().length > 0);
}

export { normalize };
