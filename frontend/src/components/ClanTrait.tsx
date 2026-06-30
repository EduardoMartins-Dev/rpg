"use client";

/**
 * Caixa de destaque para os traços de clã que costumavam ficar "de lado": a Maldição
 * (fraqueza inata) e a Compulsão. São centrais na trama, então ganham bloco próprio,
 * cor e ícone — usado tanto no seletor de clã quanto na visualização da ficha.
 */
export function ClanTrait({ kind, text }: { kind: "bane" | "compulsion"; text: string }) {
  const bane = kind === "bane";
  const color = bane ? "var(--err)" : "var(--accent)";
  return (
    <div data-testid={`clan-${kind}`} style={{
      marginTop: 10, padding: "10px 12px", borderRadius: 8,
      borderLeft: `3px solid ${color}`,
      background: bane ? "rgba(217,72,59,0.08)" : "var(--accent-tint)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color }}>
        <span aria-hidden>{bane ? "⛧" : "◈"}</span>
        <span>{bane ? "Maldição do Clã" : "Compulsão"}</span>
      </div>
      <p style={{ margin: ".35rem 0 0", lineHeight: 1.55 }}>{text || "—"}</p>
      {bane && (
        <p className="muted" style={{ fontSize: 12, margin: "6px 0 0" }}>
          Fraqueza inata do clã; a severidade segue a <b>Gravidade da Perdição</b> da Potência de
          Sangue — quanto maior a potência, mais forte.
        </p>
      )}
      {!bane && (
        <p className="muted" style={{ fontSize: 12, margin: "6px 0 0" }}>
          Sob estresse, o clã sente um impulso difícil de resistir até saciá-lo.
        </p>
      )}
    </div>
  );
}
