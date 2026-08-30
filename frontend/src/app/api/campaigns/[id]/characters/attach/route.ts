import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignMember } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { attachCharacterSchema } from "@/server/modules/character/schemas";
import { copyToCampaign } from "@/server/modules/character/service";

/** Copia uma ficha avulsa do jogador (de "Personagens") para esta campanha. */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/characters/attach">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    const body = await parseBody(req, attachCharacterSchema);
    return NextResponse.json(await copyToCampaign(body.characterId, id, principal.userId), { status: 201 });
  });
}
