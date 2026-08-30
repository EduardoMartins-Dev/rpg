import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignMember } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { createRollSchema } from "@/server/modules/roll/schemas";
import { list, record } from "@/server/modules/roll/service";

/** Histórico de rolagens: o MESTRE vê a mesa toda, o jogador vê só as suas. */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/rolls">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    const role = await requireCampaignMember(id, principal.userId);
    return NextResponse.json(await list(id, principal.userId, role === "MASTER"));
  });
}

/** Registra uma rolagem. Qualquer membro registra as próprias. */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/rolls">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    const body = await parseBody(req, createRollSchema);
    return NextResponse.json(await record(id, principal.userId, body), { status: 201 });
  });
}
