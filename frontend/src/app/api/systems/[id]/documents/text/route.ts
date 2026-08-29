import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAdmin, requireAuth } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { textDocumentRequestSchema } from "@/server/modules/system/schemas";
import { uploadText } from "@/server/modules/system/service";

export const maxDuration = 60;

export async function POST(req: NextRequest, ctx: RouteContext<"/api/systems/[id]/documents/text">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    const { id } = await ctx.params;
    const clear = req.nextUrl.searchParams.get("clear") === "true";
    const body = await parseBody(req, textDocumentRequestSchema);
    const doc = await uploadText(id, body.title, body.text, clear);
    return NextResponse.json(doc, { status: 201 });
  });
}
