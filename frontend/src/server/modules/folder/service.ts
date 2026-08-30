import { and, asc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { campaignFolders } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";

export type FolderKind = "board" | "notes";

export type FolderResponse = {
  id: string;
  campaignId: string;
  kind: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
  createdAt: string;
};

function toResponse(f: typeof campaignFolders.$inferSelect): FolderResponse {
  return {
    id: f.id,
    campaignId: f.campaignId,
    kind: f.kind,
    parentId: f.parentId,
    name: f.name,
    sortOrder: f.sortOrder,
    createdAt: f.createdAt.toISOString(),
  };
}

async function load(campaignId: string, folderId: string): Promise<typeof campaignFolders.$inferSelect> {
  const [f] = await db.select().from(campaignFolders).where(eq(campaignFolders.id, folderId)).limit(1);
  if (!f || f.campaignId !== campaignId) throw ApiError.notFound("folder not found");
  return f;
}

export async function list(campaignId: string, kind: FolderKind): Promise<FolderResponse[]> {
  const rows = await db
    .select()
    .from(campaignFolders)
    .where(and(eq(campaignFolders.campaignId, campaignId), eq(campaignFolders.kind, kind)))
    .orderBy(asc(campaignFolders.sortOrder), asc(campaignFolders.createdAt));
  return rows.map(toResponse);
}

export async function create(
  campaignId: string,
  kind: FolderKind,
  name: string,
  parentId: string | null | undefined,
): Promise<FolderResponse> {
  if (parentId) {
    const parent = await load(campaignId, parentId);
    if (parent.kind !== kind) throw ApiError.badRequest("parent folder is of a different kind");
  }
  const [f] = await db
    .insert(campaignFolders)
    .values({ campaignId, kind, name, parentId: parentId ?? null })
    .returning();
  return toResponse(f);
}

export async function rename(campaignId: string, folderId: string, name: string): Promise<FolderResponse> {
  await load(campaignId, folderId);
  const [f] = await db.update(campaignFolders).set({ name }).where(eq(campaignFolders.id, folderId)).returning();
  return toResponse(f);
}

/** Exclui a pasta. Subpastas caem por cascade; os itens dentro voltam a "sem pasta"
 *  (folder_id = null, via ON DELETE SET NULL) — nada de conteúdo é perdido. */
export async function remove(campaignId: string, folderId: string): Promise<void> {
  await load(campaignId, folderId);
  await db.delete(campaignFolders).where(eq(campaignFolders.id, folderId));
}
