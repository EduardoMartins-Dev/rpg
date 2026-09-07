"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type Pos = { left: number; top: number };

/**
 * Envolve um gatilho (chip, texto, ícone) e mostra uma dica flutuante com a
 * descrição ao passar o mouse OU ao focar via teclado. A dica usa `position:
 * fixed` (não é cortada por containers com overflow) e, depois de renderizada,
 * é medida e presa dentro da janela — acima do gatilho por padrão, abaixo se
 * não houver espaço, sempre com as bordas dentro da viewport. Sem `desc`,
 * renderiza apenas o gatilho.
 */
export function HoverTip({ desc, title, hint, children, className, style }: {
  desc?: string;
  title?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const wrapRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);

  // Mede o gatilho e a própria dica (já no DOM, porém invisível) e calcula uma
  // posição inteiramente dentro da viewport, com 8px de margem.
  useEffect(() => {
    if (!open) return;
    const wrap = wrapRef.current, tip = tipRef.current;
    if (!wrap || !tip) return;
    const r = wrap.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const m = 8, vw = window.innerWidth, vh = window.innerHeight;
    const left = Math.max(m, Math.min(vw - tw - m, r.left + r.width / 2 - tw / 2));
    let top = r.top - m - th;                       // preferência: acima
    if (top < m) {                                   // sem espaço acima → abaixo
      const below = r.bottom + m;
      top = below + th <= vh - m ? below : Math.max(m, vh - th - m);
    }
    setPos({ left, top });
  }, [open]);

  if (!desc) return <>{children}</>;

  return (
    <span
      ref={wrapRef}
      className={className}
      style={{ display: "inline-flex", position: "relative", ...style }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { setOpen(false); setPos(null); }}
      onFocus={() => setOpen(true)}
      onBlur={() => { setOpen(false); setPos(null); }}
    >
      {children}
      {open && (
        <span
          ref={tipRef}
          role="tooltip"
          className="hovertip"
          style={{
            left: pos ? pos.left : -9999,
            top: pos ? pos.top : -9999,
            visibility: pos ? "visible" : "hidden",
          }}
        >
          {title && (
            <span className="hovertip-title">
              {title}
              {hint ? <span className="hovertip-hint"> · {hint}</span> : null}
            </span>
          )}
          <span className="hovertip-body">{desc}</span>
        </span>
      )}
    </span>
  );
}

/** Pequeno ícone "i" que revela a descrição ao passar o mouse / focar. */
export function InfoDot({ desc, title, hint }: { desc?: string; title?: string; hint?: string }) {
  if (!desc) return null;
  return (
    <HoverTip desc={desc} title={title} hint={hint}>
      <span
        className="infodot"
        role="button"
        tabIndex={0}
        aria-label={title ? `O que faz: ${title}` : "O que faz"}
      >
        i
      </span>
    </HoverTip>
  );
}

// Origem do conteúdo (fora do Livro Básico): rótulo, sigla e cor por fonte.
const SOURCE_META: Record<string, { label: string; short: string; cls: string; title: string }> = {
  companion: { label: "Companion", short: "C", cls: "src-companion", title: "Do Guia Suplementar (V5 Companion)" },
  players_guide: { label: "PG", short: "PG", cls: "src-pg", title: "Do Guia do Jogador (V5 Players Guide)" },
};

/** Pílula de origem (ex.: "Companion" azul, "PG" vermelho). Nada para conteúdo do Livro Básico. */
export function SourceBadge({ source }: { source?: string }) {
  const m = source ? SOURCE_META[source] : undefined;
  if (!m) return null;
  return <span className={`src-badge ${m.cls}`} title={m.title}>{m.label}</span>;
}

/** Sigla sobrescrita de origem ao lado de um nome (ex.: poder "C" / "PG"). */
export function SourceDot({ source }: { source?: string }) {
  const m = source ? SOURCE_META[source] : undefined;
  if (!m) return null;
  return <sup className={`src-dot ${m.cls}`} title={m.title}>{m.short}</sup>;
}
