import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAdmin, requireAuth } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { storageDocumentRequestSchema } from "@/server/modules/system/schemas";
import { registerStorageDocument } from "@/server/modules/system/service";
import * as indexing from "@/server/rag/indexingService";

// Background indexing runs in `after()` for up to this route's max duration.
export const maxDuration = 60;

export async function POST(req: NextRequest, ctx: RouteContext<"/api/systems/[id]/documents/storage">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    const { id } = await ctx.params;
    const clear = req.nextUrl.searchParams.get("clear") === "true";
    const body = await parseBody(req, storageDocumentRequestSchema);
    const doc = await registerStorageDocument(id, body.path, clear);

    // Background: download + extract + embeddings, without blocking the response
    // (avoids the proxy timeout the Java backend's @Async was working around).
    after(async () => {
      try {
        await indexing.indexStorage(doc.id, id, body.path);
      } catch {
        await indexing.markFailed(doc.id);
      }
    });

    return NextResponse.json(doc, { status: 202 });
  });
}
