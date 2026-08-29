/**
 * Port of backend/src/main/java/com/portalrpg/rag/RagIndexingService.java's indexing
 * pipeline (the `chunk` static method itself lives in ./chunk.ts). Extract -> chunk ->
 * embed -> document_chunks with system_id -> status INDEXED. Idempotent: reindexing a
 * document clears its chunks first.
 */
import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { systemDocuments } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import { chunk } from "./chunk";
import * as chunkStore from "./chunkStore";
import { embeddingModel } from "./providers";
import * as storage from "@/server/storage/supabase";
import { extractBytes } from "./extract";

// How many chunks per embedding call (batch). Keeps the request short and respects
// provider limits; large documents stop making 1 call per chunk.
const EMBED_BATCH = 64;

export async function indexText(documentId: string, systemId: string, text: string): Promise<void> {
  if (!text || text.trim().length === 0) {
    throw ApiError.badRequest("no text to index");
  }
  await chunkStore.deleteByDocument(documentId);
  const chunks = chunk(text);
  const embeddings = embeddingModel();
  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const slice = chunks.slice(i, i + EMBED_BATCH);
    const vectors = await embeddings.embedAll(slice);
    for (let j = 0; j < slice.length; j++) {
      await chunkStore.insert(documentId, systemId, slice[j], vectors[j]);
    }
  }
  await db.update(systemDocuments).set({ status: "INDEXED" }).where(eq(systemDocuments.id, documentId));
}

/** Indexes a document whose bytes are already in memory (local upload path). */
export async function indexBytes(documentId: string, systemId: string, bytes: Uint8Array, filename: string): Promise<void> {
  const text = await extractBytes(bytes, filename);
  await indexText(documentId, systemId, text);
}

/** Downloads the object from Storage and indexes it (used by the async storage-upload path). */
export async function indexStorage(documentId: string, systemId: string, path: string): Promise<void> {
  const bytes = await storage.download(path);
  await indexBytes(documentId, systemId, bytes, path);
}

/** Separate from the caller's transaction so a failed indexing attempt still persists FAILED. */
export async function markFailed(documentId: string): Promise<void> {
  await db.update(systemDocuments).set({ status: "FAILED" }).where(eq(systemDocuments.id, documentId));
}
