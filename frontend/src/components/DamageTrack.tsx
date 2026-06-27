"use client";

/**
 * Trilha de dano V5 (Vitalidade / Força de Vontade): caixas com dano Superficial (╱)
 * e Agravado (✕). Agravado preenche a partir da esquerda, depois Superficial.
 * sup+agg nunca passa de max. readOnly só exibe.
 */
export function DamageTrack({
  label, max, sup, agg, onChange, readOnly,
}: {
  label: string; max: number; sup: number; agg: number;
  onChange?: (sup: number, agg: number) => void; readOnly?: boolean;
}) {
  const a = Math.max(0, Math.min(max, agg));
  const s = Math.max(0, Math.min(max - a, sup));
  const boxes = Array.from({ length: max }, (_, i) => {
    if (i < a) return "agg";
    if (i < a + s) return "sup";
    return "empty";
  });

  function set(ns: number, na: number) {
    const na2 = Math.max(0, Math.min(max, na));
    const ns2 = Math.max(0, Math.min(max - na2, ns));
    onChange?.(ns2, na2);
  }

  return (
    <div className="track">
      <div className="track-head">
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span className="mono muted" style={{ fontSize: 12 }}>{max - s - a}/{max} livres</span>
      </div>
      <div className="track-boxes">
        {boxes.map((b, i) => (
          <span key={i} className={`box ${b}`}>{b === "agg" ? "✕" : b === "sup" ? "╱" : ""}</span>
        ))}
        {max === 0 && <span className="muted" style={{ fontSize: 12 }}>—</span>}
      </div>
      {!readOnly && (
        <div className="track-ctrl">
          <span className="muted" style={{ fontSize: 12 }}>Superficial</span>
          <button className="secondary" onClick={() => set(s - 1, a)} style={{ padding: "2px 9px" }}>−</button>
          <span className="mono" style={{ minWidth: 14, textAlign: "center" }}>{s}</span>
          <button className="secondary" onClick={() => set(s + 1, a)} style={{ padding: "2px 9px" }}>+</button>
          <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>Agravado</span>
          <button className="secondary" onClick={() => set(s, a - 1)} style={{ padding: "2px 9px" }}>−</button>
          <span className="mono" style={{ minWidth: 14, textAlign: "center" }}>{a}</span>
          <button className="secondary" onClick={() => set(s, a + 1)} style={{ padding: "2px 9px" }}>+</button>
        </div>
      )}
    </div>
  );
}
