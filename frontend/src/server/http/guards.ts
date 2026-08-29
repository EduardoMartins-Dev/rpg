import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/server/db/client";
import { campaignMembers } from "@/server/db/schema";
import { parseToken, toPrincipal, isAccess, type AppPrincipal } from "@/server/auth/jwt";
import { ApiError } from "./errors";

/**
 * Verifies the Authorization: Bearer <token> header. Only "access" tokens are
 * accepted here (mirrors JwtAuthenticationFilter — a refresh token presented
 * to a resource route is rejected, not silently upgraded). Does NOT hit the
 * DB: is_admin/userId are trusted from the token claims, same as the Java
 * filter (the DB is only re-consulted on /auth/refresh).
 */
export async function requireAuth(req: NextRequest): Promise<AppPrincipal> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw ApiError.unauthorized("missing bearer token");
  }
  const token = header.slice("Bearer ".length);
  const claims = await parseToken(token);
  if (!isAccess(claims)) {
    throw ApiError.unauthorized("not an access token");
  }
  return toPrincipal(claims);
}

export function requireAdmin(principal: AppPrincipal): void {
  if (!principal.admin) {
    throw ApiError.forbidden("admin role required");
  }
}

async function memberRole(campaignId: string, userId: string): Promise<string | null> {
  const [row] = await db
    .select({ role: campaignMembers.role })
    .from(campaignMembers)
    .where(and(eq(campaignMembers.campaignId, campaignId), eq(campaignMembers.userId, userId)))
    .limit(1);
  return row?.role ?? null;
}

export async function requireCampaignMember(campaignId: string, userId: string): Promise<string> {
  const role = await memberRole(campaignId, userId);
  if (!role) {
    throw ApiError.forbidden("not a member of this campaign");
  }
  return role;
}

export async function requireCampaignRole(campaignId: string, userId: string, role: "MASTER" | "PLAYER"): Promise<void> {
  const actual = await memberRole(campaignId, userId);
  if (actual !== role) {
    throw ApiError.forbidden(`requires role ${role}`);
  }
}
