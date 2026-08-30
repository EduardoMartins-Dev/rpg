import { NextRequest, NextResponse } from "next/server";
import { withRoute, ApiError } from "@/server/http/errors";
import { requireAuth, requireCampaignMember, requireCampaignRole } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { createFolderSchema, folderKindSchema } from "@/server/modules/folder/schemas";
import { create, list } from "@/server/modules/folder/service";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/folders">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignMember(id, principal.userId);
    const parsed = folderKindSchema.safeParse(new URL(req.url).searchParams.get("kind"));
    if (!parsed.success) throw ApiError.badRequest("kind: must be 'board' or 'notes'");
    return NextResponse.json(await list(id, parsed.data));
  });
}

export async function POST(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/folders">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignRole(id, principal.userId, "MASTER");
    const body = await parseBody(req, createFolderSchema);
    return NextResponse.json(await create(id, body.kind, body.name, body.parentId), { status: 201 });
  });
}
