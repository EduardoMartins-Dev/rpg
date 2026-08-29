import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { parseBody } from "@/server/http/validation";
import { loginSchema } from "@/server/modules/auth/schemas";
import { login } from "@/server/modules/auth/service";

export async function POST(req: NextRequest) {
  return withRoute(async () => {
    const body = await parseBody(req, loginSchema);
    const tokens = await login(body);
    return NextResponse.json(tokens);
  });
}
