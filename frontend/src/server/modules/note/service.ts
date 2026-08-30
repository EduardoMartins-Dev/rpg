import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { campaignFolders, campaignNotes, users } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import type { z } from "zod";
import type { noteRequestSchema } from "./schemas";

export type NoteResponse = {
  id: string;
  authorId: string;
  authorName: string;
  folderId: string | null;
  title: string | null;
  body: string;
  canEdit: boolean;
  createdAt: string;
  updatedAt: string;
};

/** Garante que a pasta (se informada) é destas anotações (mesma campanha, kind=notes). */
async function assertFolder(campaignId: string, folderId: string | null | undefined): Promise<void> {
  if (!folderId) return;
  const [f] = await db
    .select({ id: campaignFolders.id })
    .from(campaignFolders)
    .where(and(eq(campaignFolders.id, folderId), eq(campaignFolders.campaignId, campaignId), eq(campaignFolders.kind, "notes")))
    .limit(1);
  if (!f) throw ApiError.badRequest("folder not found in this campaign");
}

function trim(s: string | null | undefined): string | null {
  if (s == null) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

function toResponse(n: typeof campaignNotes.$inferSelect, authorName: string | undefined, userId: string, master: boolean): NoteResponse {
  const canEdit = master || n.authorId === userId;
  return {
    id: n.id,
    authorId: n.authorId,
    authorName: authorName ?? "—",
    folderId: n.folderId,
    title: n.title,
    body: n.body,
    canEdit,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

async function load(campaignId: string, noteId: string): Promise<typeof campaignNotes.$inferSelect> {
  const [n] = await db.select().from(campaignNotes).where(eq(campaignNotes.id, noteId)).limit(1);
  if (!n || n.campaignId !== campaignId) {
    throw ApiError.notFound("note not found");
  }
  return n;
}

/** Author of the note OR campaign master may change/delete it. */
function requireWriter(n: typeof campaignNotes.$inferSelect, userId: string, master: boolean): void {
  if (!master && n.authorId !== userId) {
    throw ApiError.forbidden("you can only change your own notes");
  }
}

export async function list(campaignId: string, userId: string, master: boolean): Promise<NoteResponse[]> {
  const rows = await db
    .select()
    .from(campaignNotes)
    .where(eq(campaignNotes.campaignId, campaignId))
    .orderBy(desc(campaignNotes.updatedAt));
  const filtered = master ? rows : rows.filter((n) => n.authorId === userId);
  if (filtered.length === 0) return [];
  const authorIds = [...new Set(filtered.map((n) => n.authorId))];
  const authors = await db.select().from(users).where(inArray(users.id, authorIds));
  const byId = new Map(authors.map((u) => [u.id, u.displayName]));
  return filtered.map((n) => toResponse(n, byId.get(n.authorId), userId, master));
}

export async function create(campaignId: string, userId: string, master: boolean, req: z.infer<typeof noteRequestSchema>): Promise<NoteResponse> {
  await assertFolder(campaignId, req.folderId);
  const [n] = await db
    .insert(campaignNotes)
    .values({ campaignId, authorId: userId, folderId: req.folderId ?? null, title: trim(req.title), body: req.body ?? "" })
    .returning();
  const [author] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return toResponse(n, author?.displayName, userId, master);
}

export async function update(campaignId: string, noteId: string, userId: string, master: boolean, req: z.infer<typeof noteRequestSchema>): Promise<NoteResponse> {
  const n = await load(campaignId, noteId);
  requireWriter(n, userId, master);
  if (req.folderId !== undefined) await assertFolder(campaignId, req.folderId);
  const [updated] = await db
    .update(campaignNotes)
    .set({
      title: trim(req.title),
      body: req.body ?? "",
      updatedAt: new Date(),
      ...(req.folderId !== undefined ? { folderId: req.folderId } : {}),
    })
    .where(eq(campaignNotes.id, noteId))
    .returning();
  const [author] = await db.select().from(users).where(eq(users.id, updated.authorId)).limit(1);
  return toResponse(updated, author?.displayName, userId, master);
}

export async function deleteNote(campaignId: string, noteId: string, userId: string, master: boolean): Promise<void> {
  const n = await load(campaignId, noteId);
  requireWriter(n, userId, master);
  await db.delete(campaignNotes).where(eq(campaignNotes.id, noteId));
}
