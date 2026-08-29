/**
 * Deterministic DEV seed (also used by the Playwright E2E suite — the exact
 * emails/password/admin flags below must match what frontend/e2e/*.spec.ts
 * expect). Idempotent: only inserts users that don't already exist.
 * Port of backend/src/main/java/com/portalrpg/config/DevSeeder.java.
 *
 * Run with: npx tsx scripts/dev-seed.ts
 */
import { eq } from "drizzle-orm";
import { db, sqlRaw } from "../src/server/db/client";
import { users } from "../src/server/db/schema";
import { hashPassword } from "../src/server/auth/password";

const PASSWORD = "Sup3rSenha!";

const SEED: Array<{ email: string; displayName: string; admin: boolean }> = [
  { email: "admin@test", displayName: "Admin", admin: true },
  { email: "mestre@test", displayName: "Mestre", admin: false },
  { email: "player1@test", displayName: "Player One", admin: false },
  { email: "player2@test", displayName: "Player Two", admin: false },
  { email: "intruso@test", displayName: "Intruso", admin: false },
];

async function main() {
  const passwordHash = await hashPassword(PASSWORD);
  for (const u of SEED) {
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, u.email)).limit(1);
    if (existing) {
      console.log(`skip (exists): ${u.email}`);
      continue;
    }
    await db.insert(users).values({ email: u.email, passwordHash, displayName: u.displayName, isAdmin: u.admin });
    console.log(`seeded: ${u.email}`);
  }
  await sqlRaw.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
