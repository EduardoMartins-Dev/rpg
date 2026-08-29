import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAdmin, requireAuth } from "@/server/http/guards";
import { clearIndex } from "@/server/modules/system/service";

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/systems/[id]/index">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    const { id } = await ctx.params;
    const removedChunks = await clearIndex(id);
    return NextResponse.json({ removedChunks });
  });
}
