import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { users } from "@/server/db/schema";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { generateAccessToken, generateRefreshToken, getAccessTtlSeconds, parseToken, isRefresh, toPrincipal, JwtInvalidError } from "@/server/auth/jwt";
import { ApiError } from "@/server/http/errors";
import type { z } from "zod";
import type { registerSchema, loginSchema } from "./schemas";

export type UserResponse = { id: string; email: string; displayName: string; isAdmin: boolean };
export type TokenResponse = { accessToken: string; refreshToken: string; tokenType: "Bearer"; expiresIn: number };

function toUserResponse(u: typeof users.$inferSelect): UserResponse {
  return { id: u.id, email: u.email, displayName: u.displayName, isAdmin: u.isAdmin };
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
