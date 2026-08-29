import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAdmin, requireAuth } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { systemRequestSchema } from "@/server/modules/system/schemas";
import { create, list } from "@/server/modules/system/service";

export async function GET(req: NextRequest) {
  return withRoute(async () => {
    await requireAuth(req);
    return NextResponse.json(await list());
  });
}

export async function POST(req: NextRequest) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    const body = await parseBody(req, systemRequestSchema);
    return NextResponse.json(await create(body, principal.userId), { status: 201 });
  });
}
