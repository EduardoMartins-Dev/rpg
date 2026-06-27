"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type CampaignNote } from "@/lib/api";

type Draft = { title: string; body: string };
const EMPTY: Draft = { title: "", body: "" };

/**
 * Anotações da campanha. Jogador vê e gerencia só as suas. Mestre vê as de
 * todos, com filtro por autor, e pode editar/excluir qualquer uma (canEdit
 * vem do backend). Backend: /campaigns/{id}/notes (role-aware).
 */
export function CampaignNotes({ campaignId, isMaster }: { campaignId: string; isMaster: boolean }) {
  const [notes, setNotes] = useState<CampaignNote[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY);
  const [authorFilter, setAuthorFilter] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try { setNotes(await api.get<CampaignNote[]>(`/campaigns/${campaignId}/notes`)); }
    catch (err) { setError(err instanceof Error ? err.message : "erro ao carregar anotações"); }
  }, [campaignId]);

  useEffect(() => { load(); }, [load]);

  // autores distintos (para o filtro do mestre)
  const authors = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of notes) m.set(n.authorId, n.authorName);
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [notes]);

  const shown = useMemo(
    () => (authorFilter ? notes.filter((n) => n.authorId === authorFilter) : notes),
    [notes, authorFilter],
  );

  const empty = (d: Draft) => !d.title.trim() && !d.body.trim();

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (empty(draft)) return;
    setError(null);
    try {
      await api.post(`/campaigns/${campaignId}/notes`, draft);
      setDraft(EMPTY); setCreating(false); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "erro ao salvar anotação"); }
  }

  function startEdit(n: CampaignNote) {
    setEditing(n.id);
    setEditDraft({ title: n.title ?? "", body: n.body ?? "" });
  }

  async function saveEdit(n: CampaignNote) {
    if (empty(editDraft)) return;
    setError(null);
    try {
      await api.put(`/campaigns/${campaignId}/notes/${n.id}`, editDraft);
      setEditing(null); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "erro ao salvar"); }
  }

  async function remove(n: CampaignNote) {
    if (!confirm("Excluir esta anotação?")) return;
    setError(null);
    try { await api.del(`/campaigns/${campaignId}/notes/${n.id}`); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "erro ao excluir"); }
  }

  return (
    <div data-testid="campaign-notes">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <span className="muted" style={{ fontSize: 14 }}>
          {isMaster ? "Você é Mestre — vê as anotações de todos os jogadores." : "Suas anotações da crônica — só você e o mestre veem."}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {isMaster && authors.length > 0 && (
            <select data-testid="notes-author-filter" value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)} style={{ minWidth: 180 }}>
              <option value="">Todos os jogadores ({notes.length})</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({notes.filter((n) => n.authorId === a.id).length})
                </option>
              ))}
            </select>
          )}
          {!creating && <button data-testid="note-new" onClick={() => setCreating(true)}>+ Nova anotação</button>}
        </div>
      </div>

      {creating && (
        <form className="panel" onSubmit={add} data-testid="note-form" style={{ margin: "0 0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          <input data-testid="note-title" value={draft.title} placeholder="Título (opcional)"
            onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <textarea data-testid="note-body" value={draft.body} placeholder="Escreva sua anotação…" rows={5}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })} style={{ resize: "vertical" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" data-testid="note-save" disabled={empty(draft)}>Salvar</button>
            <button type="button" className="secondary" onClick={() => { setCreating(false); setDraft(EMPTY); }}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="board-grid" data-testid="notes-list">
        {shown.map((n) => (
          <div key={n.id} className="panel board-card" data-testid="note-card" style={{ margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
            {editing === n.id ? (
              <>
                <input value={editDraft.title} placeholder="Título"
                  onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} />
                <textarea value={editDraft.body} placeholder="Anotação" rows={5} style={{ resize: "vertical" }}
                  onChange={(e) => setEditDraft({ ...editDraft, body: e.target.value })} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => saveEdit(n)} disabled={empty(editDraft)}>Salvar</button>
                  <button className="secondary" onClick={() => setEditing(null)}>Cancelar</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  {n.title ? <h3 style={{ margin: 0, fontFamily: "var(--serif)", fontSize: 16 }}>{n.title}</h3> : <span className="muted" style={{ fontSize: 13 }}>sem título</span>}
                  {isMaster && <span className="badge" data-testid="note-author">{n.authorName}</span>}
                </div>
                <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{n.body || <span className="muted">—</span>}</p>
                {n.canEdit && (
                  <div style={{ display: "flex", gap: 6, marginTop: "auto", paddingTop: 8, borderTop: "1px solid var(--border)" }}>
                    <button className="ghost" data-testid={`note-edit-${n.id}`} onClick={() => startEdit(n)} style={{ padding: "2px 8px" }}>Editar</button>
                    <button className="ghost" data-testid={`note-delete-${n.id}`} onClick={() => remove(n)} style={{ padding: "2px 8px", color: "var(--err)" }}>Excluir</button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {shown.length === 0 && (
        <p className="empty" style={{ marginTop: 12 }} data-testid="notes-empty">
          {isMaster ? "Nenhuma anotação dos jogadores ainda." : "Você ainda não tem anotações. Crie a primeira."}
        </p>
      )}
      {error && <p className="error" data-testid="notes-error" style={{ marginTop: 14 }}>⚠ {error}</p>}
    </div>
  );
}
