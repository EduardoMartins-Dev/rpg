"use client";

import { useEffect, useState } from "react";
import { fetchBlobUrl } from "@/lib/api";

type Fetched = { src: string; url: string | null; failed: boolean };

/**
 * Imagem que pode vir de duas origens:
 *  - URL externa colada pelo mestre  -> usa direto no <img>, sem estado nenhum
 *  - mídia enviada do dispositivo    -> vem de /api/campaigns/.../media/..., que exige
 *    o Bearer token; um <img src> comum não manda header nenhum e tomaria 401, então
 *    aqui a imagem é buscada por fetch autenticado e exibida como blob URL.
 */
export function AuthImage({
  src, alt, className, style, onError,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
}) {
  const needsAuth = src.startsWith("/api/");
  // O estado carrega junto o src a que pertence, então trocar de imagem não exige
  // limpar estado no corpo do efeito (o que dispararia render em cascata): o render
  // compara e mostra o esqueleto enquanto o resultado ainda é de outro src.
  const [fetched, setFetched] = useState<Fetched | null>(null);
  const [broken, setBroken] = useState<string | null>(null);

  useEffect(() => {
    if (!needsAuth) return;
    let alive = true;
    fetchBlobUrl(src)
      .then((url) => { if (alive) setFetched({ src, url, failed: false }); })
      .catch(() => { if (alive) { setFetched({ src, url: null, failed: true }); onError?.(); } });
    // Sem revokeObjectURL aqui de propósito: fetchBlobUrl memoiza por caminho, então a
    // MESMA blob URL é compartilhada por todas as instâncias (prévia + card) e por
    // remontagens. Revogar na limpeza matava a URL que a montagem seguinte ia usar —
    // no StrictMode, que roda o efeito duas vezes, a imagem nunca aparecia.
    return () => { alive = false; };
    // onError é intencionalmente omitido: só interessa refazer o fetch quando a URL muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, needsAuth]);

  if (broken === src) return null;

  const resolved = needsAuth ? (fetched?.src === src ? fetched : null) : { src, url: src, failed: false };

  if (resolved?.failed) return null;
  if (!resolved?.url) {
    return <span className="skel" style={{ display: "block", height: 160, ...style }} aria-label={alt} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved.url}
      alt={alt}
      className={className}
      style={style}
      onError={() => { setBroken(src); onError?.(); }}
    />
  );
}
