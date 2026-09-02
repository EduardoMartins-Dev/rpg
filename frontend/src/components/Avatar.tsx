"use client";

import { useEffect, useState } from "react";
import { fetchBlobUrl } from "@/lib/api";

/**
 * Avatar circular do usuário. Se houver foto (`src`), busca a imagem com o Bearer token
 * (a mídia em /api/media/... exige autenticação, então um <img>/background comum tomaria
 * 401) e mostra como blob URL; enquanto carrega ou se falhar, cai nas iniciais. Sem foto,
 * mostra só as iniciais — o mesmo visual de sempre.
 */
export function Avatar({
  src, name, className, style,
}: {
  src?: string | null;
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const initials = (name || "?").slice(0, 2).toUpperCase();
  const needsAuth = !!src && src.startsWith("/api/");
  const [blob, setBlob] = useState<{ src: string; url: string } | null>(null);

  useEffect(() => {
    if (!src || !needsAuth) return;
    let alive = true;
    fetchBlobUrl(src)
      .then((url) => { if (alive) setBlob({ src, url }); })
      .catch(() => { if (alive) setBlob(null); });
    return () => { alive = false; };
  }, [src, needsAuth]);

  const resolved = !src ? null : needsAuth ? (blob?.src === src ? blob.url : null) : src;

  return (
    <span
      className={`avatar${className ? ` ${className}` : ""}`}
      style={resolved ? { backgroundImage: `url(${resolved})`, color: "transparent", ...style } : style}
      aria-label={name}
    >
      {resolved ? "" : initials}
    </span>
  );
}
