import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth } from "@/server/http/guards";
import { listMine } from "@/server/modules/character/service";

export async function GET(req: NextRequest) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    return NextResponse.json(await listMine(principal.userId));
  });
}
