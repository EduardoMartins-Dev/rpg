import { asc, count, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { campaigns, characters, users } from "@/server/db/schema";
import { hashPassword } from "@/server/auth/password";
import { ApiError } from "@/server/http/errors";
import type { z } from "zod";
import type { createUserSchema } from "./schemas";

export type AdminUserView = { id: string; email: string; displayName: string; avatarUrl: string | null; admin: boolean; createdAt: string };

function toView(u: typeof users.$inferSelect): AdminUserView {
  return { id: u.id, email: u.email, displayName: u.displayName, avatarUrl: u.avatarUrl ?? null, admin: u.isAdmin, createdAt: u.createdAt.toISOString() };
}

export async function createUser(req: z.infer<typeof createUserSchema>): Promise<AdminUserView> {
  const email = req.email.trim().toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    throw ApiError.conflict("email already registered");
  }
  const passwordHash = await hashPassword(req.password);
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, displayName: req.displayName, isAdmin: req.admin })
    .returning();
  return toView(user);
}

export async function listUsers(): Promise<AdminUserView[]> {
  const rows = await db.select().from(users).orderBy(asc(users.email));
  return rows.map(toView);
}

async function countAdmins(): Promise<number> {
  const [row] = await db.select({ n: count() }).from(users).where(eq(users.isAdmin, true));
  return row?.n ?? 0;
}

export async function setAdmin(targetId: string, requesterId: string, admin: boolean): Promise<AdminUserView> {
  const [target] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  if (!target) {
    throw ApiError.notFound("user not found");
  }
  if (!admin && target.id === requesterId) {
    throw ApiError.badRequest("cannot remove your own admin role");
  }
  if (!admin && target.isAdmin && (await countAdmins()) <= 1) {
    throw ApiError.badRequest("cannot remove the last admin");
  }
  const [updated] = await db.update(users).set({ isAdmin: admin }).where(eq(users.id, targetId)).returning();
  return toView(updated);
}

export async function deleteUser(targetId: string, requesterId: string): Promise<void> {
  const [target] = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
  if (!target) {
    throw ApiError.notFound("user not found");
  }
  if (target.id === requesterId) {
    throw ApiError.badRequest("cannot delete your own account");
  }
  if (target.isAdmin && (await countAdmins()) <= 1) {
    throw ApiError.badRequest("cannot delete the last admin");
  }
  const [[campaign], [character]] = await Promise.all([
    db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.masterId, targetId)).limit(1),
    db.select({ id: characters.id }).from(characters).where(eq(characters.playerId, targetId)).limit(1),
  ]);
  if (campaign || character) {
    throw ApiError.conflict("user has linked data (campaigns/characters); remove those first");
  }
  await db.delete(users).where(eq(users.id, targetId));
}
