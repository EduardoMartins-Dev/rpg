/**
 * Idempotent initial-admin bootstrap for production. No app-boot hook exists
 * in a serverless deploy (unlike Spring's ApplicationRunner), so this is run
 * once by hand (or as a deploy step) against ADMIN_EMAIL/ADMIN_PASSWORD/
 * ADMIN_NAME. Port of backend/src/main/java/com/portalrpg/config/ProdSeeder.java.
 *
 * Run with: npx tsx scripts/prod-bootstrap.ts
 */
import { eq } from "drizzle-orm";
import { db, sqlRaw } from "../src/server/db/client";
import { users } from "../src/server/db/schema";
import { hashPassword } from "../src/server/auth/password";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL?.trim() ?? "";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  const adminName = process.env.ADMIN_NAME?.trim() || "Admin";

  if (!adminEmail || !adminPassword) {
    console.warn("prod admin bootstrap skipped: set ADMIN_EMAIL and ADMIN_PASSWORD to create the initial admin");
    return;
  }
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, adminEmail)).limit(1);
  if (existing) {
    console.log(`prod admin bootstrap: admin '${adminEmail}' already exists, nothing to do`);
    return;
  }
  const passwordHash = await hashPassword(adminPassword);
  await db.insert(users).values({ email: adminEmail, passwordHash, displayName: adminName, isAdmin: true });
  console.log(`prod admin bootstrap: created admin '${adminEmail}'`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => sqlRaw.end());
