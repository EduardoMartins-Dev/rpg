import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAdmin, requireAuth } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { sheetSchemaRequestSchema } from "@/server/modules/system/schemas";
import { getSchema, putSchema } from "@/server/modules/system/service";

export async function GET(req: NextRequest, ctx: RouteContext<"/api/systems/[id]/sheet-schema">) {
  return withRoute(async () => {
    await requireAuth(req);
    const { id } = await ctx.params;
    return NextResponse.json(await getSchema(id));
  });
}

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/systems/[id]/sheet-schema">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    const { id } = await ctx.params;
    const body = await parseBody(req, sheetSchemaRequestSchema);
    return NextResponse.json(await putSchema(id, body));
  });
}
