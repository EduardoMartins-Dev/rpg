import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAdmin, requireAuth } from "@/server/http/guards";
import { deleteUser } from "@/server/modules/user/service";

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/admin/users/[id]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    const { id } = await ctx.params;
    await deleteUser(id, principal.userId);
    return new NextResponse(null, { status: 204 });
  });
}
