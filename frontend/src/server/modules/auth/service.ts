import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { generateAccessToken, generateRefreshToken, getAccessTtlSeconds, parseToken, isRefresh, toPrincipal, JwtInvalidError } from "@/server/auth/jwt";
import { ApiError } from "@/server/http/errors";
import type { z } from "zod";
import type { registerSchema, loginSchema } from "./schemas";

export type UserResponse = { id: string; email: string; displayName: string; isAdmin: boolean; avatarUrl: string | null };
export type TokenResponse = { accessToken: string; refreshToken: string; tokenType: "Bearer"; expiresIn: number };

function toUserResponse(u: typeof users.$inferSelect): UserResponse {
  return { id: u.id, email: u.email, displayName: u.displayName, isAdmin: u.isAdmin, avatarUrl: u.avatarUrl ?? null };
}

export function registrationEnabled(): boolean {
  return (process.env.REGISTRATION_ENABLED ?? "true") !== "false";
}

export async function register(req: z.infer<typeof registerSchema>): Promise<UserResponse> {
  if (!registrationEnabled()) {
    throw ApiError.forbidden("registration is disabled");
  }
  const email = req.email.toLowerCase();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    throw ApiError.conflict("email already registered");
  }
  const passwordHash = await hashPassword(req.password);
  // New users are never admin via self-registration.
  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, displayName: req.displayName, isAdmin: false })
    .returning();
  return toUserResponse(user);
}

async function issueTokens(user: typeof users.$inferSelect): Promise<TokenResponse> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(user.id, user.isAdmin),
    generateRefreshToken(user.id, user.isAdmin),
  ]);
  return { accessToken, refreshToken, tokenType: "Bearer", expiresIn: getAccessTtlSeconds() };
}

export async function login(req: z.infer<typeof loginSchema>): Promise<TokenResponse> {
  const [user] = await db.select().from(users).where(eq(users.email, req.email.toLowerCase())).limit(1);
  if (!user) {
    throw ApiError.unauthorized("invalid credentials");
  }
  if (!(await verifyPassword(req.password, user.passwordHash))) {
    throw ApiError.unauthorized("invalid credentials");
  }
  return issueTokens(user);
}

export async function refresh(refreshToken: string): Promise<TokenResponse> {
  let claims;
  try {
    claims = await parseToken(refreshToken);
  } catch (e) {
    if (e instanceof JwtInvalidError) throw ApiError.unauthorized("invalid refresh token");
    throw e;
  }
  if (!isRefresh(claims)) {
    throw ApiError.unauthorized("not a refresh token");
  }
  const principal = toPrincipal(claims);
  // Reload to reflect current is_admin (authoritative source = DB, not the stale claim).
  const [user] = await db.select().from(users).where(eq(users.id, principal.userId)).limit(1);
  if (!user) {
    throw ApiError.unauthorized("user no longer exists");
  }
  return issueTokens(user);
}

export async function getUserResponse(userId: string): Promise<UserResponse> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) {
    throw ApiError.unauthorized("user no longer exists");
  }
  return toUserResponse(user);
}

/**
 * Atualiza o próprio perfil (nome, e-mail e foto). Campos ausentes ficam como estão;
 * avatarUrl explicitamente null/"" remove a foto. O JWT usa o id (sub), não o e-mail,
 * então trocar o e-mail não invalida a sessão.
 */
export async function updateProfile(
  userId: string,
  req: { displayName?: string; email?: string; avatarUrl?: string | null },
): Promise<UserResponse> {
  const patch: Partial<typeof users.$inferInsert> = {};

  if (req.displayName !== undefined) {
    const name = req.displayName.trim();
    if (!name) throw ApiError.badRequest("displayName: não pode ficar vazio");
    patch.displayName = name;
  }

  if (req.email !== undefined) {
    const email = req.email.trim().toLowerCase();
    if (!email) throw ApiError.badRequest("email: não pode ficar vazio");
    const [clash] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (clash && clash.id !== userId) throw ApiError.conflict("e-mail já está em uso por outra conta");
    patch.email = email;
  }

  if (req.avatarUrl !== undefined) {
    const url = (req.avatarUrl ?? "").trim();
    patch.avatarUrl = url === "" ? null : url;
  }

  if (Object.keys(patch).length === 0) {
    return getUserResponse(userId);
  }

  const [updated] = await db.update(users).set(patch).where(eq(users.id, userId)).returning();
  if (!updated) throw ApiError.unauthorized("user no longer exists");
  return toUserResponse(updated);
}
