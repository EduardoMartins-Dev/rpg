import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignMember } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { askRequestSchema } from "@/server/modules/ai/schemas";
import { ask } from "@/server/rag/queryService";

export const maxDuration = 60;

export async function POST(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/ai/ask">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    const body = await parseBody(req, askRequestSchema);
    return NextResponse.json(await ask(id, body.question));
  });
}
