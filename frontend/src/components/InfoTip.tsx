"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";

type Pos = { x: number; y: number; place: "top" | "bottom" };

/**
 * Envolve um gatilho (chip, texto, ícone) e mostra uma dica flutuante com a
 * descrição ao passar o mouse OU ao focar via teclado. Usa `position: fixed`
 * com coordenadas do gatilho para não ser cortada por containers com overflow.
 * Sem `desc`, renderiza apenas o gatilho.
 */
export function HoverTip({ desc, title, hint, children, className, style }: {
  desc?: string;
  title?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState<Pos | null>(null);

  if (!desc) return <>{children}</>;

  const show = () => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Perto do topo da janela, mostra abaixo; senão, acima do gatilho.
    const place: "top" | "bottom" = r.top < 190 ? "bottom" : "top";
    const x = Math.max(150, Math.min(window.innerWidth - 150, r.left + r.width / 2));
    const y = place === "bottom" ? r.bottom + 8 : r.top - 8;
    setPos({ x, y, place });
  };
  const hide = () => setPos(null);

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: "inline-flex", position: "relative", ...style }}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {pos && (
        <span
          role="tooltip"
          className="hovertip"
          data-place={pos.place}
          style={{
            left: pos.x,
            top: pos.y,
            transform: pos.place === "bottom" ? "translate(-50%, 0)" : "translate(-50%, -100%)",
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
