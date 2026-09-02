import { NextRequest, NextResponse } from "next/server";
import { ApiError, withRoute } from "@/server/http/errors";
import { requireAuth } from "@/server/http/guards";
import { MAX_IMAGE_BYTES, saveUserImage } from "@/server/modules/user/media";

/** Upload da própria imagem (avatar de perfil ou retrato da ficha). Qualquer jogador. */
export async function POST(req: NextRequest) {
  return withRoute(async () => {
    const principal = await requireAuth(req);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw ApiError.badRequest("arquivo é obrigatório");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw ApiError.badRequest("imagem muito grande (máx. 3MB depois da compressão)");
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const saved = await saveUserImage(principal.userId, file.type, bytes);
    return NextResponse.json(saved, { status: 201 });
  });
}
