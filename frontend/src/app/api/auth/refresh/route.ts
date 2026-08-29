import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { parseBody } from "@/server/http/validation";
import { refreshSchema } from "@/server/modules/auth/schemas";
import { refresh } from "@/server/modules/auth/service";

export async function POST(req: NextRequest) {
  return withRoute(async () => {
    const body = await parseBody(req, refreshSchema);
    const tokens = await refresh(body.refreshToken);
    return NextResponse.json(tokens);
  });
}
