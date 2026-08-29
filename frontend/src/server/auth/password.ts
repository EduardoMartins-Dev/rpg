// No "server-only" guard: also used by standalone scripts (scripts/*.ts).
import bcrypt from "bcryptjs";

// bcryptjs produces/verifies standard $2a$/$2b$ hashes — compatible with the
// hashes already written by Spring Security's BCryptPasswordEncoder.
const ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
