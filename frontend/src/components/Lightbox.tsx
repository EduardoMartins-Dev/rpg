"use client";

import { useEffect, useRef, useState } from "react";
import { AuthImage } from "@/components/AuthImage";

type View = { s: number; x: number; y: number };
const MIN_S = 1, MAX_S = 6;
const clampS = (s: number) => Math.min(MAX_S, Math.max(MIN_S, s));

/**
 * Imagem em tela cheia COM zoom e arrasto (compartilhada por Mural e Anotações) — feita
 * para mapas e documentos.
 *  · roda do mouse = zoom no ponto do cursor; botões −/⟲/+ ; duplo-clique alterna 1×↔2,5×
 *  · no celular: pinça com dois dedos para dar zoom, um dedo para arrastar
 *  · fecha no ✕, Esc ou clicando no fundo escuro (fora da imagem)
 * Reaproveita a MESMA blob URL do card (AuthImage memoiza por caminho), então abrir não
 * rebaixa a imagem. touchAction:none entrega o gesto de toque para os nossos handlers.
 */
export function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [v, setV] = useState<View>({ s: 1, x: 0, y: 0 });
  const vRef = useRef(v); vRef.current = v;
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const pts = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ dist: number; s: number; cx: number; cy: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") zoomAt(1.25, 0, 0);
      else if (e.key === "-" || e.key === "_") zoomAt(1 / 1.25, 0, 0);
      else if (e.key === "0") setV({ s: 1, x: 0, y: 0 });
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  // Aplica zoom por `k` mantendo fixo o ponto (px,py) relativo ao CENTRO do palco.
  function zoomAt(k: number, px: number, py: number) {
    setV((c) => {
      const ns = clampS(c.s * k);
      const kk = ns / c.s;
      if (ns <= 1) return { s: 1, x: 0, y: 0 };
      return { s: ns, x: px - (px - c.x) * kk, y: py - (py - c.y) * kk };
    });
  }
  function rel(clientX: number, clientY: number) {
    const r = stageRef.current!.getBoundingClientRect();
    return { px: clientX - (r.left + r.width / 2), py: clientY - (r.top + r.height / 2) };
  }
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const { px, py } = rel(e.clientX, e.clientY);
    zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, px, py);
  }
  function onPointerDown(e: React.PointerEvent) {
    stageRef.current?.setPointerCapture(e.pointerId);
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.current.size === 2) {
      const [a, b] = [...pts.current.values()];
      const mid = rel((a.x + b.x) / 2, (a.y + b.y) / 2);
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), s: vRef.current.s, cx: mid.px, cy: mid.py };
      drag.current = null;
    } else if (pts.current.size === 1) {
      drag.current = { px: e.clientX, py: e.clientY, ox: vRef.current.x, oy: vRef.current.y };
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pts.current.size >= 2) {
      const [a, b] = [...pts.current.values()];
      const nd = Math.hypot(a.x - b.x, a.y - b.y);
      const k = nd / pinch.current.dist;
      const ns = clampS(pinch.current.s * k);
      const kk = ns / pinch.current.s;
      const { cx, cy } = pinch.current;
      setV(ns <= 1 ? { s: 1, x: 0, y: 0 } : { s: ns, x: cx - (cx - 0) * kk, y: cy - (cy - 0) * kk });
    } else if (drag.current && pts.current.size === 1) {
      setV((c) => ({ ...c, x: drag.current!.ox + (e.clientX - drag.current!.px), y: drag.current!.oy + (e.clientY - drag.current!.py) }));
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    pts.current.delete(e.pointerId);
    if (pts.current.size < 2) pinch.current = null;
    if (pts.current.size === 0) drag.current = null;
  }

  const zoomed = v.s > 1;
  return (
    <div className="lightbox-overlay" role="dialog" aria-modal="true" aria-label={alt}
      data-testid="board-lightbox" onClick={onClose}>
      <button type="button" className="lightbox-close" aria-label="Fechar" onClick={onClose}>✕</button>
      <div className="lightbox-toolbar" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="secondary" aria-label="Menos zoom" onClick={() => zoomAt(1 / 1.25, 0, 0)}>−</button>
        <span className="lightbox-zoom mono">{Math.round(v.s * 100)}%</span>
        <button type="button" className="secondary" aria-label="Mais zoom" onClick={() => zoomAt(1.25, 0, 0)}>+</button>
        <button type="button" className="secondary" aria-label="Redefinir zoom" title="Redefinir" onClick={() => setV({ s: 1, x: 0, y: 0 })}>⟲</button>
      </div>
      <div
        ref={stageRef}
        className="lightbox-stage"
        style={{ cursor: zoomed ? "grab" : "zoom-in", touchAction: "none" }}
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          if (zoomed) { setV({ s: 1, x: 0, y: 0 }); return; }
          const { px, py } = rel(e.clientX, e.clientY);
          zoomAt(2.5, px, py);
        }}
      >
        <div style={{ transform: `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.s})`, transition: drag.current || pinch.current ? "none" : "transform .12s ease-out", willChange: "transform" }}>
          <AuthImage src={src} alt={alt} className="lightbox-img" />
        </div>
      </div>
    </div>
  );
}
