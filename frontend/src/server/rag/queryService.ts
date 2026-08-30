/**
 * Port of backend/src/main/java/com/portalrpg/rag/RagQueryService.java. RAG query
 * scoped to the campaign's system_id — the system_id filter is the tested isolation
 * boundary between systems. No indexed chunks => a clear fallback, never hallucinated
 * from another corpus.
 */
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { campaigns, rpgSystems } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import * as chunkStore from "./chunkStore";
import { chatModel, embeddingModel } from "./providers";
import * as powerExplanationStore from "./powerExplanationStore";
import * as V5CatalogText from "@/server/rules/v5/catalogText";
import type { RetrievedChunk } from "./types";

export const FALLBACK = "Não há material indexado para este sistema; não posso responder com base no livro.";

/**
 * Quantos trechos vão para o gerador. Alto por padrão para cobrir todos os poderes de
 * uma disciplina (cada poder é um trecho) — dimensionado para modelos de contexto
 * grande, como o Gemini.
 *
 * Configurável porque é o que decide se o prompt cabe no limite do provedor: 40 trechos
 * de até 1100 caracteres passam de 12 mil tokens, o que estoura o teto por minuto de
 * planos menores (a Groq, por exemplo, dá 8 mil tokens/min nos modelos de uso geral) e
 * derruba a pergunta com erro de limite. Baixe RAG_TOP_K nesses casos.
 */
const TOP_K = Math.max(1, Number(process.env.RAG_TOP_K ?? 40) || 40);
// Passages per power in targeted retrieval. 3 gives slack for similar names (e.g.
// Draught of Elegance vs Draught of Endurance) — the right body comes along too.
const PER_POWER_K = 3;

export type AskResponse = {
  campaignId: string;
  systemId: string;
  question: string;
  answer: string;
  grounded: boolean;
  sources: { content: string; systemId: string }[];
};

export type Grounding = { systemId: string; chunks: RetrievedChunk[] };
export type PowerTextResponse = { systemId: string; power: string; text: string | null };

async function systemOf(campaignId: string): Promise<string> {
  const [c] = await db.select({ systemId: campaigns.systemId }).from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
  if (!c) throw ApiError.notFound("campaign not found");
  return c.systemId;
}

async function isV5(systemId: string): Promise<boolean> {
  const [s] = await db.select({ ruleset: rpgSystems.ruleset }).from(rpgSystems).where(eq(rpgSystems.id, systemId)).limit(1);
  return (s?.ruleset ?? "").toLowerCase() === "v5";
}

/** Cache key for power_explanations: strips accents, drops apostrophe variants,
 * collapses whitespace. Keep this stable — changing it orphans every explanation
 * already cached in production (each one costs LLM quota to regenerate). */
function normalize(s: string): string {
  let n = s
    .normalize("NFD")
    .replace(/\p{M}+/gu, "");
  n = n.replace(/['’‘`´]/g, "");
  n = n.replace(/\s+/g, " ").trim();
  return n.toLowerCase();
}

/**
 * Normalization for matching a power name INSIDE extracted book text. Unlike the cache
 * key above, apostrophes collapse to a space rather than vanishing, so all the spacing
 * variants text extraction produces line up: "Cat's Grace", "cat’s grace" and
 * "cat ’s grace" all become "cat s grace". Dropping the apostrophe outright made the
 * first two normalize to "cats grace" and the third to "cat s grace" — never equal.
 */
function normalizeForMatch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/['’‘`´]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Search the passage for each power of the discipline(s) mentioned. Combines (a) keyword
 * search by power name (English, glued to the chunk) — deterministic, essential for
 * near-identical power names — and (b) vector search per power, to catch the passage
 * even if the name doesn't match exactly. */
async function targetedPowerChunks(systemId: string, question: string): Promise<RetrievedChunk[]> {
  if (!(await isV5(systemId))) return [];
  const powers = V5CatalogText.powerKeywords(question);
  if (powers.length === 0) return [];

  const out: RetrievedChunk[] = [];
  for (const en of powers) {
    out.push(...(await chunkStore.searchByKeyword(systemId, en, 1)));
  }
  const queries = V5CatalogText.powerQueries(question);
  const embeddings = embeddingModel();
  const vectors = await embeddings.embedAll(queries);
  for (const v of vectors) {
    out.push(...(await chunkStore.search(systemId, v, PER_POWER_K)));
  }
  return out;
}

/** Expands the search query (v5 only) with the power names of the discipline mentioned,
 * so each power's passage is retrieved even when its text doesn't mention the
 * discipline. Doesn't change the question sent to the generator — only the search vector. */
async function expandedQuery(systemId: string, question: string): Promise<string> {
  if (!(await isV5(systemId))) return question;
  const ext = V5CatalogText.retrievalExpansion(question);
  return ext.trim().length === 0 ? question : `${question} ${ext}`;
}

/** Prepends the canonical V5 reference (if the system is v5) to the book passages. The
 * block is contextual to the question to conserve tokens. */
async function withCatalog(systemId: string, question: string, chunks: RetrievedChunk[]): Promise<RetrievedChunk[]> {
  if (chunks.length === 0) return chunks; // no indexed material: keep the fallback honest
  if (!(await isV5(systemId))) return chunks;
  return [{ content: V5CatalogText.referenceBlock(question), systemId }, ...chunks];
}

/** Combined retrieval: (1) targeted per-power search for the discipline mentioned, and
 * (2) general search on the expanded question. Merges without duplicating (targeted
 * first), then prepends the catalog. */
async function groundChunks(systemId: string, question: string): Promise<RetrievedChunk[]> {
  const embeddings = embeddingModel();
  const [targeted, general] = await Promise.all([
    targetedPowerChunks(systemId, question),
    (async () => chunkStore.search(systemId, await embeddings.embed(await expandedQuery(systemId, question)), TOP_K))(),
  ]);

  const dedup = new Map<string, RetrievedChunk>();
  for (const c of targeted) if (!dedup.has(c.content)) dedup.set(c.content, c); // targeted first = context priority
  for (const c of general) if (!dedup.has(c.content)) dedup.set(c.content, c);
  return withCatalog(systemId, question, [...dedup.values()]);
}

export async function ask(campaignId: string, question: string): Promise<AskResponse> {
  const systemId = await systemOf(campaignId);
  const chunks = await groundChunks(systemId, question);
  const grounded = chunks.length > 0;
  const chat = chatModel();
  const answer = grounded ? await chat.generate(question, chunks, systemId) : FALLBACK;
  return {
    campaignId,
    systemId,
    question,
    answer,
    grounded,
    sources: chunks.map((c) => ({ content: c.content, systemId: c.systemId })),
  };
}

/** Retrieval anchored to the campaign's system — used by history-aware chat. */
export async function retrieve(campaignId: string, question: string): Promise<Grounding> {
  const systemId = await systemOf(campaignId);
  return { systemId, chunks: await groundChunks(systemId, question) };
}

/** The FULL text of a discipline power, read straight from the indexed PDF. */
export async function powerText(campaignId: string, power: string): Promise<PowerTextResponse> {
  const systemId = await systemOf(campaignId);
  // Keyword search first: a bare power name is a 1-token query, and the lexical
  // embedding ranks it poorly against a large corpus (long chunks lose to short ones
  // under L2 normalization), so pure vector search missed powers that are plainly
  // present in the book. Vector search stays as the fallback for inexact names.
  const byKeyword = await chunkStore.searchByKeyword(systemId, power, 1);
  if (byKeyword.length > 0) {
    return { systemId, power, text: byKeyword[0].content };
  }
  const embeddings = embeddingModel();
  const chunks = await chunkStore.search(systemId, await embeddings.embed(power), 5);
  const needle = normalizeForMatch(power);
  const best = chunks.find((c) => normalizeForMatch(c.content).includes(needle));
  if (!best) {
    throw ApiError.notFound(`no indexed text found for power: ${power}`);
  }
  return { systemId, power, text: best.content };
}

/** Passages for a power: keyword by name (precise for similar names) + vector, deduped.
 * Fetches more than one chunk because a power's entry can cross a chunking boundary. */
async function chunksFor(systemId: string, power: string): Promise<RetrievedChunk[]> {
  const dedup = new Map<string, RetrievedChunk>();
  for (const c of await chunkStore.searchByKeyword(systemId, power, 3)) {
    if (!dedup.has(c.content)) dedup.set(c.content, c);
  }
  const needle = normalizeForMatch(power);
  const embeddings = embeddingModel();
  const vectorHits = await chunkStore.search(systemId, await embeddings.embed(power), 6);
  for (const c of vectorHits.filter((c) => normalizeForMatch(c.content).includes(needle))) {
    if (!dedup.has(c.content)) dedup.set(c.content, c);
  }
  return [...dedup.values()];
}

/**
 * COMPLETE PT-BR explanation of the power: the LLM translates and organizes the FULL
 * indexed book passage, anchored only to that passage. Cached per system+power. Returns
 * `text: null` when the power isn't in the index — the front falls back to the
 * catalog's short description (never left blank).
 */
export async function powerExplained(campaignId: string, power: string): Promise<PowerTextResponse> {
  const systemId = await systemOf(campaignId);
  const norm = normalize(power);
  const cached = await powerExplanationStore.find(systemId, norm);
  if (cached !== null) {
    return { systemId, power, text: cached };
  }
  const ctx = await chunksFor(systemId, power);
  if (ctx.length === 0) {
    return { systemId, power, text: null };
  }
  const question = `Traduza e reorganize para PORTUGUÊS DO BRASIL a informação COMPLETA do poder "${power}" de Vampiro: A Máscara (V5), usando SOMENTE o trecho fornecido. NÃO resuma: traga TODOS os detalhes mecânicos presentes no trecho. Responda em Markdown com as seções abaixo, cada rótulo em negrito; omita a seção só se o trecho realmente não trouxer aquilo:
**Descrição:** (o que o poder é e faz, texto integral traduzido)
**Custo:** (ex.: um Rouse Check, gratuito, etc.)
**Tipo de ação:** (simples, livre, reflexa, prolongada…)
**Parada de dados:** (o teste/disputa exato, traduzido)
**Duração:** (passiva, uma cena, uma noite…)
**Sistema:** (passo a passo de como se usa, completo)
**Amálgama:** (se o trecho citar disciplina/nível exigidos)
Não repita o nome do poder como título/cabeçalho (ele já é exibido). Não invente nada fora do trecho.`;

  let answer: string;
  try {
    answer = await chatModel().generate(question, ctx, systemId);
  } catch (e) {
    if (e instanceof ApiError) {
      // Provider error (e.g. daily quota). Don't cache; never dump the raw provider
      // error to the screen — the front keeps the catalog description.
      console.warn(`powerExplained: AI provider failure for '${power}': ${e.message}`);
      throw new ApiError(503, "Serviço de tradução do livro indisponível no momento (limite temporário). Tente novamente mais tarde.");
    }
    throw e;
  }
  await powerExplanationStore.save(systemId, norm, power, answer);
  return { systemId, power, text: answer };
}
