"use client";

import Link from "next/link";
import type { Character, Member, V5Catalog, ClanView } from "@/lib/api";
import { DamageTrack } from "@/components/DamageTrack";

/**
 * Escudo do Mestre — painel só-leitura com os dados vitais de TODOS os personagens
 * da campanha lado a lado, sem precisar abrir ficha por ficha. O mestre vê de relance
 * Vitalidade, Força de Vontade, Fome, Humanidade, Clã e atributos de cada jogador.
 * Para editar, abre a ficha completa (link). Só o mestre recebe a aba que monta isto.
 */

type Dmg = { sup: number; agg: number };
const initials = (s: string) => (s || "?").slice(0, 2).toUpperCase();
const num = (v: unknown, d = 0): number => (Number.isFinite(Number(v)) ? Number(v) : d);

function pips(filled: number, max: number): string {
  const v = Math.max(0, Math.min(max, filled));
  return "●".repeat(v) + "○".repeat(max - v);
}

export function MasterScreen({
  campaignId, characters, members, catalog,
}: {
  campaignId: string; characters: Character[]; members: Member[]; catalog?: V5Catalog | null;
}) {
  const memberOf = new Map(members.map((m) => [m.userId, m]));

  if (characters.length === 0) {
    return <p className="empty" style={{ marginTop: 12 }}>Nenhuma ficha na campanha ainda. Os jogadores criam na aba <b>Fichas</b>.</p>;
  }

  return (
    <div data-testid="master-screen">
      <p className="muted" style={{ fontSize: 14, margin: "0 0 16px" }}>
        Escudo do Mestre — dados vitais de cada personagem de relance. Clique em um card para abrir a ficha completa.
      </p>
      <div className="ms-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {characters.map((c) => {
          const s = c.sheetData ?? {};
          const derived = (s.derived as Record<string, number>) ?? {};
          const healthDmg = (s.healthDmg as Dmg) ?? { sup: 0, agg: 0 };
          const wpDmg = (s.wpDmg as Dmg) ?? { sup: 0, agg: 0 };
          const clanId = (s.clan as string) ?? "";
          const clan: ClanView | undefined = catalog?.clans.find((cl) => cl.id === clanId);
          const attrs = (s.attributes as Record<string, number>) ?? {};
          const player = memberOf.get(c.playerId);
          const vitality = num(derived.vitality);
          const willpower = num(derived.willpower);
          const hunger = num(s.hunger);
          const humanity = num(s.humanity, 7);
          const bp = s.bloodPotency != null && s.bloodPotency !== "" ? String(s.bloodPotency) : "—";

          return (
            <div key={c.id} className="panel" data-testid="ms-card" style={{ margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {/* cabeçalho */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="avatar" style={{ borderRadius: 10 }}>{initials(c.name)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 17 }}>{c.name}</div>
                  <div className="muted" style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {player?.displayName ?? "—"}{clan ? ` · ${clan.label}` : clanId ? ` · ${clanId}` : ""}
                  </div>
                </div>
                <Link href={`/campaigns/${campaignId}/characters/${c.id}`} data-testid={`ms-open-${c.id}`}>
                  <button className="secondary" style={{ padding: "4px 10px", fontSize: 13 }}>Ficha →</button>
                </Link>
              </div>

              {/* trilhas de dano (só-leitura) */}
              <DamageTrack label="Vitalidade" max={vitality} sup={healthDmg.sup} agg={healthDmg.agg} readOnly />
              <DamageTrack label="Força de Vontade" max={willpower} sup={wpDmg.sup} agg={wpDmg.agg} readOnly />

              {/* recursos rápidos */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 13 }}>
                <span><span className="kv-label">Fome</span> <span className="mono" style={{ color: "var(--accent)" }}>{pips(hunger, 5)}</span></span>
                <span><span className="kv-label">Humanidade</span> <b>{humanity}</b></span>
                <span><span className="kv-label">P. Sangue</span> <b>{bp}</b></span>
              </div>

              {/* atributos resumidos */}
              {Object.keys(attrs).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", fontSize: 12 }} className="muted">
                  {Object.entries(attrs).filter(([, v]) => num(v) > 0).map(([k, v]) => (
                    <span key={k}>{titleCase(k)} <b style={{ color: "var(--text)" }}>{num(v)}</b></span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function titleCase(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
