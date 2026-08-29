// No "server-only" guard: also used by standalone scripts (scripts/*.ts).
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export const CLAIM_ADMIN = "is_admin";
export const CLAIM_TYPE = "type";
export const TYPE_ACCESS = "access";
export const TYPE_REFRESH = "refresh";

export type AppPrincipal = { userId: string; admin: boolean };

function secretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET ?? "dev-only-insecure-secret-change-me-0123456789-abcdef-0123456789";
  const bytes = new TextEncoder().encode(secret);
  if (bytes.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 bytes for HS256");
  }
  return bytes;
}

function accessTtlMinutes(): number {
  return Number(process.env.JWT_ACCESS_TTL_MIN ?? 15);
}

function refreshTtlDays(): number {
  return Number(process.env.JWT_REFRESH_TTL_DAYS ?? 14);
}

export function getAccessTtlSeconds(): number {
  return accessTtlMinutes() * 60;
}

async function issue(userId: string, admin: boolean, type: typeof TYPE_ACCESS | typeof TYPE_REFRESH, ttlSeconds: number) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ [CLAIM_ADMIN]: admin, [CLAIM_TYPE]: type })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt(now)
    .setExpirationTime(now + ttlSeconds)
    .sign(secretKey());
}

export function generateAccessToken(userId: string, admin: boolean) {
  return issue(userId, admin, TYPE_ACCESS, accessTtlMinutes() * 60);
}

export function generateRefreshToken(userId: string, admin: boolean) {
  return issue(userId, admin, TYPE_REFRESH, refreshTtlDays() * 24 * 60 * 60);
}

export class JwtInvalidError extends Error {}

/** Parses + verifies signature/expiry. Throws JwtInvalidError if invalid. */
export async function parseToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return payload;
  } catch (e) {
    throw new JwtInvalidError(e instanceof Error ? e.message : "invalid token");
  }
}

export function toPrincipal(claims: JWTPayload): AppPrincipal {
  if (!claims.sub) throw new JwtInvalidError("missing subject");
  return { userId: claims.sub, admin: claims[CLAIM_ADMIN] === true };
}

export function isRefresh(claims: JWTPayload): boolean {
  return claims[CLAIM_TYPE] === TYPE_REFRESH;
}

export function isAccess(claims: JWTPayload): boolean {
  return claims[CLAIM_TYPE] === TYPE_ACCESS;
}
