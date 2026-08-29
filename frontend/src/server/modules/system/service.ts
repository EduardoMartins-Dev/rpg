import { asc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { rpgSystems, systemDocuments, systemSheetSchema } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import * as chunkStore from "@/server/rag/chunkStore";
import * as indexing from "@/server/rag/indexingService";
import * as storage from "@/server/storage/supabase";
import type { z } from "zod";
import type { systemRequestSchema, sheetSchemaRequestSchema } from "./schemas";

function sanitize(name: string | null | undefined): string {
  if (!name) return "upload.bin";
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export type SystemResponse = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ruleset: string;
  createdBy: string | null;
  createdAt: string;
};

function toResponse(s: typeof rpgSystems.$inferSelect): SystemResponse {
  return {
    id: s.id,
    name: s.name,
    slug: s.slug,
    description: s.description,
    ruleset: s.ruleset,
    createdBy: s.createdBy,
    createdAt: s.createdAt.toISOString(),
  };
}

export type DocumentResponse = { id: string; systemId: string; fileUrl: string; status: string; createdAt: string };

function toDocResponse(d: typeof systemDocuments.$inferSelect): DocumentResponse {
  return { id: d.id, systemId: d.systemId, fileUrl: d.fileUrl, status: d.status, createdAt: d.createdAt.toISOString() };
}

async function require(id: string): Promise<typeof rpgSystems.$inferSelect> {
  const [s] = await db.select().from(rpgSystems).where(eq(rpgSystems.id, id)).limit(1);
  if (!s) throw ApiError.notFound("system not found");
  return s;
}

export async function list(): Promise<SystemResponse[]> {
  const rows = await db.select().from(rpgSystems);
  return rows.map(toResponse);
}

export async function get(id: string): Promise<SystemResponse> {
  return toResponse(await require(id));
}

export async function create(req: z.infer<typeof systemRequestSchema>, creator: string): Promise<SystemResponse> {
  const [existing] = await db.select({ id: rpgSystems.id }).from(rpgSystems).where(eq(rpgSystems.slug, req.slug)).limit(1);
  if (existing) throw ApiError.conflict("slug already in use");
  const [s] = await db
    .insert(rpgSystems)
    .values({ name: req.name, slug: req.slug, description: req.description ?? null, createdBy: creator, ruleset: req.ruleset ?? "v5" })
    .returning();
  return toResponse(s);
}

export async function update(id: string, req: z.infer<typeof systemRequestSchema>): Promise<SystemResponse> {
  const s = await require(id);
  if (s.slug !== req.slug) {
    const [existing] = await db.select({ id: rpgSystems.id }).from(rpgSystems).where(eq(rpgSystems.slug, req.slug)).limit(1);
    if (existing) throw ApiError.conflict("slug already in use");
  }
  const [updated] = await db
    .update(rpgSystems)
    .set({
      name: req.name,
      slug: req.slug,
      description: req.description ?? null,
      // Only updated if non-null in the request (a null ruleset in an update is a no-op).
      ...(req.ruleset != null ? { ruleset: req.ruleset } : {}),
    })
    .where(eq(rpgSystems.id, id))
    .returning();
  return toResponse(updated);
}

export async function getSchema(systemId: string): Promise<{ systemId: string; schema: unknown }> {
  await require(systemId);
  const [sc] = await db.select().from(systemSheetSchema).where(eq(systemSheetSchema.systemId, systemId)).limit(1);
  if (!sc) throw ApiError.notFound("sheet-schema not defined for this system");
  return { systemId, schema: sc.schema };
}

export async function putSchema(systemId: string, req: z.infer<typeof sheetSchemaRequestSchema>): Promise<{ systemId: string; schema: unknown }> {
  await require(systemId);
  const [existing] = await db.select().from(systemSheetSchema).where(eq(systemSheetSchema.systemId, systemId)).limit(1);
  if (existing) {
    const [updated] = await db
      .update(systemSheetSchema)
      .set({ schema: req.schema })
      .where(eq(systemSheetSchema.systemId, systemId))
      .returning();
    return { systemId, schema: updated.schema };
  }
  const [created] = await db.insert(systemSheetSchema).values({ systemId, schema: req.schema }).returning();
  return { systemId, schema: created.schema };
}

/** Clears the system's RAG index: deletes chunks then documents (fresh reindex). */
export async function clearIndex(systemId: string): Promise<number> {
  await require(systemId);
  const removed = await chunkStore.deleteBySystem(systemId); // chunks first (FK -> system_documents)
  await db.delete(systemDocuments).where(eq(systemDocuments.systemId, systemId));
  return removed;
}

/**
 * Upload + index (synchronous): stores the file bytes to Supabase Storage, then
 * extracts/chunks/embeds/inserts. Synchronous by design — no local disk (serverless has
 * none) and no background threads. The raw file is only ever read once (at upload
 * time) to extract its text — nothing downstream re-reads it — so persisting it to
 * Storage is best-effort: when Supabase Storage is configured, the bytes are kept
 * there for reference; when it isn't (local dev/CI without Supabase credentials), the
 * document is still indexed straight from the in-memory bytes instead of failing.
 */
export async function uploadDocument(systemId: string, filename: string, contentType: string, bytes: Uint8Array, clear: boolean): Promise<DocumentResponse> {
  await require(systemId);
  if (bytes.length === 0) {
    throw ApiError.badRequest("file is required");
  }
  if (clear) {
    await clearIndex(systemId);
  }
  let fileUrl = `memory://${sanitize(filename)}`;
  if (storage.enabled()) {
    const path = `${systemId}/${crypto.randomUUID()}-${sanitize(filename)}`;
    await storage.upload(path, bytes, contentType || "application/octet-stream");
    fileUrl = `supabase://${storage.bucket()}/${path}`;
  }
  const [doc] = await db.insert(systemDocuments).values({ systemId, fileUrl }).returning();
  await indexing.indexBytes(doc.id, systemId, bytes, filename);
  const [finalDoc] = await db.select().from(systemDocuments).where(eq(systemDocuments.id, doc.id)).limit(1);
  return toDocResponse(finalDoc ?? doc);
}

/** Plain-text ingestion ("paste rules"): indexes without uploading a file. */
export async function uploadText(systemId: string, title: string | null | undefined, text: string, clear: boolean): Promise<DocumentResponse> {
  await require(systemId);
  if (!text || text.trim().length === 0) {
    throw ApiError.badRequest("text is required");
  }
  if (clear) {
    await clearIndex(systemId);
  }
  const label = !title || title.trim().length === 0 ? "texto-colado" : title.trim();
  const [doc] = await db.insert(systemDocuments).values({ systemId, fileUrl: `text://${sanitize(label)}` }).returning();
  await indexing.indexText(doc.id, systemId, text);
  const [finalDoc] = await db.select().from(systemDocuments).where(eq(systemDocuments.id, doc.id)).limit(1);
  return toDocResponse(finalDoc ?? doc);
}

export function storageEnabled(): boolean {
  return storage.enabled();
}

/** Signed upload URL so the browser can PUT the book straight to Supabase Storage. */
export async function createUploadUrl(systemId: string, filename: string) {
  await require(systemId);
  const path = `${systemId}/${crypto.randomUUID()}-${sanitize(filename)}`;
  return storage.createSignedUpload(path);
}

/**
 * Registers a book already uploaded to Storage and triggers ASYNC indexing (download +
 * extraction + embeddings continue after the response is sent via next/server's
 * `after()` — see the route handler). Returns PENDING immediately.
 */
export async function registerStorageDocument(systemId: string, path: string, clear: boolean): Promise<DocumentResponse> {
  await require(systemId);
  if (!path || path.trim().length === 0) {
    throw ApiError.badRequest("path is required");
  }
  if (clear) {
    await clearIndex(systemId);
  }
  const [doc] = await db.insert(systemDocuments).values({ systemId, fileUrl: `supabase://${storage.bucket()}/${path}` }).returning();
  return toDocResponse(doc);
}

/** Deletes the system (schema/docs/chunks cascade). Blocked if campaigns reference it. */
export async function deleteSystem(id: string): Promise<void> {
  await require(id);
  await chunkStore.deleteBySystem(id); // chunks have an FK to system_documents; remove first
  try {
    await db.delete(rpgSystems).where(eq(rpgSystems.id, id));
  } catch (e) {
    // Postgres FK violation (campaigns.system_id references this system, no cascade).
    if (e && typeof e === "object" && "code" in e && e.code === "23503") {
      throw ApiError.conflict("system has campaigns; delete those campaigns first");
    }
    throw e;
  }
}

/** Removes a single document from the RAG index (chunks + record) without touching others. */
export async function deleteDocument(systemId: string, documentId: string): Promise<void> {
  await require(systemId);
  const [doc] = await db.select().from(systemDocuments).where(eq(systemDocuments.id, documentId)).limit(1);
  if (!doc || doc.systemId !== systemId) {
    throw ApiError.notFound("document not found");
  }
  await chunkStore.deleteByDocument(documentId);
  await db.delete(systemDocuments).where(eq(systemDocuments.id, documentId));
}

export async function listDocuments(systemId: string): Promise<DocumentResponse[]> {
  await require(systemId);
  const rows = await db.select().from(systemDocuments).where(eq(systemDocuments.systemId, systemId)).orderBy(asc(systemDocuments.createdAt));
  return rows.map(toDocResponse);
}
