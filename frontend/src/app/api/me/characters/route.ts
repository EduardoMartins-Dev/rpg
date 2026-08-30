import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { standaloneCharacterSchema } from "@/server/modules/character/schemas";
import { createStandalone, listMine } from "@/server/modules/character/service";

export async function GET(req: NextRequest) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    return NextResponse.json(await listMine(principal.userId));
  });
}

export async function POST(req: NextRequest) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const body = await parseBody(req, standaloneCharacterSchema);
    return NextResponse.json(await createStandalone(principal.userId, body.name, body.systemId), { status: 201 });
  });
}
