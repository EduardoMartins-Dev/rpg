import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignMember } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { noteRequestSchema } from "@/server/modules/note/schemas";
import { create, list } from "@/server/modules/note/service";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/notes">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    const role = await requireCampaignMember(id, principal.userId);
    return NextResponse.json(await list(id, principal.userId, role === "MASTER"));
  });
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/notes">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    const role = await requireCampaignMember(id, principal.userId);
    const body = await parseBody(req, noteRequestSchema);
    return NextResponse.json(await create(id, principal.userId, role === "MASTER", body), { status: 201 });
  });
}
