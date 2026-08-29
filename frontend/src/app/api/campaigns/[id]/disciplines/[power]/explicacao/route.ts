import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignMember } from "@/server/http/guards";
import { powerExplained } from "@/server/rag/queryService";

export const maxDuration = 60;

export async function GET(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/disciplines/[power]/explicacao">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id, power } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    return NextResponse.json(await powerExplained(id, power));
  });
}
