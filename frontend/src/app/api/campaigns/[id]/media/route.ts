import { NextRequest, NextResponse } from "next/server";
import { ApiError, withRoute } from "@/server/http/errors";
import { requireAuth, requireCampaignRole } from "@/server/http/guards";
import { MAX_IMAGE_BYTES, saveImage } from "@/server/modules/board/media";

/** Upload de imagem do dispositivo para o mural — só o MESTRE publica no mural. */
export async function POST(req: NextRequest, ctx: RouteContext<"/api/campaigns/[id]/media">) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const { id } = await ctx.params;
    await requireCampaignRole(id, principal.userId, "MASTER");

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw ApiError.badRequest("arquivo é obrigatório");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw ApiError.badRequest("imagem muito grande (máx. 3MB depois da compressão)");
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const saved = await saveImage(id, principal.userId, file.type, bytes);
    return NextResponse.json(saved, { status: 201 });
  });
}
