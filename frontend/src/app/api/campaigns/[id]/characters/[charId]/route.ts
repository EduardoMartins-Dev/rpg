import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignMember } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { characterRequestSchema } from "@/server/modules/character/schemas";
import { deleteCharacter, get, update } from "@/server/modules/character/service";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/characters/[charId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id, charId } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    return NextResponse.json(await get(id, charId, principal.userId));
  });
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/characters/[charId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id, charId } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    const body = await parseBody(req, characterRequestSchema);
    return NextResponse.json(await update(id, charId, body, principal.userId));
  });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/characters/[charId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id, charId } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    await deleteCharacter(id, charId, principal.userId);
    return new NextResponse(null, { status: 204 });
  });
}
