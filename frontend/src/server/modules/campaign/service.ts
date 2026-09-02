import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { campaignMembers, campaigns, rpgSystems, users } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import type { z } from "zod";
import type { createCampaignSchema, updateCampaignSchema } from "./schemas";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
const CODE_LEN = 8;

function generateInviteCodeCandidate(): string {
  const bytes = new Uint8Array(CODE_LEN);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < CODE_LEN; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code;
}

async function generateInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateInviteCodeCandidate();
    const [existing] = await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.inviteCode, code)).limit(1);
    if (!existing) return code;
  }
  throw new ApiError(500, "could not generate a unique invite code");
}

export type CampaignResponse = {
  id: string;
  name: string;
  description: string | null;
  systemId: string;
  masterId: string;
  inviteCode: string;
  bannerUrl: string | null;
  theme: string | null;
  role: string | null;
  createdAt: string;
};

function toResponse(c: typeof campaigns.$inferSelect, role: string | null): CampaignResponse {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    systemId: c.systemId,
    masterId: c.masterId,
    inviteCode: c.inviteCode,
    bannerUrl: c.bannerUrl,
    theme: c.theme,
    role,
    createdAt: c.createdAt.toISOString(),
  };
}

function blankToNull(s: string | null | undefined): string | null {
  if (s == null) return null;
  const t = s.trim();
  return t.length === 0 ? null : t;
}

async function require(campaignId: string): Promise<typeof campaigns.$inferSelect> {
  const [c] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
  if (!c) throw ApiError.notFound("campaign not found");
  return c;
}

async function roleOf(campaignId: string, userId: string): Promise<string | null> {
  const [m] = await db
    .select({ role: campaignMembers.role })
    .from(campaignMembers)
    .where(and(eq(campaignMembers.campaignId, campaignId), eq(campaignMembers.userId, userId)))
    .limit(1);
  return m?.role ?? null;
}

/** Creates the campaign and inserts the creator as MASTER atomically. Rejects an unknown systemId. */
export async function create(req: z.infer<typeof createCampaignSchema>, creator: string): Promise<CampaignResponse> {
  const [system] = await db.select({ id: rpgSystems.id }).from(rpgSystems).where(eq(rpgSystems.id, req.systemId)).limit(1);
  if (!system) {
    throw ApiError.badRequest("system not found");
  }
  const inviteCode = await generateInviteCode();
  return db.transaction(async (tx) => {
    const [c] = await tx
      .insert(campaigns)
      .values({ name: req.name, description: req.description ?? null, systemId: req.systemId, masterId: creator, inviteCode })
      .returning();
    await tx.insert(campaignMembers).values({ campaignId: c.id, userId: creator, role: "MASTER" });
    return toResponse(c, "MASTER");
  });
}

/** Campaigns where the user is a member, each tagged with that user's role. */
export async function listForUser(userId: string): Promise<CampaignResponse[]> {
  const rows = await db.select().from(campaignMembers).where(eq(campaignMembers.userId, userId));
  if (rows.length === 0) return [];
  const campaignIds = rows.map((r) => r.campaignId);
  const found = await db.select().from(campaigns).where(inArray(campaigns.id, campaignIds));
  const byId = new Map(found.map((c) => [c.id, c]));
  return rows
    .map((m) => {
      const c = byId.get(m.campaignId);
      return c ? toResponse(c, m.role) : null;
    })
    .filter((r): r is CampaignResponse => r !== null);
}

export async function get(campaignId: string, userId: string): Promise<CampaignResponse> {
  const c = await require(campaignId);
  return toResponse(c, await roleOf(campaignId, userId));
}

export async function update(campaignId: string, req: z.infer<typeof updateCampaignSchema>, userId: string): Promise<CampaignResponse> {
  await require(campaignId);
  const [updated] = await db
    .update(campaigns)
    .set({
      name: req.name,
      description: req.description ?? null,
      bannerUrl: blankToNull(req.bannerUrl),
      theme: blankToNull(req.theme),
    })
    .where(eq(campaigns.id, campaignId))
    .returning();
  return toResponse(updated, await roleOf(campaignId, userId));
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  await require(campaignId);
  // campaign_members + characters + board + notes + ai_conversations cascade via FK.
  await db.delete(campaigns).where(eq(campaigns.id, campaignId));
}

export async function regenerateInvite(campaignId: string): Promise<{ campaignId: string; inviteCode: string }> {
  await require(campaignId);
  const inviteCode = await generateInviteCode();
  const [updated] = await db.update(campaigns).set({ inviteCode }).where(eq(campaigns.id, campaignId)).returning();
  return { campaignId: updated.id, inviteCode: updated.inviteCode };
}

/** Join via invite code -> becomes PLAYER. */
export async function join(inviteCode: string, userId: string): Promise<CampaignResponse> {
  const [c] = await db.select().from(campaigns).where(eq(campaigns.inviteCode, inviteCode)).limit(1);
  if (!c) throw ApiError.notFound("invalid invite code");
  const [existing] = await db
    .select({ id: campaignMembers.id })
    .from(campaignMembers)
    .where(and(eq(campaignMembers.campaignId, c.id), eq(campaignMembers.userId, userId)))
    .limit(1);
  if (existing) {
    throw ApiError.conflict("already a member of this campaign");
  }
  await db.insert(campaignMembers).values({ campaignId: c.id, userId, role: "PLAYER" });
  return toResponse(c, "PLAYER");
}

export type MemberResponse = { userId: string; email: string | null; displayName: string | null; avatarUrl: string | null; role: string; joinedAt: string };

export async function listMembers(campaignId: string): Promise<MemberResponse[]> {
  await require(campaignId);
  const rows = await db
    .select()
    .from(campaignMembers)
    .where(eq(campaignMembers.campaignId, campaignId))
    .orderBy(campaignMembers.joinedAt);
  if (rows.length === 0) return [];
  const userRows = await db.select().from(users).where(inArray(users.id, rows.map((r) => r.userId)));
  const byId = new Map(userRows.map((u) => [u.id, u]));
  return rows.map((m) => {
    const u = byId.get(m.userId);
    return {
      userId: m.userId,
      email: u?.email ?? null,
      displayName: u?.displayName ?? null,
      avatarUrl: u?.avatarUrl ?? null,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
    };
  });
}

export async function removeMember(campaignId: string, targetUserId: string): Promise<void> {
  await require(campaignId);
  const [m] = await db
    .select()
    .from(campaignMembers)
    .where(and(eq(campaignMembers.campaignId, campaignId), eq(campaignMembers.userId, targetUserId)))
    .limit(1);
  if (!m) throw ApiError.notFound("user is not a member of this campaign");
  if (m.role === "MASTER") {
    throw ApiError.badRequest("cannot remove the campaign master");
  }
  await db.delete(campaignMembers).where(eq(campaignMembers.id, m.id));
}
