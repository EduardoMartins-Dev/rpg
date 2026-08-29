import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignMember, requireCampaignRole } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { updateCampaignSchema } from "@/server/modules/campaign/schemas";
import { deleteCampaign, get, update } from "@/server/modules/campaign/service";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    return NextResponse.json(await get(id, principal.userId));
  });
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignRole(id, principal.userId, "MASTER");
    const body = await parseBody(req, updateCampaignSchema);
    return NextResponse.json(await update(id, body, principal.userId));
  });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignRole(id, principal.userId, "MASTER");
    await deleteCampaign(id);
    return new NextResponse(null, { status: 204 });
  });
}
