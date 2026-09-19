import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAdmin, requireAuth } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { resetPasswordSchema } from "@/server/modules/user/schemas";
import { resetPassword } from "@/server/modules/user/service";

// Reset de senha pelo admin (não há fluxo self-service de "esqueci a senha").
export async function PUT(req: NextRequest, ctx: RouteContext<"/api/admin/users/[id]/password">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    const { id } = await ctx.params;
    const body = await parseBody(req, resetPasswordSchema);
    return NextResponse.json(await resetPassword(id, body.password));
  });
}
