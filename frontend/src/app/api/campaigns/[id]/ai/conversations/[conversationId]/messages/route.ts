import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignMember } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { sendMessageRequestSchema } from "@/server/modules/ai/schemas";
import { send } from "@/server/modules/ai/chatService";

export const maxDuration = 60;

export async function POST(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/ai/conversations/[conversationId]/messages">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id, conversationId } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    const body = await parseBody(req, sendMessageRequestSchema);
    return NextResponse.json(await send(id, principal.userId, conversationId, body.question));
  });
}
