// No "server-only" guard here: this module is also imported by standalone
// scripts (scripts/*.ts) run via tsx outside the Next.js build, where the
// server-only guard throws unconditionally.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

declare global {
  var __portalrpgSql: postgres.Sql | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  // Low `max`: each serverless function instance keeps a tiny pool of its
  // own, and the real pooling happens upstream (Supabase Session Pooler).
  // Reused across warm invocations via the global singleton below so we
  // don't open a fresh connection per request in dev (hot reload) either.
  return postgres(url, {
    max: 5,
    idle_timeout: 20,
    ssl: url.includes("sslmode=require") ? "require" : undefined,
  });
}

const sqlClient = globalThis.__portalrpgSql ?? createClient();
if (process.env.NODE_ENV !== "production") {
  globalThis.__portalrpgSql = sqlClient;
}

export const sqlRaw = sqlClient;
export const db = drizzle(sqlClient, { schema });
