// No "server-only" guard here: this module is also imported by standalone
// scripts (scripts/*.ts) run via tsx outside the Next.js build, where the
// server-only guard throws unconditionally.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

declare global {
  var __portalrpgSql: postgres.Sql | undefined;
}

/**
 * SSL: required by default (Supabase — and most managed Postgres — rejects
 * plain connections). Only skipped for localhost (docker-compose, no TLS
 * configured there) or when the URL explicitly opts out
 * (`sslmode=disable`/`sslmode=allow`). Relying on `sslmode=require` being
 * literally present in the URL was fragile — a connection string copied
 * straight from Supabase's dashboard doesn't include it by default, and the
 * connection was then silently attempted without TLS and rejected.
 */
function resolveSsl(url: string): "require" | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return "require";
  }
  const mode = parsed.searchParams.get("sslmode");
  if (mode === "disable" || mode === "allow") return undefined;
  const host = parsed.hostname;
  if (host === "localhost" || host === "127.0.0.1") return undefined;
  return "require";
}

function createClient(): postgres.Sql {
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
    ssl: resolveSsl(url),
  });
}

function getClient(): postgres.Sql {
  if (!globalThis.__portalrpgSql) {
    globalThis.__portalrpgSql = createClient();
  }
  return globalThis.__portalrpgSql;
}

function makeDb(client: postgres.Sql) {
  return drizzle(client, { schema });
}
type Db = ReturnType<typeof makeDb>;

let dbInstance: Db | undefined;
function getDb(): Db {
  if (!dbInstance) {
    dbInstance = makeDb(getClient());
  }
  return dbInstance;
}

/**
 * `sqlRaw`/`db` are lazy proxies: the actual postgres connection (and the
 * DATABASE_URL read that can throw) only happens on first real use — a query,
 * `.begin()`, `.end()`, etc. — never just from importing this module.
 *
 * This matters because `next build` evaluates route handler modules while
 * collecting page data, even for fully dynamic routes; connecting eagerly at
 * module scope broke the build in any environment where DATABASE_URL isn't
 * present at build time (only at runtime), which is a normal Vercel setup.
 */
export const sqlRaw = new Proxy((() => undefined) as unknown as postgres.Sql, {
  apply(_target, _thisArg, args: unknown[]) {
    const client = getClient() as unknown as (...a: unknown[]) => unknown;
    return client(...args);
  },
  get(_target, prop, _receiver) {
    const value = Reflect.get(getClient(), prop);
    return typeof value === "function" ? value.bind(getClient()) : value;
  },
});

export const db = new Proxy({} as Db, {
  get(_target, prop, _receiver) {
    const value = Reflect.get(getDb(), prop);
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
