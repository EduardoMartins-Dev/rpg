import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignRole } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { renameFolderSchema } from "@/server/modules/folder/schemas";
import { remove, rename } from "@/server/modules/folder/service";

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/folders/[folderId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id, folderId } = await ctx.params;
    await requireCampaignRole(id, principal.userId, "MASTER");
    const body = await parseBody(req, renameFolderSchema);
    return NextResponse.json(await rename(id, folderId, body.name));
  });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/folders/[folderId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id, folderId } = await ctx.params;
    await requireCampaignRole(id, principal.userId, "MASTER");
    await remove(id, folderId);
    return new NextResponse(null, { status: 204 });
  });
}
