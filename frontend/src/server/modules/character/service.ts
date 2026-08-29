import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { campaignMembers, campaigns, characters, rpgSystems, systemSheetSchema } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import { process as processSheet, type SheetSchema } from "@/server/rules/v5/sheetProcessor";
import type { z } from "zod";
import type { characterRequestSchema } from "./schemas";

export type CharacterResponse = {
  id: string;
  campaignId: string;
  playerId: string;
  name: string;
  sheetData: unknown;
  createdAt: string;
};

function toResponse(c: typeof characters.$inferSelect): CharacterResponse {
  return {
    id: c.id,
    campaignId: c.campaignId,
    playerId: c.playerId,
    name: c.name,
    sheetData: c.sheetData,
    createdAt: c.createdAt.toISOString(),
  };
}

async function requireCampaign(campaignId: string): Promise<typeof campaigns.$inferSelect> {
  const [c] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
  if (!c) throw ApiError.notFound("campaign not found");
  return c;
}

async function schemaFor(campaign: typeof campaigns.$inferSelect): Promise<SheetSchema> {
  const [sc] = await db.select().from(systemSheetSchema).where(eq(systemSheetSchema.systemId, campaign.systemId)).limit(1);
  if (!sc) throw ApiError.badRequest("system has no sheet-schema defined");
  return sc.schema as SheetSchema;
}

async function isMaster(campaignId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: campaignMembers.id })
    .from(campaignMembers)
    .where(and(eq(campaignMembers.campaignId, campaignId), eq(campaignMembers.userId, userId), eq(campaignMembers.role, "MASTER")))
    .limit(1);
  return !!row;
}

/** Access to ONE character: owner OR campaign MASTER (otherwise 403). */
async function requireAccessible(campaignId: string, charId: string, userId: string): Promise<typeof characters.$inferSelect> {
  const [c] = await db.select().from(characters).where(eq(characters.id, charId)).limit(1);
  if (!c) throw ApiError.notFound("character not found");
  if (c.campaignId !== campaignId) throw ApiError.notFound("character not found in this campaign");
  if (c.playerId !== userId && !(await isMaster(campaignId, userId))) {
    throw ApiError.forbidden("not allowed to access this character");
  }
  return c;
}

export async function create(campaignId: string, playerId: string, req: z.infer<typeof characterRequestSchema>): Promise<CharacterResponse> {
  const campaign = await requireCampaign(campaignId);
  const enriched = processSheet(req.sheetData, await schemaFor(campaign));
  const [c] = await db.insert(characters).values({ campaignId, playerId, name: req.name, sheetData: enriched }).returning();
  return toResponse(c);
}

/** MASTER sees all characters in the campaign; PLAYER sees only their own. */
export async function list(campaignId: string, userId: string): Promise<CharacterResponse[]> {
  await requireCampaign(campaignId);
  const master = await isMaster(campaignId, userId);
  const rows = master
    ? await db.select().from(characters).where(eq(characters.campaignId, campaignId)).orderBy(asc(characters.createdAt))
    : await db
        .select()
        .from(characters)
        .where(and(eq(characters.campaignId, campaignId), eq(characters.playerId, userId)))
        .orderBy(asc(characters.createdAt));
  return rows.map(toResponse);
}

export async function get(campaignId: string, charId: string, userId: string): Promise<CharacterResponse> {
  return toResponse(await requireAccessible(campaignId, charId, userId));
}

export async function update(campaignId: string, charId: string, req: z.infer<typeof characterRequestSchema>, userId: string): Promise<CharacterResponse> {
  await requireAccessible(campaignId, charId, userId);
  const campaign = await requireCampaign(campaignId);
  const enriched = processSheet(req.sheetData, await schemaFor(campaign));
  const [updated] = await db
    .update(characters)
    .set({ name: req.name, sheetData: enriched })
    .where(eq(characters.id, charId))
    .returning();
  return toResponse(updated);
}

export async function deleteCharacter(campaignId: string, charId: string, userId: string): Promise<void> {
  await requireAccessible(campaignId, charId, userId);
  await db.delete(characters).where(eq(characters.id, charId));
}

export type MyCharacterView = {
  id: string;
  name: string;
  campaignId: string;
  campaignName: string;
  systemId: string | null;
  systemName: string;
};

/** All of the current user's characters across ALL campaigns, with campaign/system names for grouping. */
export async function listMine(userId: string): Promise<MyCharacterView[]> {
  const mine = await db.select().from(characters).where(eq(characters.playerId, userId)).orderBy(asc(characters.createdAt));
  if (mine.length === 0) return [];

  const campaignIds = [...new Set(mine.map((c) => c.campaignId))];
  const campRows = await db.select().from(campaigns).where(inArray(campaigns.id, campaignIds));
  const campById = new Map(campRows.map((c) => [c.id, c]));

  const systemIds = [...new Set(campRows.map((c) => c.systemId))];
  const sysRows = systemIds.length > 0 ? await db.select().from(rpgSystems).where(inArray(rpgSystems.id, systemIds)) : [];
  const sysById = new Map(sysRows.map((s) => [s.id, s]));

  return mine.map((ch) => {
    const c = campById.get(ch.campaignId);
    const s = c ? sysById.get(c.systemId) : undefined;
    return {
      id: ch.id,
      name: ch.name,
      campaignId: ch.campaignId,
      campaignName: c?.name ?? "—",
      systemId: s?.id ?? null,
      systemName: s?.name ?? "—",
    };
  });
}
