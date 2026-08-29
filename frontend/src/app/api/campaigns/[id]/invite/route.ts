import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignRole } from "@/server/http/guards";
import { regenerateInvite } from "@/server/modules/campaign/service";

export async function POST(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/invite">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignRole(id, principal.userId, "MASTER");
    return NextResponse.json(await regenerateInvite(id));
  });
}
