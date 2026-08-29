import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignMember } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { noteRequestSchema } from "@/server/modules/note/schemas";
import { deleteNote, update } from "@/server/modules/note/service";

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/notes/[noteId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id, noteId } = await ctx.params;
    const role = await requireCampaignMember(id, principal.userId);
    const body = await parseBody(req, noteRequestSchema);
    return NextResponse.json(await update(id, noteId, principal.userId, role === "MASTER", body));
  });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/notes/[noteId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id, noteId } = await ctx.params;
    const role = await requireCampaignMember(id, principal.userId);
    await deleteNote(id, noteId, principal.userId, role === "MASTER");
    return new NextResponse(null, { status: 204 });
  });
}
