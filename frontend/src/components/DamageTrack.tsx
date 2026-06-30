"use client";

/**
 * Trilha de dano V5 (Vitalidade / Força de Vontade): caixas com dano Superficial (╱)
 * e Agravado (✕). Agravado preenche a partir da esquerda, depois Superficial.
 *
 * Regra do livro (corebook p.126; exemplo do Eric, p.127): tomar dano num track JÁ CHEIO
 * NÃO é ignorado — "the third point turns a previously Superficial damage box into
 * Aggravated". Ou seja, quando não há caixa livre, cada novo ponto converte 1 Superficial
 * em Agravado. Com o track inteiro Agravado, o personagem está incapacitado (Vitalidade →
 * torpor/morte; FdV → derrota) e dano extra não tem mais efeito.
 *
 * O botão "+" APLICA dano (com transbordo); "−" CURA. readOnly só exibe.
 */
export function DamageTrack({
  label, max, sup, agg, onChange, readOnly,
}: {
  label: string; max: number; sup: number; agg: number;
  onChange?: (sup: number, agg: number) => void; readOnly?: boolean;
}) {
  const a = Math.max(0, Math.min(max, agg));
  const s = Math.max(0, Math.min(max - a, sup));
  const full = max > 0 && s + a >= max;
  const boxes = Array.from({ length: max }, (_, i) => {
    if (i < a) return "agg";
    if (i < a + s) return "sup";
    return "empty";
  });

  // Aplica 1 ponto de dano Superficial: enche uma caixa livre; se cheio, converte
  // um Superficial em Agravado (transbordo); se já tudo Agravado, sem efeito.
  function applySup() {
    if (s + a < max) onChange?.(s + 1, a);
    else if (s > 0) onChange?.(s - 1, a + 1);
  }
  // Aplica 1 ponto de dano Agravado: enche caixa livre; se cheio, "promove" um
  // Superficial a Agravado; se já tudo Agravado, sem efeito.
  function applyAgg() {
    if (s + a < max) onChange?.(s, a + 1);
    else if (s > 0) onChange?.(s - 1, a + 1);
  }
  const healSup = () => onChange?.(Math.max(0, s - 1), a);
  const healAgg = () => onChange?.(s, Math.max(0, a - 1));

  return (
    <div className="track">
      <div className="track-head">
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {full && (
            <span className="badge" data-testid="track-impaired"
              style={{ color: "var(--err)", borderColor: "var(--err)", fontSize: 11 }}>
              {a >= max ? "Incapacitado" : "Debilitado"}
            </span>
          )}
          <span className="mono muted" style={{ fontSize: 12 }}>{max - s - a}/{max} livres</span>
        </span>
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
          <button className="secondary" title="Curar 1 superficial" onClick={healSup} style={{ padding: "2px 9px" }}>−</button>
          <span className="mono" style={{ minWidth: 14, textAlign: "center" }}>{s}</span>
          <button className="secondary" title="Tomar 1 de dano superficial" onClick={applySup} style={{ padding: "2px 9px" }}>+</button>
          <span className="muted" style={{ fontSize: 12, marginLeft: 8 }}>Agravado</span>
          <button className="secondary" title="Curar 1 agravado" onClick={healAgg} style={{ padding: "2px 9px" }}>−</button>
          <span className="mono" style={{ minWidth: 14, textAlign: "center" }}>{a}</span>
          <button className="secondary" title="Tomar 1 de dano agravado" onClick={applyAgg} style={{ padding: "2px 9px" }}>+</button>
        </div>
      )}
    </div>
  );
}
