"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequireUser } from "@/lib/guard";
import { AppShell } from "@/components/AppShell";
import { DynamicSheet } from "@/components/DynamicSheet";
import { SheetView } from "@/components/SheetView";
import { SessionSheet } from "@/components/SessionSheet";
import { T20Sheet } from "@/components/T20Sheet";
import type { RolledEvent } from "@/components/V5Roller";
import {
  api, type Campaign, type Character, type SchemaShape, type SheetSchema,
  type RpgSystem, type V5Catalog, type T20Catalog,
} from "@/lib/api";

type Sheet = Record<string, unknown>;
const str = (v: unknown): string => (v == null ? "" : String(v));

export default function CharacterSheetPage() {
  const { user } = useRequireUser();
  const params = useParams<{ id: string; charId: string }>();
  const { id, charId } = params;

  const [schema, setSchema] = useState<SchemaShape | null>(null);
  const [catalog, setCatalog] = useState<V5Catalog | null>(null);
  const [ruleset, setRuleset] = useState<string>("v5");
  const [t20cat, setT20cat] = useState<T20Catalog | null>(null);
  const [name, setName] = useState("");
  const [sheet, setSheet] = useState<Sheet>({});
  const [mode, setMode] = useState<"session" | "edit" | "view">("edit");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const campaign = await api.get<Campaign>(`/campaigns/${id}`);
      const system = await api.get<RpgSystem>(`/systems/${campaign.systemId}`);
      const rs = system.ruleset ?? "v5";
      setRuleset(rs);
      // O T20 não usa sheet-schema (valida pelo catálogo); os demais precisam dele.
      if (rs === "t20") setSchema({});
      else setSchema((await api.get<SheetSchema>(`/systems/${campaign.systemId}/sheet-schema`)).schema);
      // Cada ruleset carrega seu catálogo; os outros ficam nulos.
      if (rs === "v5") {
        try { setCatalog(await api.get<V5Catalog>("/rules/v5/catalog")); } catch { setCatalog(null); }
        setT20cat(null);
      } else if (rs === "t20") {
        try { setT20cat(await api.get<T20Catalog>("/rules/t20/catalog")); } catch { setT20cat(null); }
        setCatalog(null);
      } else {
        setCatalog(null); setT20cat(null);
      }
      const ch = await api.get<Character>(`/campaigns/${id}/characters/${charId}`);
      setName(ch.name);
      const sd = ch.sheetData ?? {};
      setSheet(sd);
      // Ficha já construída (tem atributos) abre direto na SESSÃO (ferramenta de mesa);
      // ficha nova abre no editor para ser montada.
      const attrs = sd.attributes as Record<string, number> | undefined;
      const built = !!attrs && Object.values(attrs).some((v) => Number(v) > 0);
      setMode(built ? "session" : "edit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao carregar ficha");
    }
  }, [id, charId]);

  useEffect(() => { if (user) load(); }, [user, load]);

  async function save() {
    setMsg(null); setError(null);
    try {
      const updated = await api.put<Character>(`/campaigns/${id}/characters/${charId}`, {
        name, sheetData: sheet,
      });
      setSheet(updated.sheetData ?? {}); // reflete derivados/clã recalculados no servidor
      setMsg("Ficha salva.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao salvar");
    }
  }

  /** Grava a rolagem no histórico da mesa, junto com o nome do personagem (o mestre vê
   *  no Escudo). Silencioso em erro: o dado já apareceu para o jogador. */
  const recordRoll = useCallback(async (e: RolledEvent) => {
    try { await api.post(`/campaigns/${id}/rolls`, { ...e, characterName: name || null }); }
    catch { /* histórico é acessório */ }
  }, [id, name]);

  // Auto-save da SESSÃO: cada interação na barra de status grava na hora (otimista),
  // depois reconcilia com os derivados recalculados no servidor. Em erro, recarrega.
  async function persist(next: Sheet) {
    setError(null);
    setSheet(next);
    try {
      const updated = await api.put<Character>(`/campaigns/${id}/characters/${charId}`, {
        name, sheetData: next,
      });
      setSheet(updated.sheetData ?? {});
      setSavedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao salvar");
      await load();
    }
  }

  if (!user) return <p className="muted" style={{ padding: 38 }}>Carregando…</p>;

  return (
    <AppShell user={user} active="campaigns">
      <div className="page page-narrow" data-testid="sheet-page">
        <p style={{ marginTop: 0 }}>
          <Link href={`/campaigns/${id}`}>← Campanha</Link>
        </p>

        <div className="sheet-head">
          {str(sheet.avatarUrl) ? (
            <span className="portrait" data-testid="header-portrait">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={str(sheet.avatarUrl)} alt="retrato" />
            </span>
          ) : (
            <span className="avatar lg" style={{ background: "linear-gradient(135deg,#2a2e38,#1a1d24)" }}>
              {(name || "?").slice(0, 1).toUpperCase()}
            </span>
          )}
          <div style={{ flex: 1 }}>
            <input data-testid="sheet-name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Nome do personagem"
              onBlur={() => { if (ruleset === "t20") persist(sheet); }}
              style={{ background: "none", border: "none", padding: 0, fontFamily: "var(--serif)", fontSize: 26, fontWeight: 600, boxShadow: "none" }} />
            <div className="mono" style={{ fontSize: 13, color: "var(--accent)" }}>Ficha dinâmica</div>
          </div>
          {/* O T20 salva sozinho e é sempre editável, então não tem Sessão/Editar/Visualizar:
              mostra só o status de auto-save. Os demais rulesets mantêm o alternador. */}
          {ruleset === "t20" ? (
            <span className="mono muted" data-testid="sheet-autosave" style={{ fontSize: 12, alignSelf: "center" }}>
              {savedAt ? "✓ salvo" : "salva automaticamente"}
            </span>
          ) : (
            <>
              <div className="seg" data-testid="sheet-mode">
                <button className={mode === "session" ? "on" : ""} data-testid="mode-session" onClick={() => setMode("session")}>Sessão</button>
                <button className={mode === "edit" ? "on" : ""} data-testid="mode-edit" onClick={() => setMode("edit")}>Editar</button>
                <button className={mode === "view" ? "on" : ""} data-testid="mode-view" onClick={() => setMode("view")}>Visualizar</button>
              </div>
              {mode === "edit" && <button data-testid="sheet-save" onClick={save}>Salvar ficha</button>}
              {mode === "session" && savedAt && (
                <span className="mono muted" data-testid="session-saved" style={{ fontSize: 12 }}>✓ salvo</span>
              )}
            </>
          )}
        </div>

        <div className="panel">
          {ruleset === "t20" ? (
            <T20Sheet sheet={sheet} catalog={t20cat} onPersist={persist} />
          ) : !schema ? (
            <p className="muted">Carregando schema…</p>
          ) : mode === "view" ? (
            <SheetView schema={schema} sheet={sheet} catalog={catalog} />
          ) : mode === "session" ? (
            <SessionSheet sheet={sheet} catalog={catalog} onPersist={persist} onRolled={recordRoll} />
          ) : (
            <DynamicSheet schema={schema} sheet={sheet} onChange={setSheet} catalog={catalog} />
          )}
        </div>

        {msg && <p className="ok-msg" data-testid="sheet-msg">✓ {msg}</p>}
        {error && <p className="error" data-testid="sheet-error">⚠ {error}</p>}
      </div>
    </AppShell>
  );
}
