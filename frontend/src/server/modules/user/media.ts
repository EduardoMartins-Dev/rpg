import { eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { userMedia } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";

/** Formatos que o navegador exibe e que os celulares produzem. */
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * Teto do que aceitamos gravar. O navegador comprime antes de enviar (~200-400KB
 * típico), então isto é uma rede de segurança — bem abaixo do limite de corpo de
 * request da plataforma serverless (~4.5MB). Igual ao mural (campaign_media).
 */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export type StoredMedia = { id: string; url: string };

/** Grava uma imagem do usuário (avatar/retrato) e devolve a URL servida por /api/media/{id}. */
export async function saveUserImage(
  ownerId: string,
  contentType: string,
  bytes: Uint8Array,
): Promise<StoredMedia> {
  const type = contentType.split(";")[0].trim().toLowerCase();
  if (!ALLOWED.has(type)) {
    throw ApiError.badRequest("formato não suportado (use JPEG, PNG, WebP ou GIF)");
  }
  if (bytes.length === 0) {
    throw ApiError.badRequest("imagem vazia");
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    throw ApiError.badRequest("imagem muito grande (máx. 3MB depois da compressão)");
  }
  const [row] = await db
    .insert(userMedia)
    .values({ ownerId, contentType: type, bytes: Buffer.from(bytes) })
    .returning({ id: userMedia.id });
  return { id: row.id, url: `/api/media/${row.id}` };
}

/** Lê os bytes de uma mídia de usuário por id. Qualquer usuário logado pode ver
 * (avatares e retratos são feitos para os outros jogadores verem). */
export async function getUserImage(
  mediaId: string,
): Promise<{ contentType: string; bytes: Buffer }> {
  const [row] = await db
    .select({ contentType: userMedia.contentType, bytes: userMedia.bytes })
    .from(userMedia)
    .where(eq(userMedia.id, mediaId))
    .limit(1);
  if (!row) {
    throw ApiError.notFound("imagem não encontrada");
  }
  return row;
}
