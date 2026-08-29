import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAdmin, requireAuth } from "@/server/http/guards";
import { deleteDocument } from "@/server/modules/system/service";

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/systems/[id]/documents/[docId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    const { id, docId } = await ctx.params;
    await deleteDocument(id, docId);
    return new NextResponse(null, { status: 204 });
  });
}
