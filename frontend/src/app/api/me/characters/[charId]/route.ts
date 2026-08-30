import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { characterRequestSchema } from "@/server/modules/character/schemas";
import { deleteMine, getMine, updateMine } from "@/server/modules/character/service";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/me/characters/[charId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { charId } = await ctx.params;
    return NextResponse.json(await getMine(charId, principal.userId));
  });
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/me/characters/[charId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { charId } = await ctx.params;
    const body = await parseBody(req, characterRequestSchema);
    return NextResponse.json(await updateMine(charId, body, principal.userId));
  });
}

export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/me/characters/[charId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { charId } = await ctx.params;
    await deleteMine(charId, principal.userId);
    return new NextResponse(null, { status: 204 });
  });
}
