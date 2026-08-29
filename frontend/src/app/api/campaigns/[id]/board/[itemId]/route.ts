import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignRole } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { boardItemRequestSchema } from "@/server/modules/board/schemas";
import { deleteItem, update } from "@/server/modules/board/service";

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/board/[itemId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id, itemId } = await ctx.params;
    await requireCampaignRole(id, principal.userId, "MASTER");
    const body = await parseBody(req, boardItemRequestSchema);
    return NextResponse.json(await update(id, itemId, body));
  });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/board/[itemId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id, itemId } = await ctx.params;
    await requireCampaignRole(id, principal.userId, "MASTER");
    await deleteItem(id, itemId);
    return new NextResponse(null, { status: 204 });
  });
}
