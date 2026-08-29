import { NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { registrationEnabled } from "@/server/modules/auth/service";

export async function GET() {
  return withRoute(async () => NextResponse.json({ registrationEnabled: registrationEnabled() }));
}
