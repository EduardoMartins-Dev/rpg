import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth } from "@/server/http/guards";
import { getUserImage } from "@/server/modules/user/media";

/**
 * Serve uma imagem de usuário (avatar/retrato). Exige apenas estar logado — avatares e
 * retratos são feitos para os outros jogadores da mesa verem. Cacheável por bastante
 * tempo porque o id é imutável: um upload novo gera um id novo, então nunca há stale.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/media/[id]">) {
  return withRoute(async () => {
    await requireAuth(req);
    const { id } = await ctx.params;
    const { contentType, bytes } = await getUserImage(id);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  });
}
