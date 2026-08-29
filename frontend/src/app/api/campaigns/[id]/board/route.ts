import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignMember, requireCampaignRole } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { boardItemRequestSchema } from "@/server/modules/board/schemas";
import { create, list } from "@/server/modules/board/service";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/board">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    return NextResponse.json(await list(id));
  });
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/board">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignRole(id, principal.userId, "MASTER");
    const body = await parseBody(req, boardItemRequestSchema);
    return NextResponse.json(await create(id, body), { status: 201 });
  });
}
