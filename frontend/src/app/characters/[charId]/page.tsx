"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequireUser } from "@/lib/guard";
import { AppShell } from "@/components/AppShell";
import { DynamicSheet } from "@/components/DynamicSheet";
import { SheetView } from "@/components/SheetView";
import { T20Sheet } from "@/components/T20Sheet";
import {
  api, type Character, type SchemaShape, type SheetSchema,
  type RpgSystem, type V5Catalog, type T20Catalog,
} from "@/lib/api";

type Sheet = Record<string, unknown>;
const str = (v: unknown): string => (v == null ? "" : String(v));

/**
 * Editor de ficha AVULSA (em "Personagens", fora de qualquer campanha). Mesmo wizard da
 * ficha de campanha, mas só Editar/Visualizar — não há Sessão (nem rolagens) sem uma mesa.
 * Carrega o schema pelo sistema da própria ficha (systemId), não por campanha.
 */
export default function StandaloneCharacterPage() {
  const { user } = useRequireUser();
  const { charId } = useParams<{ charId: string }>();

  const [schema, setSchema] = useState<SchemaShape | null>(null);
  const [catalog, setCatalog] = useState<V5Catalog | null>(null);
  const [ruleset, setRuleset] = useState<string>("v5");
  const [t20cat, setT20cat] = useState<T20Catalog | null>(null);
  const [name, setName] = useState("");
  const [sheet, setSheet] = useState<Sheet>({});
  const [mode, setMode] = useState<"edit" | "view">("edit");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const ch = await api.get<Character>(`/me/characters/${charId}`);
      setName(ch.name);
      setSheet(ch.sheetData ?? {});
      if (!ch.systemId) throw new Error("ficha sem sistema");
      const system = await api.get<RpgSystem>(`/systems/${ch.systemId}`);
      const rs = system.ruleset ?? "v5";
      setRuleset(rs);
      // O T20 não usa sheet-schema (valida pelo catálogo); os demais precisam dele.
      if (rs === "t20") setSchema({});
      else setSchema((await api.get<SheetSchema>(`/systems/${ch.systemId}/sheet-schema`)).schema);
      if (rs === "v5") {
        try { setCatalog(await api.get<V5Catalog>("/rules/v5/catalog")); } catch { setCatalog(null); }
        setT20cat(null);
      } else if (rs === "t20") {
        try { setT20cat(await api.get<T20Catalog>("/rules/t20/catalog")); } catch { setT20cat(null); }
        setCatalog(null);
      } else {
        setCatalog(null); setT20cat(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao carregar ficha");
    }
  }, [charId]);

  useEffect(() => { if (user) load(); }, [user, load]);

  async function save() {
    setMsg(null); setError(null);
    try {
      const updated = await api.put<Character>(`/me/characters/${charId}`, { name, sheetData: sheet });
      setSheet(updated.sheetData ?? {}); // reflete derivados/clã recalculados no servidor
      setMsg("Ficha salva.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "erro ao salvar");
    }
  }

  if (!user) return <p className="muted" style={{ padding: 38 }}>Carregando…</p>;

  return (
    <AppShell user={user} active="characters">
      <div className="page page-narrow" data-testid="standalone-sheet-page">
        <p style={{ marginTop: 0 }}>
          <Link href="/characters">← Personagens</Link>
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
              style={{ background: "none", border: "none", padding: 0, fontFamily: "var(--serif)", fontSize: 26, fontWeight: 600, boxShadow: "none" }} />
            <div className="mono" style={{ fontSize: 13, color: "var(--accent)" }}>Ficha avulsa</div>
          </div>
          <div className="seg" data-testid="sheet-mode">
            <button className={mode === "edit" ? "on" : ""} data-testid="mode-edit" onClick={() => setMode("edit")}>Editar</button>
            <button className={mode === "view" ? "on" : ""} data-testid="mode-view" onClick={() => setMode("view")}>Visualizar</button>
          </div>
          {mode === "edit" && <button data-testid="sheet-save" onClick={save}>Salvar ficha</button>}
        </div>

        <div className="panel">
          {ruleset === "t20" ? (
            <T20Sheet sheet={sheet} catalog={t20cat} onPersist={async (next) => {
              setSheet(next);
              try {
                const updated = await api.put<Character>(`/me/characters/${charId}`, { name, sheetData: next });
                setSheet(updated.sheetData ?? {});
              } catch (err) { setError(err instanceof Error ? err.message : "erro ao salvar"); }
            }} />
          ) : !schema ? (
            <p className="muted">Carregando schema…</p>
          ) : mode === "view" ? (
            <SheetView schema={schema} sheet={sheet} catalog={catalog} />
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
