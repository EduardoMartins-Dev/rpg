"use client";

import Link from "next/link";
import type { Character, Member, V5Catalog, ClanView } from "@/lib/api";
import { DamageTrack } from "@/components/DamageTrack";
import { Avatar } from "@/components/Avatar";

/**
 * Escudo do Mestre — painel só-leitura com os dados vitais de TODOS os personagens
 * da campanha lado a lado, sem precisar abrir ficha por ficha. O card se adapta ao
 * sistema: V5 (Vitalidade/Força de Vontade/Fome/Humanidade/Clã) ou Tormenta 20
 * (PV/PM/Defesa/classe/atributos). O mestre ajusta os vitais ao vivo (salva na ficha).
 */

type Dmg = { sup: number; agg: number };
const num = (v: unknown, d = 0): number => (Number.isFinite(Number(v)) ? Number(v) : d);
const str = (v: unknown): string => (typeof v === "string" ? v : "");

function pips(filled: number, max: number): string {
  const v = Math.max(0, Math.min(max, filled));
  return "●".repeat(v) + "○".repeat(max - v);
}

const T20_ABBR: Record<string, string> = {
  forca: "For", destreza: "Des", constituicao: "Con", inteligencia: "Int", sabedoria: "Sab", carisma: "Car",
};
const T20_ATTR_ORDER = ["forca", "destreza", "constituicao", "inteligencia", "sabedoria", "carisma"];

export function MasterScreen({
  campaignId, characters, members, catalog, onDamage, onPatch,
}: {
  campaignId: string; characters: Character[]; members: Member[]; catalog?: V5Catalog | null;
  /** Persiste a edição de dano de uma trilha na ficha do jogador (V5). */
  onDamage: (c: Character, field: "healthDmg" | "wpDmg", sup: number, agg: number) => void;
  /** Mescla um patch no sheetData e persiste (usado p/ PV/PM do T20). */
  onPatch: (c: Character, patch: Record<string, unknown>) => void;
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
      <div className="ms-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {characters.map((c) => {
          const s = c.sheetData ?? {};
          const player = memberOf.get(c.playerId);
          const isT20 = s.type === "T20";

          const header = (subtitle: string) => (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar src={typeof s.avatarUrl === "string" ? s.avatarUrl : null} name={c.name} style={{ borderRadius: 10 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--serif)", fontWeight: 600, fontSize: 17 }}>{c.name}</div>
                <div className="muted" style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {player?.displayName ?? "—"}{subtitle}
                </div>
              </div>
              <Link href={`/campaigns/${campaignId}/characters/${c.id}`} data-testid={`ms-open-${c.id}`}>
                <button className="secondary" style={{ padding: "4px 10px", fontSize: 13 }}>Ficha →</button>
              </Link>
            </div>
          );

          if (isT20) {
            const derived = (s.derived as Record<string, number | null>) ?? {};
            const attrs = (s.atributos as Record<string, number>) ?? {};
            const pvMax = derived.pvMax != null ? num(derived.pvMax) : null;
            const pmMax = derived.pmMax != null ? num(derived.pmMax) : null;
            const defesa = num(derived.defesa, 10);
            const pvDano = num(s.pvDano);
            const pmGasto = num(s.pmGasto);
            const classe = str(s.classe);
            const nivel = num(s.nivel, 1);
            const sub = classe ? ` · ${classe.charAt(0).toUpperCase() + classe.slice(1)} nível ${nivel}` : ` · nível ${nivel}`;

            return (
              <div key={c.id} className="panel" data-testid="ms-card" style={{ margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {header(sub)}
                <div style={{ display: "flex", gap: 10 }}>
                  <Pool label="PV" atual={pvMax != null ? pvMax - pvDano : null} max={pvMax} color="var(--ok)"
                    onDelta={(d) => onPatch(c, { pvDano: Math.max(0, Math.min(pvMax ?? Infinity, pvDano - d)) })} />
                  <Pool label="PM" atual={pmMax != null ? pmMax - pmGasto : null} max={pmMax} color="var(--info)"
                    onDelta={(d) => onPatch(c, { pmGasto: Math.max(0, Math.min(pmMax ?? Infinity, pmGasto - d)) })} />
                  <div className="ms-defbox" data-testid="ms-defesa">
                    <div className="ms-defbox-val">{defesa}</div>
                    <div className="muted" style={{ fontSize: 11 }}>Defesa</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", fontSize: 12 }} className="muted">
                  {T20_ATTR_ORDER.map((k) => (
                    <span key={k}>{T20_ABBR[k]} <b style={{ color: "var(--text)" }}>{num(attrs[k]) >= 0 ? `+${num(attrs[k])}` : num(attrs[k])}</b></span>
                  ))}
                </div>
              </div>
            );
          }

          // --- V5 ---
          const derived = (s.derived as Record<string, number>) ?? {};
          const healthDmg = (s.healthDmg as Dmg) ?? { sup: 0, agg: 0 };
          const wpDmg = (s.wpDmg as Dmg) ?? { sup: 0, agg: 0 };
          const clanId = (s.clan as string) ?? "";
          const clan: ClanView | undefined = catalog?.clans.find((cl) => cl.id === clanId);
          const attrs = (s.attributes as Record<string, number>) ?? {};
          const vitality = num(derived.vitality);
          const willpower = num(derived.willpower);
          const hunger = num(s.hunger);
          const humanity = num(s.humanity, 7);
          const bp = s.bloodPotency != null && s.bloodPotency !== "" ? String(s.bloodPotency) : "—";

          return (
            <div key={c.id} className="panel" data-testid="ms-card" style={{ margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {header(clan ? ` · ${clan.label}` : clanId ? ` · ${clanId}` : "")}
              <DamageTrack label="Vitalidade" max={vitality} sup={healthDmg.sup} agg={healthDmg.agg}
                onChange={(sp, a) => onDamage(c, "healthDmg", sp, a)} />
              <DamageTrack label="Força de Vontade" max={willpower} sup={wpDmg.sup} agg={wpDmg.agg}
                onChange={(sp, a) => onDamage(c, "wpDmg", sp, a)} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 13 }}>
                <span><span className="kv-label">Fome</span> <span className="mono" style={{ color: "var(--accent)" }}>{pips(hunger, 5)}</span></span>
                <span><span className="kv-label">Humanidade</span> <b>{humanity}</b></span>
                <span><span className="kv-label">P. Sangue</span> <b>{bp}</b></span>
              </div>
              {Object.keys(attrs).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", fontSize: 12 }} className="muted">
                  {Object.entries(attrs).filter(([, v]) => num(v) > 0).map(([k, v]) => (
                    <span key={k}>{k.charAt(0).toUpperCase() + k.slice(1)} <b style={{ color: "var(--text)" }}>{num(v)}</b></span>
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

/** Reserva numérica (PV/PM) com controles −/+ que o mestre ajusta ao vivo. */
function Pool({ label, atual, max, color, onDelta }: {
  label: string; atual: number | null; max: number | null; color: string; onDelta: (d: number) => void;
}) {
  return (
    <div className="ms-pool" data-testid={`ms-pool-${label}`}>
      <div className="ms-pool-head" style={{ color }}>
        <b style={{ fontSize: 20 }}>{atual ?? "—"}</b><span className="muted" style={{ fontSize: 13 }}> / {max ?? "—"}</span>
      </div>
      <div className="muted" style={{ fontSize: 11 }}>{label}</div>
      <div className="ms-pool-ctrls">
        <button className="ghost" onClick={() => onDelta(-1)} title={`-1 ${label}`}>−</button>
        <button className="ghost" onClick={() => onDelta(1)} title={`+1 ${label}`}>＋</button>
      </div>
    </div>
  );
}
