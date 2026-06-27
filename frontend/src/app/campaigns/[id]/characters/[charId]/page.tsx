"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequireUser } from "@/lib/guard";
import { AppShell } from "@/components/AppShell";
import { DynamicSheet } from "@/components/DynamicSheet";
import { SheetView } from "@/components/SheetView";
import {
  api, type Campaign, type Character, type SchemaShape, type SheetSchema,
  type RpgSystem, type V5Catalog,
} from "@/lib/api";

type Sheet = Record<string, unknown>;

export default function CharacterSheetPage() {
  const { user } = useRequireUser();
  const params = useParams<{ id: string; charId: string }>();
  const { id, charId } = params;

  const [schema, setSchema] = useState<SchemaShape | null>(null);
  const [catalog, setCatalog] = useState<V5Catalog | null>(null);
  const [name, setName] = useState("");
  const [sheet, setSheet] = useState<Sheet>({});
  const [viewMode, setViewMode] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const campaign = await api.get<Campaign>(`/campaigns/${id}`);
      const system = await api.get<RpgSystem>(`/systems/${campaign.systemId}`);
      const sc = await api.get<SheetSchema>(`/systems/${campaign.systemId}/sheet-schema`);
      setSchema(sc.schema);
      // Catálogo V5 só quando o sistema usa o ruleset v5 (admin define). Senão, ficha genérica.
      if ((system.ruleset ?? "v5") === "v5") {
        try { setCatalog(await api.get<V5Catalog>("/rules/v5/catalog")); }
        catch { setCatalog(null); }
      } else {
        setCatalog(null);
      }
      const ch = await api.get<Character>(`/campaigns/${id}/characters/${charId}`);
      setName(ch.name);
      setSheet(ch.sheetData ?? {});
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

  if (!user) return <p className="muted" style={{ padding: 38 }}>Carregando…</p>;

  return (
    <AppShell user={user} active="campaigns">
      <div className="page page-narrow" data-testid="sheet-page">
        <p style={{ marginTop: 0 }}>
          <Link href={`/campaigns/${id}`}>← Campanha</Link>
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}>
          <span className="avatar lg" style={{ background: "linear-gradient(135deg,#2a2e38,#1a1d24)" }}>
            {(name || "?").slice(0, 1).toUpperCase()}
          </span>
          <div style={{ flex: 1 }}>
            <input data-testid="sheet-name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Nome do personagem"
              style={{ background: "none", border: "none", padding: 0, fontFamily: "var(--serif)", fontSize: 26, fontWeight: 600, boxShadow: "none" }} />
            <div className="mono" style={{ fontSize: 13, color: "var(--accent)" }}>Ficha dinâmica</div>
          </div>
          <div className="seg" data-testid="sheet-mode">
            <button className={!viewMode ? "on" : ""} data-testid="mode-edit" onClick={() => setViewMode(false)}>Editar</button>
            <button className={viewMode ? "on" : ""} data-testid="mode-view" onClick={() => setViewMode(true)}>Visualizar</button>
          </div>
          {!viewMode && <button data-testid="sheet-save" onClick={save}>Salvar ficha</button>}
        </div>

        <div className="panel">
          {!schema ? (
            <p className="muted">Carregando schema…</p>
          ) : viewMode ? (
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
