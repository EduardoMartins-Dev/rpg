import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth } from "@/server/http/guards";
import { parseBody } from "@/server/http/validation";
import { getUserResponse, updateProfile } from "@/server/modules/auth/service";
import { updateProfileSchema } from "@/server/modules/auth/schemas";

export async function GET(req: NextRequest) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    return NextResponse.json(await getUserResponse(principal.userId));
  });
}

/** Edição do próprio perfil: nome, e-mail e foto. */
export async function PATCH(req: NextRequest) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const body = await parseBody(req, updateProfileSchema);
    return NextResponse.json(await updateProfile(principal.userId, body));
  });
}
