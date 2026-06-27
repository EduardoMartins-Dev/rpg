"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type BoardItem } from "@/lib/api";

type Draft = { title: string; body: string; imageUrl: string };
const EMPTY: Draft = { title: "", body: "", imageUrl: "" };

/**
 * Mural da campanha. Qualquer membro lê; só o mestre cria/edita/exclui cards.
 * Card = título/texto/imagem opcionais (imagem por URL). Ordenável (subir/descer).
 */
export function CampaignBoard({ campaignId, isMaster }: { campaignId: string; isMaster: boolean }) {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY);

  const load = useCallback(async () => {
    setError(null);
    try { setItems(await api.get<BoardItem[]>(`/campaigns/${campaignId}/board`)); }
    catch (err) { setError(err instanceof Error ? err.message : "erro ao carregar o mural"); }
  }, [campaignId]);

  useEffect(() => { load(); }, [load]);

  const empty = (d: Draft) => !d.title.trim() && !d.body.trim() && !d.imageUrl.trim();

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (empty(draft)) return;
    setError(null);
    try {
      await api.post(`/campaigns/${campaignId}/board`, draft);
      setDraft(EMPTY); setCreating(false); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "erro ao publicar card"); }
  }

  function startEdit(it: BoardItem) {
    setEditing(it.id);
    setEditDraft({ title: it.title ?? "", body: it.body ?? "", imageUrl: it.imageUrl ?? "" });
  }

  async function saveEdit(it: BoardItem) {
    if (empty(editDraft)) return;
    setError(null);
    try {
      await api.put(`/campaigns/${campaignId}/board/${it.id}`, { ...editDraft, sortOrder: it.sortOrder });
      setEditing(null); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "erro ao salvar card"); }
  }

  async function remove(it: BoardItem) {
    if (!confirm("Excluir este card do mural?")) return;
    setError(null);
    try { await api.del(`/campaigns/${campaignId}/board/${it.id}`); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "erro ao excluir card"); }
  }

  // Troca a ordem com o vizinho persistindo o sort_order de ambos.
  async function move(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= items.length) return;
    const a = items[idx], b = items[j];
    setError(null);
    try {
      await api.put(`/campaigns/${campaignId}/board/${a.id}`, {
        title: a.title, body: a.body, imageUrl: a.imageUrl, sortOrder: b.sortOrder,
      });
      await api.put(`/campaigns/${campaignId}/board/${b.id}`, {
        title: b.title, body: b.body, imageUrl: b.imageUrl, sortOrder: a.sortOrder,
      });
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "erro ao reordenar"); }
  }

  return (
    <div data-testid="campaign-board">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <span className="muted" style={{ fontSize: 14 }}>
          {isMaster ? "Publique cards com lore, ganchos, mapas e imagens para a mesa." : "Mural da crônica — publicado pelo mestre."}
        </span>
        {isMaster && !creating && (
          <button data-testid="board-new" onClick={() => setCreating(true)}>+ Novo card</button>
        )}
      </div>

      {isMaster && creating && (
        <form className="panel" onSubmit={add} data-testid="board-form" style={{ margin: "0 0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          <input data-testid="board-title" value={draft.title} placeholder="Título (opcional)"
            onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <textarea data-testid="board-body" value={draft.body} placeholder="Texto / descrição (opcional)" rows={4}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })} style={{ resize: "vertical" }} />
          <input data-testid="board-image" value={draft.imageUrl} placeholder="URL de imagem (opcional)"
            onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} />
          {draft.imageUrl.trim() && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={draft.imageUrl} alt="" style={{ maxHeight: 160, borderRadius: 8, objectFit: "cover" }} />
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" data-testid="board-publish" disabled={empty(draft)}>Publicar</button>
            <button type="button" className="secondary" onClick={() => { setCreating(false); setDraft(EMPTY); }}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="board-grid" data-testid="board-list">
        {items.map((it, idx) => (
          <div key={it.id} className="panel board-card" data-testid="board-card" style={{ margin: 0, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {editing === it.id ? (
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                <input value={editDraft.title} placeholder="Título"
                  onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} />
                <textarea value={editDraft.body} placeholder="Texto" rows={4} style={{ resize: "vertical" }}
                  onChange={(e) => setEditDraft({ ...editDraft, body: e.target.value })} />
                <input value={editDraft.imageUrl} placeholder="URL de imagem"
                  onChange={(e) => setEditDraft({ ...editDraft, imageUrl: e.target.value })} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => saveEdit(it)} disabled={empty(editDraft)}>Salvar</button>
                  <button className="secondary" onClick={() => setEditing(null)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                {it.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt={it.title ?? ""} style={{ width: "100%", maxHeight: 220, objectFit: "cover" }} />
                )}
                <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  {it.title && <h3 style={{ margin: 0, fontFamily: "var(--serif)", fontSize: 17 }}>{it.title}</h3>}
                  {it.body && <p className="muted" style={{ margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{it.body}</p>}
                  {isMaster && (
                    <div style={{ display: "flex", gap: 6, marginTop: "auto", paddingTop: 8, borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
                      <button className="ghost" title="Subir" onClick={() => move(idx, -1)} disabled={idx === 0} style={{ padding: "2px 8px" }}>↑</button>
                      <button className="ghost" title="Descer" onClick={() => move(idx, 1)} disabled={idx === items.length - 1} style={{ padding: "2px 8px" }}>↓</button>
                      <button className="ghost" data-testid={`board-edit-${it.id}`} onClick={() => startEdit(it)} style={{ padding: "2px 8px" }}>Editar</button>
                      <button className="ghost" data-testid={`board-delete-${it.id}`} onClick={() => remove(it)} style={{ padding: "2px 8px", color: "var(--err)" }}>Excluir</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="empty" style={{ marginTop: 12 }} data-testid="board-empty">
          {isMaster ? "Mural vazio. Crie o primeiro card." : "O mestre ainda não publicou nada no mural."}
        </p>
      )}
      {error && <p className="error" data-testid="board-error" style={{ marginTop: 14 }}>⚠ {error}</p>}
    </div>
  );
}
