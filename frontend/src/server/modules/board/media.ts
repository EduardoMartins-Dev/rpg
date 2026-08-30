import { and, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { campaignMedia } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";

/** Formatos que o navegador exibe e que os celulares produzem. */
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * Teto do que aceitamos gravar. O navegador comprime antes de enviar (~200-400KB
 * típico), então isto é uma rede de segurança, não o caminho normal — e fica bem
 * abaixo do limite de corpo de request da plataforma serverless (~4.5MB).
 */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export type StoredMedia = { id: string; url: string };

export async function saveImage(
  campaignId: string,
  uploadedBy: string,
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
    .insert(campaignMedia)
    .values({ campaignId, uploadedBy, contentType: type, bytes: Buffer.from(bytes) })
    .returning({ id: campaignMedia.id });
  return { id: row.id, url: `/api/campaigns/${campaignId}/media/${row.id}` };
}

export async function getImage(
  campaignId: string,
  mediaId: string,
): Promise<{ contentType: string; bytes: Buffer }> {
  const [row] = await db
    .select({ contentType: campaignMedia.contentType, bytes: campaignMedia.bytes })
    .from(campaignMedia)
    .where(and(eq(campaignMedia.id, mediaId), eq(campaignMedia.campaignId, campaignId)))
    .limit(1);
  if (!row) {
    throw ApiError.notFound("imagem não encontrada");
  }
  return row;
}
