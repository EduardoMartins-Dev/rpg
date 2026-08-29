import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { parseBody } from "@/server/http/validation";
import { registerSchema } from "@/server/modules/auth/schemas";
import { register } from "@/server/modules/auth/service";

export async function POST(req: NextRequest) {
  return withRoute(async () => {
    const body = await parseBody(req, registerSchema);
    const user = await register(body);
    return NextResponse.json(user, { status: 201 });
  });
}
