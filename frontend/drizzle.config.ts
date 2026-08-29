import { defineConfig } from "drizzle-kit";

// Used only to bootstrap a FRESH database (local dev / CI / tests) — the
// existing Supabase production database already has this exact schema
// (created by the old Flyway migrations) and must never have `drizzle-kit
// migrate`/`push` run against it. See the migration plan for the cutover
// procedure.
export default defineConfig({
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://portalrpg:portalrpg@localhost:5432/portalrpg",
  },
});
