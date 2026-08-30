"use client";

/** Maior lado da imagem depois de redimensionar. Suficiente pra um card de mural
 *  nítido em tela retina, e derruba muito o peso de foto de celular. */
const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;

/**
 * Comprime a imagem NO NAVEGADOR antes de enviar. Foto de celular costuma ter 3-8MB,
 * o que estoura o limite de corpo de request da plataforma serverless (~4.5MB) e
 * incharia o banco; depois disto fica tipicamente em 200-400KB.
 *
 * GIF passa direto (o canvas perderia a animação). Se algo falhar na conversão,
 * devolve o arquivo original — o servidor ainda valida tipo e tamanho.
 */
export async function compressImage(file: File): Promise<File> {
  if (file.type === "image/gif") return file;
  if (!file.type.startsWith("image/")) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
    );
    if (!blob) return file;
    // Se a "compressão" não ajudou (imagem já pequena/otimizada), fica com a original.
    if (blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
