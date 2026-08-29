import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignMember } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { characterRequestSchema } from "@/server/modules/character/schemas";
import { create, list } from "@/server/modules/character/service";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/characters">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    return NextResponse.json(await list(id, principal.userId));
  });
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/characters">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    const body = await parseBody(req, characterRequestSchema);
    return NextResponse.json(await create(id, principal.userId, body), { status: 201 });
  });
}
