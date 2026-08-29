/**
 * Port of backend/src/main/java/com/portalrpg/rag/DocumentChunkStore.java. Raw SQL
 * (postgres.js) against document_chunks — keeps the pgvector type out of the ORM, same
 * rationale as the Java version's hand-rolled JdbcTemplate usage. KNN search is ALWAYS
 * filtered by system_id (mandatory isolation between systems).
 */
import { sqlRaw } from "@/server/db/client";
import type { RetrievedChunk } from "./types";

function toVectorLiteral(v: number[]): string {
  return `[${v.join(",")}]`;
}

export async function deleteByDocument(documentId: string): Promise<void> {
  await sqlRaw`DELETE FROM document_chunks WHERE document_id = ${documentId}`;
}

/** Deletes all chunks for a system (used by "clear index"/reindex). Returns the count removed. */
export async function deleteBySystem(systemId: string): Promise<number> {
  const result = await sqlRaw`DELETE FROM document_chunks WHERE system_id = ${systemId}`;
  return result.count;
}

export async function insert(documentId: string, systemId: string, content: string, embedding: number[]): Promise<void> {
  await sqlRaw`
    INSERT INTO document_chunks (document_id, system_id, content, embedding)
    VALUES (${documentId}, ${systemId}, ${content}, CAST(${toVectorLiteral(embedding)} AS vector))
  `;
}

/** Top-k nearest chunks (cosine) WITHIN the given system_id. */
export async function search(systemId: string, queryEmbedding: number[], k: number): Promise<RetrievedChunk[]> {
  // Small corpus: probe all ivfflat lists for exact-ish KNN (avoids misses with the
  // default lists=100/probes=1). SET LOCAL only applies within this one transaction.
  return sqlRaw.begin(async (tx) => {
    await tx`SET LOCAL ivfflat.probes = 100`;
    const rows = await tx<{ content: string; system_id: string }[]>`
      SELECT content, system_id FROM document_chunks
      WHERE system_id = ${systemId}
      ORDER BY embedding <=> CAST(${toVectorLiteral(queryEmbedding)} AS vector)
      LIMIT ${k}
    `;
    return rows.map((r) => ({ content: r.content, systemId: r.system_id }));
  });
}

/**
 * Keyword (substring, case-insensitive) search within the system_id. Needed because
 * vector search can't distinguish near-identical passages differing by one word (e.g.
 * "draught of elegance" [Celeridade] vs "draught of endurance" [Fortitude]) — the power
 * name, now glued to the chunk, matches exactly here. Prefers the passage whose name
 * appears closest to the start (the power's own body, not a passing mention).
 */
export async function searchByKeyword(systemId: string, term: string, limit: number): Promise<RetrievedChunk[]> {
  // Tolerant pattern: apostrophe (straight or curly) becomes a 1-char wildcard and each
  // run of whitespace becomes '%', to match possessive names (Baal's Caress) and names
  // the PDF extractor split across a line break ("Draught of\nEndurance"). Escapes the
  // term's own literal wildcards first.
  const esc = term.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
  const flexible = esc.replace(/['’‘`´]/g, "_").replace(/\s+/g, "%");
  const like = `%${flexible}%`;
  const rows = await sqlRaw<{ content: string; system_id: string }[]>`
    SELECT content, system_id FROM document_chunks
    WHERE system_id = ${systemId} AND content ILIKE ${like}
    ORDER BY length(content) ASC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({ content: r.content, systemId: r.system_id }));
}

export async function countBySystem(systemId: string): Promise<number> {
  const [row] = await sqlRaw<{ n: string }[]>`SELECT count(*)::text AS n FROM document_chunks WHERE system_id = ${systemId}`;
  return row ? Number(row.n) : 0;
}
