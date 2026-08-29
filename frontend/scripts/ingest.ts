/**
 * Offline RAG ingestion via CLI — feeds a system WITHOUT going through the deployed
 * app's HTTP API (avoids upload size/timeout limits for large PDFs). Point it at the
 * SAME database (DATABASE_URL) as the running app and run:
 *
 *   npx tsx --env-file=.env.local scripts/ingest.ts --system=<slug|uuid> --file=livro.pdf [--file=outro.txt] [--title="Manual"] [--clear]
 *
 * Embeddings use the same provider/algorithm as the running app (EMBEDDINGS_PROVIDER),
 * so vectors are identical to what indexing through the API would produce.
 * Port of backend/src/main/java/com/portalrpg/config/IngestRunner.java.
 */
import { readFileSync, statSync } from "node:fs";
import { eq } from "drizzle-orm";
import { db, sqlRaw } from "../src/server/db/client";
import { rpgSystems, systemDocuments } from "../src/server/db/schema";
import * as chunkStore from "../src/server/rag/chunkStore";
import * as indexing from "../src/server/rag/indexingService";

function hasFlag(args: string[], name: string): boolean {
  const pfx = `--${name}`;
  return args.some((a) => a === pfx || a.startsWith(`${pfx}=`));
}

function opts(args: string[], name: string): string[] {
  const pfx = `--${name}=`;
  return args.filter((a) => a.startsWith(pfx)).map((a) => a.slice(pfx.length));
}

function opt(args: string[], name: string): string | null {
  const all = opts(args, name);
  return all.length === 0 ? null : all[0];
}

async function resolveSystem(ref: string) {
  const [bySlug] = await db.select().from(rpgSystems).where(eq(rpgSystems.slug, ref)).limit(1);
  if (bySlug) return bySlug;
  // Looks like a UUID? try by id.
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ref)) {
    const [byId] = await db.select().from(rpgSystems).where(eq(rpgSystems.id, ref)).limit(1);
    if (byId) return byId;
  }
  throw new Error(`sistema não encontrado: ${ref}`);
}

async function main() {
  const args = process.argv.slice(2);
  const systemRef = opt(args, "system");
  const files = opts(args, "file");
  const title = opt(args, "title");
  const clear = hasFlag(args, "clear");

  if (!systemRef || files.length === 0) {
    throw new Error("uso: --system=<slug|uuid> --file=<caminho> [--file=...] [--title=..] [--clear]");
  }

  const system = await resolveSystem(systemRef);
  console.log(`[ingest] sistema: ${system.name} (${system.slug}) · ${files.length} arquivo(s)`);

  if (clear) {
    const removed = await chunkStore.deleteBySystem(system.id);
    await db.delete(systemDocuments).where(eq(systemDocuments.systemId, system.id));
    console.log(`[ingest] índice limpo: ${removed} chunk(s) removidos`);
  }

  for (const f of files) {
    if (!statSync(f).isFile()) {
      throw new Error(`arquivo não encontrado: ${f}`);
    }
    const bytes = new Uint8Array(readFileSync(f));
    const [doc] = await db.insert(systemDocuments).values({ systemId: system.id, fileUrl: `file://${f}` }).returning();
    const before = await chunkStore.countBySystem(system.id);
    await indexing.indexBytes(doc.id, system.id, bytes, title ?? f);
    const after = await chunkStore.countBySystem(system.id);
    const [updated] = await db.select().from(systemDocuments).where(eq(systemDocuments.id, doc.id)).limit(1);
    console.log(`[ingest]   ${f} -> ${after - before} chunk(s) (${updated?.status})`);
  }
  const total = await chunkStore.countBySystem(system.id);
  console.log(`[ingest] total no sistema: ${total} chunk(s)`);
}

main()
  .then(() => {
    console.log("[ingest] concluído.");
    process.exit(0);
  })
  .catch((err) => {
    console.error(`[ingest] ERRO: ${err instanceof Error ? err.message : err}`);
    process.exit(1);
  })
  .finally(() => sqlRaw.end());
