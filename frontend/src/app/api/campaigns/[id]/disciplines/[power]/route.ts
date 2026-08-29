import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignMember } from "@/server/http/guards";
import { powerText } from "@/server/rag/queryService";

export const maxDuration = 30;

export async function GET(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/disciplines/[power]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id, power } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    return NextResponse.json(await powerText(id, power));
  });
}
