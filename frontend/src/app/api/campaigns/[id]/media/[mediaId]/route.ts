import { NextRequest, NextResponse } from "next/server";
import { withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignMember } from "@/server/http/guards";
import { getImage } from "@/server/modules/board/media";

/**
 * Serve a imagem do mural. Exige ser membro da campanha (a mídia é da mesa, não
 * pública). Cacheável no navegador por bastante tempo porque o id é imutável: um
 * upload novo gera um id novo, então nunca há stale.
 */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/media/[mediaId]">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id, mediaId } = await ctx.params;
    await requireCampaignMember(id, principal.userId);

    const { contentType, bytes } = await getImage(id, mediaId);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(bytes.length),
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  });
}
