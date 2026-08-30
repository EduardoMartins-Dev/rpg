"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, type CampaignNote, type Folder } from "@/lib/api";

type Draft = { title: string; body: string };
const EMPTY: Draft = { title: "", body: "" };

/** Caminho da raiz até a pasta `id` (para a trilha). */
function pathTo(folders: Folder[], id: string | null): Folder[] {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const out: Folder[] = [];
  let cur = id ? byId.get(id) : undefined;
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) { seen.add(cur.id); out.unshift(cur); cur = cur.parentId ? byId.get(cur.parentId) : undefined; }
  return out;
}

/**
 * Anotações da campanha, organizadas em PASTAS aninhadas (o mestre cria/organiza as
 * pastas; cada autor arquiva as suas notas nelas). Jogador vê e gerencia só as suas;
 * mestre vê as de todos, com filtro por autor. Navega como um explorador de arquivos.
 */
export function CampaignNotes({ campaignId, isMaster }: { campaignId: string; isMaster: boolean }) {
  const [notes, setNotes] = useState<CampaignNote[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY);
  const [authorFilter, setAuthorFilter] = useState("");
  const [addingFolder, setAddingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const [ns, fs] = await Promise.all([
        api.get<CampaignNote[]>(`/campaigns/${campaignId}/notes`),
        api.get<Folder[]>(`/campaigns/${campaignId}/folders?kind=notes`),
      ]);
      setNotes(ns);
      setFolders(fs);
    } catch (err) { setError(err instanceof Error ? err.message : "erro ao carregar anotações"); }
  }, [campaignId]);

  useEffect(() => { load(); }, [load]);

  const authors = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of notes) m.set(n.authorId, n.authorName);
    return Array.from(m, ([id, name]) => ({ id, name }));
  }, [notes]);

  const empty = (d: Draft) => !d.title.trim() && !d.body.trim();

  const subfolders = folders.filter((f) => (f.parentId ?? null) === current);
  const crumbs = pathTo(folders, current);
  const folderLabel = (f: Folder) => pathTo(folders, f.id).map((x) => x.name).join(" / ");
  const countIn = (fid: string) =>
    notes.filter((n) => n.folderId === fid && (!authorFilter || n.authorId === authorFilter)).length
    + folders.filter((f) => f.parentId === fid).length;

  const shown = useMemo(
    () => notes.filter((n) => (n.folderId ?? null) === current && (!authorFilter || n.authorId === authorFilter)),
    [notes, current, authorFilter],
  );

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (empty(draft)) return;
    setError(null);
    try {
      await api.post(`/campaigns/${campaignId}/notes`, { ...draft, folderId: current });
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

  async function moveNote(n: CampaignNote, folderId: string | null) {
    setError(null);
    try {
      await api.put(`/campaigns/${campaignId}/notes/${n.id}`, { title: n.title, body: n.body, folderId });
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "erro ao mover anotação"); }
  }

  async function createFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!folderName.trim()) return;
    setError(null);
    try {
      await api.post(`/campaigns/${campaignId}/folders`, { kind: "notes", name: folderName.trim(), parentId: current });
      setFolderName(""); setAddingFolder(false); await load();
    } catch (err) { setError(err instanceof Error ? err.message : "erro ao criar pasta"); }
  }

  async function renameFolder(f: Folder) {
    const name = prompt("Novo nome da pasta:", f.name);
    if (name == null || !name.trim()) return;
    setError(null);
    try { await api.put(`/campaigns/${campaignId}/folders/${f.id}`, { name: name.trim() }); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : "erro ao renomear pasta"); }
  }

  async function removeFolder(f: Folder) {
    if (!confirm(`Excluir a pasta "${f.name}"? As subpastas somem e as notas dentro voltam para "sem pasta".`)) return;
    setError(null);
    try {
      await api.del(`/campaigns/${campaignId}/folders/${f.id}`);
      if (current === f.id || crumbs.some((c) => c.id === f.id)) setCurrent(f.parentId ?? null);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "erro ao excluir pasta"); }
  }

  return (
    <div data-testid="campaign-notes">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <span className="muted" style={{ fontSize: 14 }}>
          {isMaster ? "Organize em pastas; você vê as anotações de todos." : "Suas anotações da crônica — só você e o mestre veem."}
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {isMaster && authors.length > 0 && (
            <select data-testid="notes-author-filter" value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)} style={{ minWidth: 160 }}>
              <option value="">Todos os autores</option>
              {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          )}
          {isMaster && !addingFolder && <button className="secondary" data-testid="folder-new" onClick={() => setAddingFolder(true)}>+ Nova pasta</button>}
          {!creating && <button data-testid="note-new" onClick={() => setCreating(true)}>+ Nova anotação</button>}
        </div>
      </div>

      <div className="folder-crumbs" data-testid="folder-crumbs">
        <button className={`crumb${current === null ? " on" : ""}`} onClick={() => setCurrent(null)}>Anotações</button>
        {crumbs.map((f) => (
          <span key={f.id} className="crumb-group">
            <span className="crumb-sep">›</span>
            <button className={`crumb${current === f.id ? " on" : ""}`} onClick={() => setCurrent(f.id)}>{f.name}</button>
          </span>
        ))}
      </div>

      {isMaster && addingFolder && (
        <form className="panel board-form" onSubmit={createFolder} data-testid="folder-form" style={{ flexDirection: "row", alignItems: "center", gap: 8, margin: "0 0 16px" }}>
          <input data-testid="folder-name" value={folderName} placeholder={`Nome da pasta em "${crumbs.length ? crumbs[crumbs.length - 1].name : "Anotações"}"`}
            onChange={(e) => setFolderName(e.target.value)} autoFocus style={{ flex: 1 }} />
          <button type="submit" data-testid="folder-create" disabled={!folderName.trim()}>Criar pasta</button>
          <button type="button" className="secondary" onClick={() => { setAddingFolder(false); setFolderName(""); }}>Cancelar</button>
        </form>
      )}

      {creating && (
        <form className="panel" onSubmit={add} data-testid="note-form" style={{ margin: "0 0 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          <input data-testid="note-title" value={draft.title} placeholder="Título (opcional)"
            onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <textarea data-testid="note-body" value={draft.body} placeholder="Escreva sua anotação…" rows={5}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })} style={{ resize: "vertical" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" data-testid="note-save" disabled={empty(draft)}>Salvar em “{crumbs.length ? crumbs[crumbs.length - 1].name : "Anotações"}”</button>
            <button type="button" className="secondary" onClick={() => { setCreating(false); setDraft(EMPTY); }}>Cancelar</button>
          </div>
        </form>
      )}

      {subfolders.length > 0 && (
        <div className="folder-tiles" data-testid="folder-tiles">
          {subfolders.map((f) => (
            <div key={f.id} className="folder-tile" data-testid="folder-tile">
              <button className="folder-tile-open" onClick={() => setCurrent(f.id)} data-testid={`folder-open-${f.id}`}>
                <span className="folder-ico">📁</span>
                <span className="folder-tile-name">{f.name}</span>
                <span className="folder-tile-count">{countIn(f.id)} item(s)</span>
              </button>
              {isMaster && (
                <div className="folder-tile-actions">
                  <button className="ghost" title="Renomear" data-testid={`folder-rename-${f.id}`} onClick={() => renameFolder(f)}>✎</button>
                  <button className="ghost" title="Excluir pasta" data-testid={`folder-delete-${f.id}`} onClick={() => removeFolder(f)} style={{ color: "var(--err)" }}>✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="notes-grid" data-testid="notes-list">
        {shown.map((n) => (
          <div key={n.id} className="note-card" data-testid="note-card">
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
                <div className="note-card__head">
                  {n.title ? <h3 className="note-card__title">{n.title}</h3> : <span className="muted" style={{ fontSize: 13 }}>sem título</span>}
                  {isMaster && <span className="badge" data-testid="note-author">{n.authorName}</span>}
                </div>
                <p className="note-card__body">{n.body || <span className="muted">—</span>}</p>
                {n.canEdit && (
                  <div className="note-card__foot">
                    <button className="ghost" data-testid={`note-edit-${n.id}`} onClick={() => startEdit(n)}>Editar</button>
                    <button className="ghost" data-testid={`note-delete-${n.id}`} onClick={() => remove(n)} style={{ color: "var(--err)" }}>Excluir</button>
                    <select className="board-move" data-testid={`note-move-${n.id}`} title="Mover para pasta"
                      value={n.folderId ?? ""} onChange={(e) => moveNote(n, e.target.value || null)}>
                      <option value="">📂 Anotações (raiz)</option>
                      {folders.map((f) => <option key={f.id} value={f.id}>📁 {folderLabel(f)}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {subfolders.length === 0 && shown.length === 0 && (
        <p className="empty" style={{ marginTop: 12 }} data-testid="notes-empty">
          {current === null ? "Nada por aqui ainda. Crie uma anotação" + (isMaster ? " ou uma pasta." : ".") : "Pasta vazia."}
        </p>
      )}
      {error && <p className="error" data-testid="notes-error" style={{ marginTop: 14 }}>⚠ {error}</p>}
    </div>
  );
}
