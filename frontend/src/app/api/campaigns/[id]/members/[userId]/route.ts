import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignRole } from "@/server/http/guards";
import { removeMember } from "@/server/modules/campaign/service";

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/members/[userId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id, userId } = await ctx.params;
    await requireCampaignRole(id, principal.userId, "MASTER");
    await removeMember(id, userId);
    return new NextResponse(null, { status: 204 });
  });
}
