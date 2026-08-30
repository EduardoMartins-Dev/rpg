import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { campaignBoardItems, campaignFolders } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import type { z } from "zod";
import type { boardItemRequestSchema } from "./schemas";

export type BoardItemResponse = {
  id: string;
  campaignId: string;
  folderId: string | null;
  title: string | null;
  body: string | null;
  imageUrl: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

function toResponse(i: typeof campaignBoardItems.$inferSelect): BoardItemResponse {
  return {
    id: i.id,
    campaignId: i.campaignId,
    folderId: i.folderId,
    title: i.title,
    body: i.body,
    imageUrl: i.imageUrl,
    sortOrder: i.sortOrder,
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
  };
}

/** Garante que a pasta (se informada) é deste mural (mesma campanha, kind=board). */
async function assertFolder(campaignId: string, folderId: string | null | undefined): Promise<void> {
  if (!folderId) return;
  const [f] = await db
    .select({ id: campaignFolders.id })
    .from(campaignFolders)
    .where(and(eq(campaignFolders.id, folderId), eq(campaignFolders.campaignId, campaignId), eq(campaignFolders.kind, "board")))
    .limit(1);
  if (!f) throw ApiError.badRequest("folder not found in this campaign");
}

function trim(s: string | null | undefined): string | null {
  if (s == null) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

function validateContent(req: z.infer<typeof boardItemRequestSchema>): void {
  const empty = !trim(req.title) && !trim(req.body) && !trim(req.imageUrl);
  if (empty) {
    throw ApiError.badRequest("informe um título, texto ou imagem");
  }
}

async function load(campaignId: string, itemId: string): Promise<typeof campaignBoardItems.$inferSelect> {
  const [item] = await db.select().from(campaignBoardItems).where(eq(campaignBoardItems.id, itemId)).limit(1);
  if (!item || item.campaignId !== campaignId) {
    throw ApiError.notFound("board item not found");
  }
  return item;
}

export async function list(campaignId: string): Promise<BoardItemResponse[]> {
  const rows = await db
    .select()
    .from(campaignBoardItems)
    .where(eq(campaignBoardItems.campaignId, campaignId))
    .orderBy(asc(campaignBoardItems.sortOrder), asc(campaignBoardItems.createdAt));
  return rows.map(toResponse);
}

export async function create(campaignId: string, req: z.infer<typeof boardItemRequestSchema>): Promise<BoardItemResponse> {
  validateContent(req);
  await assertFolder(campaignId, req.folderId);
  let order = req.sortOrder ?? null;
  if (order == null) {
    const [row] = await db.select({ n: count() }).from(campaignBoardItems).where(eq(campaignBoardItems.campaignId, campaignId));
    order = row?.n ?? 0;
  }
  const [item] = await db
    .insert(campaignBoardItems)
    .values({ campaignId, folderId: req.folderId ?? null, title: trim(req.title), body: trim(req.body), imageUrl: trim(req.imageUrl), sortOrder: order })
    .returning();
  return toResponse(item);
}

export async function update(campaignId: string, itemId: string, req: z.infer<typeof boardItemRequestSchema>): Promise<BoardItemResponse> {
  validateContent(req);
  await load(campaignId, itemId);
  // folderId só muda quando a chave vem no corpo (undefined = mantém; null = tira da pasta).
  if (req.folderId !== undefined) await assertFolder(campaignId, req.folderId);
  const [updated] = await db
    .update(campaignBoardItems)
    .set({
      title: trim(req.title),
      body: trim(req.body),
      imageUrl: trim(req.imageUrl),
      updatedAt: new Date(),
      ...(req.sortOrder != null ? { sortOrder: req.sortOrder } : {}),
      ...(req.folderId !== undefined ? { folderId: req.folderId } : {}),
    })
    .where(eq(campaignBoardItems.id, itemId))
    .returning();
  return toResponse(updated);
}

export async function deleteItem(campaignId: string, itemId: string): Promise<void> {
  await load(campaignId, itemId);
  await db.delete(campaignBoardItems).where(eq(campaignBoardItems.id, itemId));
}
