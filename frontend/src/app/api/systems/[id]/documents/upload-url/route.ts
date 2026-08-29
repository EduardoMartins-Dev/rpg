import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAdmin, requireAuth } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { uploadUrlRequestSchema } from "@/server/modules/system/schemas";
import { createUploadUrl } from "@/server/modules/system/service";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/systems/[id]/documents/upload-url">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    const { id } = await ctx.params;
    const body = await parseBody(req, uploadUrlRequestSchema);
    return NextResponse.json(await createUploadUrl(id, body.filename));
  });
}
