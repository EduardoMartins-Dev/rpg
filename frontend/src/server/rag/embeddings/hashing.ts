/**
 * Byte-identical port of backend/src/main/java/com/portalrpg/rag/HashingEmbeddingModel.java.
 *
 * This is the DEFAULT embedding provider (deterministic, no network call) and — per
 * DEPLOY.md — is also what production has been using for retrieval (EMBEDDINGS_PROVIDER
 * was never set to "jina" in render.yaml). The vectors already stored in
 * document_chunks.embedding for indexed PDFs were computed by the Java version of this
 * exact algorithm, so this port MUST reproduce it bit-for-bit or existing search results
 * silently degrade. See parity test in hashing.parity.test.ts.
 */

export const DIM = 1024;

/** Java's String.hashCode(): h = 31*h + c, 32-bit signed overflow. */
function javaStringHashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

/** Java's Math.floorMod(x, DIM): always non-negative for positive DIM. */
function floorMod(x: number, dim: number): number {
  return ((x % dim) + dim) % dim;
}

export function embed(text: string | null | undefined): number[] {
  const v = new Array<number>(DIM).fill(0);
  if (!text || text.trim().length === 0) {
    return v;
  }
  const norm = text
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase();
  for (const token of norm.split(/[^a-z0-9]+/)) {
    if (token.length < 2) continue;
    const bucket = floorMod(javaStringHashCode(token), DIM);
    v[bucket] += 1.0;
  }
  let norm2 = 0;
  for (const f of v) norm2 += f * f;
  if (norm2 > 0) {
    const inv = 1.0 / Math.sqrt(norm2);
    for (let i = 0; i < DIM; i++) v[i] *= inv;
  }
  return v;
}

export function embedAll(texts: string[]): number[][] {
  return texts.map(embed);
}
