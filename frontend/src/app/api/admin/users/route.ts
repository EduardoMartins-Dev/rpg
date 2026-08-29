import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAdmin, requireAuth } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { createUserSchema } from "@/server/modules/user/schemas";
import { createUser, listUsers } from "@/server/modules/user/service";

export async function GET(req: NextRequest) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    return NextResponse.json(await listUsers());
  });
}

export async function POST(req: NextRequest) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    requireAdmin(principal);
    const body = await parseBody(req, createUserSchema);
    return NextResponse.json(await createUser(body), { status: 201 });
  });
}
