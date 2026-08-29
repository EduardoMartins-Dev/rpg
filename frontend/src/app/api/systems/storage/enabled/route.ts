import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAdmin, requireAuth } from "@/server/http/guards";
import { storageEnabled } from "@/server/modules/system/service";

export async function GET(req: NextRequest) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    return NextResponse.json({ enabled: storageEnabled() });
  });
}
