import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { createCampaignSchema } from "@/server/modules/campaign/schemas";
import { create, listForUser } from "@/server/modules/campaign/service";

export async function GET(req: NextRequest) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    return NextResponse.json(await listForUser(principal.userId));
  });
}

export async function POST(req: NextRequest) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const body = await parseBody(req, createCampaignSchema);
    return NextResponse.json(await create(body, principal.userId), { status: 201 });
  });
}
