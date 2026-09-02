"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, type CampaignRoll } from "@/lib/api";

/** De quanto em quanto tempo buscamos rolagens novas em segundo plano.
 * 4s dá sensação de "ao vivo" sem martelar o serverless/DB. O polling só roda
 * com a aba visível (pausa em background) e é silencioso (não pisca o spinner). */
const POLL_MS = 4000;

/**
 * Últimas rolagens da mesa. O mestre vê o de TODOS os jogadores (é o ponto: conferir
 * o que cada um tirou sem depender do jogador narrar); o jogador vê só as suas.
 *
 * Mostra primeiro a última rolagem de CADA jogador (a pergunta mais comum na mesa:
 * "o que fulano tirou?") e, abaixo, o histórico recente completo.
 */

const OUTCOME: Record<string, { label: string; color: string }> = {
  SUCESSO: { label: "Sucesso", color: "var(--ok)" },
  CRITICO: { label: "Crítico!", color: "var(--accent)" },
  CRITICO_CONFUSO: { label: "Crítico Confuso", color: "var(--warn)" },
  FALHA: { label: "Falha", color: "var(--muted)" },
  FALHA_BESTIAL: { label: "Falha Bestial", color: "var(--err)" },
  ROUSE_OK: { label: "Rouse ok", color: "var(--ok)" },
  ROUSE_FALHA: { label: "Rouse falhou (+1 Fome)", color: "var(--err)" },
};

function quando(iso: string): string {
  const seg = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seg < 60) return "agora";
  if (seg < 3600) return `${Math.floor(seg / 60)} min`;
  if (seg < 86400) return `${Math.floor(seg / 3600)} h`;
  return new Date(iso).toLocaleDateString("pt-BR");
}

function Dados({ dice }: { dice: { v: number; hunger: boolean }[] }) {
  return (
    <span className="roll-dice">
      {dice.map((d, i) => (
        <span
          key={i}
          className={`die res${d.hunger ? " hunger" : ""}${d.v >= 6 ? " hit" : ""}`}
          title={d.hunger ? "dado de Fome" : "dado normal"}
        >
          {d.v}
        </span>
      ))}
    </span>
  );
}

function Linha({ r, destaque }: { r: CampaignRoll; destaque?: boolean }) {
  const o = OUTCOME[r.outcome] ?? { label: r.outcome, color: "var(--muted)" };
  return (
    <div className={`roll-row${destaque ? " destaque" : ""}`} data-testid="roll-row">
      <div className="roll-row-head">
        <span style={{ fontWeight: 600 }}>{r.playerName}</span>
        {r.characterName && <span className="muted">· {r.characterName}</span>}
        <span className="muted roll-when">{quando(r.createdAt)}</span>
      </div>
      <div className="muted" style={{ fontSize: 13 }}>
        {r.label}
        {r.difficulty > 0 && <> · dif. {r.difficulty}</>}
        {r.hunger > 0 && <> · fome {r.hunger}</>}
      </div>
      <Dados dice={r.dice} />
      <div style={{ fontSize: 13 }}>
        <b style={{ color: o.color }}>{o.label}</b>
        {!r.outcome.startsWith("ROUSE") && (
          <span className="muted"> · {r.successes} sucesso{r.successes === 1 ? "" : "s"}</span>
        )}
      </div>
    </div>
  );
}

export function RollFeed({ campaignId, isMaster }: { campaignId: string; isMaster: boolean }) {
  const [rolls, setRolls] = useState<CampaignRoll[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [aoVivo, setAoVivo] = useState(true);
  const inFlight = useRef(false); // evita empilhar requisições se uma demorar

  /** silent = atualização de fundo (sem spinner). Só troca o estado se algo mudou,
   * pra não re-renderizar a lista inteira à toa a cada 4s. */
  const load = useCallback(async (silent = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    if (!silent) setCarregando(true);
    try {
      const next = await api.get<CampaignRoll[]>(`/campaigns/${campaignId}/rolls`);
      setRolls((prev) => (prev.length === next.length && prev[0]?.id === next[0]?.id ? prev : next));
      setError(null);
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : "erro ao carregar as rolagens");
    } finally {
      inFlight.current = false;
      if (!silent) setCarregando(false);
    }
  }, [campaignId]);

  // Carga inicial + polling em segundo plano enquanto a aba está visível.
  useEffect(() => {
    load();
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => { if (!timer) timer = setInterval(() => load(true), POLL_MS); setAoVivo(true); };
    const stop = () => { if (timer) { clearInterval(timer); timer = null; } setAoVivo(false); };
    const onVis = () => { if (document.visibilityState === "visible") { load(true); start(); } else { stop(); } };
    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, [load]);

  // Última de cada jogador: a lista já vem do mais recente para o mais antigo.
  const ultimaPorJogador: CampaignRoll[] = [];
  const vistos = new Set<string>();
  for (const r of rolls) {
    if (!vistos.has(r.userId)) { vistos.add(r.userId); ultimaPorJogador.push(r); }
  }

  return (
    <div data-testid="roll-feed">
      <div className="board-head">
        <span className="muted" style={{ fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span className={`live-dot${aoVivo ? "" : " off"}`} data-testid="rolls-live" aria-hidden />
          {isMaster
            ? (aoVivo
                ? "Rolagens da mesa ao vivo — aparecem sozinhas assim que o jogador rola."
                : "Ao vivo pausado (aba em segundo plano) — volte para retomar.")
            : "Suas últimas rolagens nesta campanha."}
        </span>
        <button className="secondary" onClick={() => load()} disabled={carregando} data-testid="rolls-refresh">
          {carregando ? <><span className="spinner" /> Atualizando…</> : "↻ Atualizar"}
        </button>
      </div>

      {rolls.length === 0 && !error && (
        <p className="empty" data-testid="rolls-empty">
          Nenhuma rolagem ainda. Os dados rolados na aba <b>Visão geral</b> ou na ficha aparecem aqui.
        </p>
      )}

      {isMaster && ultimaPorJogador.length > 0 && (
        <>
          <div className="kv-label" style={{ marginBottom: 8 }}>Última de cada jogador</div>
          <div className="roll-grid" data-testid="rolls-latest">
            {ultimaPorJogador.map((r) => <Linha key={r.id} r={r} destaque />)}
          </div>
        </>
      )}

      {rolls.length > 0 && (
        <>
          <div className="kv-label" style={{ margin: "18px 0 8px" }}>Histórico recente</div>
          <div className="roll-grid" data-testid="rolls-history">
            {rolls.map((r) => <Linha key={r.id} r={r} />)}
          </div>
        </>
      )}

      {error && <p className="error" style={{ marginTop: 14 }} data-testid="rolls-error">⚠ {error}</p>}
    </div>
  );
}
