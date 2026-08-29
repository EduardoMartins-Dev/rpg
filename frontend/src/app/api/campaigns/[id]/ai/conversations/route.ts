import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignMember } from "@/server/http/guards";
import { create, list } from "@/server/modules/ai/chatService";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/ai/conversations">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    return NextResponse.json(await list(id, principal.userId));
  });
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/ai/conversations">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    return NextResponse.json(await create(id, principal.userId));
  });
}
