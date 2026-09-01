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
  const [menuFor, setMenuFor] = useState<string | null>(null);   // menu ⋯ de uma nota
  const [fMenuFor, setFMenuFor] = useState<string | null>(null); // menu ⋯ de uma pasta
  const [dragId, setDragId] = useState<string | null>(null);     // nota sendo arrastada
  const [dropOn, setDropOn] = useState<string | null>(null);     // alvo sob o cursor

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

  // Arrastar-e-soltar (mouse): a nota sob `dragId` cai na pasta `folderId` (null = raiz).
  function dropNote(folderId: string | null) {
    const n = notes.find((x) => x.id === dragId);
    setDragId(null); setDropOn(null);
    if (n && n.canEdit && (n.folderId ?? null) !== folderId) void moveNote(n, folderId);
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
        <button className={`crumb${current === null ? " on" : ""}${dropOn === "root" ? " drop-target" : ""}`}
          onClick={() => setCurrent(null)}
          onDragOver={(e) => { if (dragId) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDropOn("root"); } }}
          onDragLeave={() => setDropOn((d) => (d === "root" ? null : d))}
          onDrop={(e) => { e.preventDefault(); dropNote(null); }}>📓 Anotações</button>
        {crumbs.map((f) => (
          <span key={f.id} className="crumb-group">
            <span className="crumb-sep">›</span>
            <button className={`crumb${current === f.id ? " on" : ""}${dropOn === f.id ? " drop-target" : ""}`}
              onClick={() => setCurrent(f.id)}
              onDragOver={(e) => { if (dragId) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDropOn(f.id); } }}
              onDragLeave={() => setDropOn((d) => (d === f.id ? null : d))}
              onDrop={(e) => { e.preventDefault(); dropNote(f.id); }}>{f.name}</button>
          </span>
        ))}
        {current !== null && (
          <button className="crumb crumb-up" title="Subir um nível" data-testid="folder-up"
            onClick={() => setCurrent(crumbs.length >= 2 ? crumbs[crumbs.length - 2].id : null)}>↑ Subir</button>
        )}
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

      <div className="board-grid" data-testid="notes-list">
        {/* Pastas primeiro, como tiles do mesmo tamanho dos cards */}
        {subfolders.map((f) => {
          const inNotes = notes.filter((n) => n.folderId === f.id && (!authorFilter || n.authorId === authorFilter)).length;
          const subs = folders.filter((x) => x.parentId === f.id).length;
          const meta = inNotes === 0 && subs === 0 ? "vazia"
            : [inNotes > 0 ? `${inNotes} anotaç${inNotes > 1 ? "ões" : "ão"}` : "", subs > 0 ? `${subs} pasta${subs > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ");
          return (
            <div key={f.id} className={`board-folder${dropOn === f.id ? " drop-target" : ""}`} data-testid={`folder-open-${f.id}`} role="button" tabIndex={0}
              onClick={() => setCurrent(f.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCurrent(f.id); } }}
              onDragOver={(e) => { if (dragId) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDropOn(f.id); } }}
              onDragLeave={() => setDropOn((d) => (d === f.id ? null : d))}
              onDrop={(e) => { e.preventDefault(); dropNote(f.id); }}>
              <span className="board-folder-ico">📁</span>
              <div className="board-folder-info">
                <h3 className="board-folder-name">{f.name}</h3>
                <span className="board-folder-meta">{meta}</span>
              </div>
              <span className="board-folder-go">›</span>
              {isMaster && (
                <div className="board-menu-wrap" onClick={(e) => e.stopPropagation()}>
                  <button className="board-menu-btn" aria-label="Opções da pasta" data-testid={`folder-menu-${f.id}`}
                    onClick={(e) => { e.stopPropagation(); setFMenuFor(fMenuFor === f.id ? null : f.id); setMenuFor(null); }}>⋯</button>
                  {fMenuFor === f.id && (
                    <div className="card-menu">
                      <button className="ghost" data-testid={`folder-rename-${f.id}`} style={{ width: "100%", justifyContent: "flex-start" }}
                        onClick={() => { setFMenuFor(null); renameFolder(f); }}>✎ Renomear</button>
                      <button className="ghost" data-testid={`folder-delete-${f.id}`} style={{ width: "100%", justifyContent: "flex-start", color: "var(--err)" }}
                        onClick={() => { setFMenuFor(null); removeFolder(f); }}>✕ Excluir pasta</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Anotações da pasta atual */}
        {shown.map((n) => (
          <div key={n.id} className={`note-card${dragId === n.id ? " dragging" : ""}`} data-testid="note-card"
            draggable={n.canEdit && editing !== n.id}
            onDragStart={(e) => { setDragId(n.id); setMenuFor(null); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", n.id); }}
            onDragEnd={() => { setDragId(null); setDropOn(null); }}>
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
                  <div className="board-menu-wrap" onClick={(e) => e.stopPropagation()}>
                    <button className="board-menu-btn" aria-label="Opções da anotação" data-testid={`note-menu-${n.id}`}
                      onClick={() => { setMenuFor(menuFor === n.id ? null : n.id); setFMenuFor(null); }}>⋯</button>
                    {menuFor === n.id && (
                      <div className="card-menu">
                        <button className="ghost" data-testid={`note-edit-${n.id}`} style={{ width: "100%", justifyContent: "flex-start" }}
                          onClick={() => { setMenuFor(null); startEdit(n); }}>✎ Editar</button>
                        <div className="card-menu-sep" />
                        <div className="card-menu-label">Mover para</div>
                        <button className="ghost" style={{ width: "100%", justifyContent: "flex-start" }} disabled={!n.folderId}
                          onClick={() => { setMenuFor(null); moveNote(n, null); }}>📂 Anotações (raiz)</button>
                        {folders.filter((f) => f.id !== n.folderId).map((f) => (
                          <button key={f.id} className="ghost" data-testid={`note-move-${n.id}-${f.id}`} style={{ width: "100%", justifyContent: "flex-start" }}
                            onClick={() => { setMenuFor(null); moveNote(n, f.id); }}>📁 {folderLabel(f)}</button>
                        ))}
                        <div className="card-menu-sep" />
                        <button className="ghost" data-testid={`note-delete-${n.id}`} style={{ width: "100%", justifyContent: "flex-start", color: "var(--err)" }}
                          onClick={() => { setMenuFor(null); remove(n); }}>✕ Excluir</button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {(menuFor || fMenuFor) && <div className="menu-backdrop" onClick={() => { setMenuFor(null); setFMenuFor(null); }} />}

      {subfolders.length === 0 && shown.length === 0 && (
        <p className="empty" style={{ marginTop: 12 }} data-testid="notes-empty">
          {current === null ? "Nada por aqui ainda. Crie uma anotação" + (isMaster ? " ou uma pasta." : ".") : "Pasta vazia."}
        </p>
      )}
      {error && <p className="error" data-testid="notes-error" style={{ marginTop: 14 }}>⚠ {error}</p>}
    </div>
  );
}
