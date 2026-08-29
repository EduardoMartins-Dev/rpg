import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignMember } from "@/server/http/guards";
import { listMembers } from "@/server/modules/campaign/service";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/members">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    return NextResponse.json(await listMembers(id));
  });
}
