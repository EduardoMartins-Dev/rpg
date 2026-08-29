import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { joinCampaignSchema } from "@/server/modules/campaign/schemas";
import { join } from "@/server/modules/campaign/service";

export async function POST(req: NextRequest) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const body = await parseBody(req, joinCampaignSchema);
    return NextResponse.json(await join(body.inviteCode, principal.userId));
  });
}
