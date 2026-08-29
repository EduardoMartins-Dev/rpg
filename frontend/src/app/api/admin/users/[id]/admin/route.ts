import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAdmin, requireAuth } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { setAdminSchema } from "@/server/modules/user/schemas";
import { setAdmin } from "@/server/modules/user/service";

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/admin/users/[id]/admin">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    const { id } = await ctx.params;
    const body = await parseBody(req, setAdminSchema);
    return NextResponse.json(await setAdmin(id, principal.userId, body.admin));
  });
}
