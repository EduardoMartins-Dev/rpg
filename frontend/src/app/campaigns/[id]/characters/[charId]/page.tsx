"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRequireUser } from "@/lib/guard";
import { DynamicSheet } from "@/components/DynamicSheet";
import { api, type Campaign, type Character, type SchemaShape, type SheetSchema } from "@/lib/api";

type Sheet = Record<string, unknown>;

export default function CharacterSheetPage() {
  const { user } = useRequireUser();
  const params = useParams<{ id: string; charId: string }>();
  const { id, charId } = params;

  const [schema, setSchema] = useState<SchemaShape | null>(null);
  const [name, setName] = useState("");
  const [sheet, setSheet] = useState<Sheet>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const campaign = await api.get<Campaign>(`/campaigns/${id}`);
      const sc = await api.get<SheetSchema>(`/systems/${campaign.systemId}/sheet-schema`);
      setSchema(sc.schema);
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

  if (!user) return <p className="muted">Carregando…</p>;

  return (
    <div data-testid="sheet-page">
      <p><Link href={`/campaigns/${id}`}>← Campanha</Link></p>
      <h1>Ficha</h1>

      <div className="panel">
        <label htmlFor="char-name">Nome do personagem</label>
        <input id="char-name" data-testid="sheet-name" value={name}
          onChange={(e) => setName(e.target.value)} />

        {schema ? (
          <div style={{ marginTop: "1rem" }}>
            <DynamicSheet schema={schema} sheet={sheet} onChange={setSheet} />
          </div>
        ) : (
          <p className="muted">Carregando schema…</p>
        )}

        <div style={{ marginTop: "1rem" }}>
          <button data-testid="sheet-save" onClick={save}>Salvar ficha</button>
        </div>
        {msg && <p data-testid="sheet-msg" style={{ color: "#8ae6a0" }}>{msg}</p>}
        {error && <p className="error" data-testid="sheet-error">{error}</p>}
      </div>
    </div>
  );
}
