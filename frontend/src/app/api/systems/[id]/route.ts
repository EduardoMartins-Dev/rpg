import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAdmin, requireAuth } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { systemRequestSchema } from "@/server/modules/system/schemas";
import { deleteSystem, get, update } from "@/server/modules/system/service";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/systems/[id]">) {
  return withRoute(async () => {
    await requireAuth(req);
    const { id } = await ctx.params;
    return NextResponse.json(await get(id));
  });
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/systems/[id]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    const { id } = await ctx.params;
    const body = await parseBody(req, systemRequestSchema);
    return NextResponse.json(await update(id, body));
  });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/systems/[id]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    const { id } = await ctx.params;
    await deleteSystem(id);
    return new NextResponse(null, { status: 204 });
  });
}
