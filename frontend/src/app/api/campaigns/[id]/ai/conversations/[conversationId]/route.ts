import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignMember } from "@/server/http/guards";
import { deleteConversation, get } from "@/server/modules/ai/chatService";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/ai/conversations/[conversationId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id, conversationId } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    return NextResponse.json(await get(id, principal.userId, conversationId));
  });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/ai/conversations/[conversationId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id, conversationId } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    await deleteConversation(id, principal.userId, conversationId);
    return new NextResponse(null, { status: 204 });
  });
}
