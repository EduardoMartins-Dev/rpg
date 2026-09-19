"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type BoardItem, type Folder } from "@/lib/api";
import { AuthImage } from "@/components/AuthImage";
import { ImageField } from "@/components/ImageField";
import { Lightbox } from "@/components/Lightbox";

type Draft = { title: string; body: string; imageUrl: string };
const EMPTY: Draft = { title: "", body: "", imageUrl: "" };

/** Caminho da raiz até a pasta `id` (para a trilha de navegação). */
function pathTo(folders: Folder[], id: string | null): Folder[] {
  const byId = new Map(folders.map((f) => [f.id, f]));
  const out: Folder[] = [];
  let cur = id ? byId.get(id) : undefined;
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    out.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return out;
}

/**
 * Mural da campanha, organizado em PASTAS aninhadas (só o mestre cria/organiza; qualquer
 * membro navega e lê). Cada card vive numa pasta (ou na raiz). Navega-se como um explorador
 * de arquivos: trilha no topo, subpastas como blocos, cards da pasta atual abaixo.
 */
export function CampaignBoard({ campaignId, isMaster }: { campaignId: string; isMaster: boolean }) {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [current, setCurrent] = useState<string | null>(null); // pasta atual (null = raiz)
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY);
  const [addingFolder, setAddingFolder] = useState(false);
  const [folderName, setFolderName] = useState("");
  // Imagem aberta em tela cheia (lightbox). Qualquer membro pode ampliar para usar na mesa.
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);   // menu ⋯ de um card
  const [fMenuFor, setFMenuFor] = useState<string | null>(null); // menu ⋯ de uma pasta
  const [dragId, setDragId] = useState<string | null>(null);     // card sendo arrastado (mouse)
  const [dropOn, setDropOn] = useState<string | null>(null);     // alvo sob o cursor: id da pasta ou "root"

  const load = useCallback(async () => {
    setError(null);
    try {
      const [its, fs] = await Promise.all([
        api.get<BoardItem[]>(`/campaigns/${campaignId}/board`),
        api.get<Folder[]>(`/campaigns/${campaignId}/folders?kind=board`),
      ]);
      setItems(its);
      setFolders(fs);
    } catch (err) { setError(err instanceof Error ? err.message : "erro ao carregar o mural"); }
  }, [campaignId]);

  useEffect(() => { load(); }, [load]);

  const empty = (d: Draft) => !d.title.trim() && !d.body.trim() && !d.imageUrl.trim();

  const subfolders = folders.filter((f) => (f.parentId ?? null) === current);
  const folderItems = items.filter((it) => (it.folderId ?? null) === current);
  const crumbs = pathTo(folders, current);
  const folderLabel = (f: Folder) => pathTo(folders, f.id).map((x) => x.name).join(" / ");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (empty(draft)) return;
    setError(null);
    try {
      await api.post(`/campaigns/${campaignId}/board`, { ...draft, folderId: current });
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

  async function moveItem(it: BoardItem, folderId: string | null) {
    setError(null);
    try {
      await api.put(`/campaigns/${campaignId}/board/${it.id}`, {
        title: it.title, body: it.body, imageUrl: it.imageUrl, sortOrder: it.sortOrder, folderId,
      });
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "erro ao mover card"); }
  }

  // Arrastar-e-soltar (mouse): o card sob `dragId` cai na pasta `folderId` (null = raiz).
  function dropCard(folderId: string | null) {
    const it = items.find((x) => x.id === dragId);
    setDragId(null); setDropOn(null);
    if (it && (it.folderId ?? null) !== folderId) void moveItem(it, folderId);
  }

  // Troca a ordem com o vizinho DENTRO da pasta atual (sem tocar na pasta).
  async function reorder(idx: number, dir: -1 | 1) {
    const j = idx + dir;
    if (j < 0 || j >= folderItems.length) return;
    const a = folderItems[idx], b = folderItems[j];
    setError(null);
    try {
      await api.put(`/campaigns/${campaignId}/board/${a.id}`, { title: a.title, body: a.body, imageUrl: a.imageUrl, sortOrder: b.sortOrder });
      await api.put(`/campaigns/${campaignId}/board/${b.id}`, { title: b.title, body: b.body, imageUrl: b.imageUrl, sortOrder: a.sortOrder });
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "erro ao reordenar"); }
  }

  async function createFolder(e: React.FormEvent) {
    e.preventDefault();
    if (!folderName.trim()) return;
    setError(null);
    try {
      await api.post(`/campaigns/${campaignId}/folders`, { kind: "board", name: folderName.trim(), parentId: current });
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
    if (!confirm(`Excluir a pasta "${f.name}"? As subpastas somem e os itens dentro voltam para "sem pasta".`)) return;
    setError(null);
    try {
      await api.del(`/campaigns/${campaignId}/folders/${f.id}`);
      // se a pasta atual estava dentro da excluída, sobe para a pasta-mãe dela
      if (current === f.id || crumbs.some((c) => c.id === f.id)) setCurrent(f.parentId ?? null);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "erro ao excluir pasta"); }
  }

  return (
    <div data-testid="campaign-board">
      <div className="board-head">
        <span className="muted" style={{ fontSize: 14 }}>
          {isMaster ? "Organize em pastas — arraste um card para dentro de uma pasta, ou use o menu ⋯." : "Mural da crônica — organizado pelo mestre."}
        </span>
        {isMaster && (
          <div style={{ display: "flex", gap: 8 }}>
            {!addingFolder && <button className="secondary" data-testid="folder-new" onClick={() => setAddingFolder(true)}>+ Nova pasta</button>}
            {!creating && <button data-testid="board-new" onClick={() => setCreating(true)}>+ Novo card</button>}
          </div>
        )}
      </div>

      {/* Trilha de navegação (raiz → … → pasta atual) + subir um nível.
          Também aceita SOLTAR um card arrastado para mover para a raiz / pasta-mãe. */}
      <div className="folder-crumbs" data-testid="folder-crumbs">
        <button className={`crumb${current === null ? " on" : ""}${dropOn === "root" ? " drop-target" : ""}`}
          onClick={() => setCurrent(null)}
          onDragOver={(e) => { if (dragId) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDropOn("root"); } }}
          onDragLeave={() => setDropOn((d) => (d === "root" ? null : d))}
          onDrop={(e) => { e.preventDefault(); dropCard(null); }}>📋 Mural</button>
        {crumbs.map((f) => (
          <span key={f.id} className="crumb-group">
            <span className="crumb-sep">›</span>
            <button className={`crumb${current === f.id ? " on" : ""}${dropOn === f.id ? " drop-target" : ""}`}
              onClick={() => setCurrent(f.id)}
              onDragOver={(e) => { if (dragId) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDropOn(f.id); } }}
              onDragLeave={() => setDropOn((d) => (d === f.id ? null : d))}
              onDrop={(e) => { e.preventDefault(); dropCard(f.id); }}>{f.name}</button>
          </span>
        ))}
        {current !== null && (
          <button className="crumb crumb-up" title="Subir um nível" data-testid="folder-up"
            onClick={() => setCurrent(crumbs.length >= 2 ? crumbs[crumbs.length - 2].id : null)}>↑ Subir</button>
        )}
      </div>

      {isMaster && addingFolder && (
        <form className="panel board-form" onSubmit={createFolder} data-testid="folder-form" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input data-testid="folder-name" value={folderName} placeholder={`Nome da pasta em "${crumbs.length ? crumbs[crumbs.length - 1].name : "Mural"}"`}
            onChange={(e) => setFolderName(e.target.value)} autoFocus style={{ flex: 1 }} />
          <button type="submit" data-testid="folder-create" disabled={!folderName.trim()}>Criar pasta</button>
          <button type="button" className="secondary" onClick={() => { setAddingFolder(false); setFolderName(""); }}>Cancelar</button>
        </form>
      )}

      {isMaster && creating && (
        <form className="panel board-form" onSubmit={add} data-testid="board-form">
          <input data-testid="board-title" value={draft.title} placeholder="Título (opcional)"
            onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <textarea data-testid="board-body" value={draft.body} placeholder="Texto / descrição (opcional)" rows={4}
            onChange={(e) => setDraft({ ...draft, body: e.target.value })} style={{ resize: "vertical" }} />
          <ImageField
            campaignId={campaignId}
            value={draft.imageUrl}
            onChange={(url) => setDraft({ ...draft, imageUrl: url })}
            onError={setError}
            testid="board-image"
          />
          <div className="board-form-actions">
            <button type="submit" data-testid="board-publish" disabled={empty(draft)}>Publicar em “{crumbs.length ? crumbs[crumbs.length - 1].name : "Mural"}”</button>
            <button type="button" className="secondary" onClick={() => { setCreating(false); setDraft(EMPTY); }}>Cancelar</button>
          </div>
        </form>
      )}

      {/* Grade única: pastas (como blocos) e cards juntos — mesma linguagem visual. */}
      <div className="board-grid" data-testid="board-list">
        {/* Pastas primeiro, como tiles do mesmo tamanho dos cards */}
        {subfolders.map((f) => {
          const cards = items.filter((i) => i.folderId === f.id).length;
          const subs = folders.filter((x) => x.parentId === f.id).length;
          const meta = cards === 0 && subs === 0 ? "vazia"
            : [cards > 0 ? `${cards} card${cards > 1 ? "s" : ""}` : "", subs > 0 ? `${subs} pasta${subs > 1 ? "s" : ""}` : ""].filter(Boolean).join(" · ");
          return (
            <div key={f.id} className={`board-folder${dropOn === f.id ? " drop-target" : ""}`} data-testid={`folder-open-${f.id}`} role="button" tabIndex={0}
              onClick={() => setCurrent(f.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setCurrent(f.id); } }}
              onDragOver={(e) => { if (dragId) { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDropOn(f.id); } }}
              onDragLeave={() => setDropOn((d) => (d === f.id ? null : d))}
              onDrop={(e) => { e.preventDefault(); dropCard(f.id); }}>
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

        {/* Cards da pasta atual */}
        {folderItems.map((it, idx) => (
          <div key={it.id} className={`panel board-card${dragId === it.id ? " dragging" : ""}`} data-testid="board-card"
            draggable={isMaster && editing !== it.id}
            onDragStart={(e) => { setDragId(it.id); setMenuFor(null); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", it.id); }}
            onDragEnd={() => { setDragId(null); setDropOn(null); }}>
            {editing === it.id ? (
              <div className="board-card-edit">
                <input value={editDraft.title} placeholder="Título"
                  onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} />
                <textarea value={editDraft.body} placeholder="Texto" rows={4} style={{ resize: "vertical" }}
                  onChange={(e) => setEditDraft({ ...editDraft, body: e.target.value })} />
                <ImageField
                  campaignId={campaignId}
                  value={editDraft.imageUrl}
                  onChange={(url) => setEditDraft({ ...editDraft, imageUrl: url })}
                  onError={setError}
                  testid={`board-image-edit-${it.id}`}
                />
                <div className="board-form-actions">
                  <button onClick={() => saveEdit(it)} disabled={empty(editDraft)}>Salvar</button>
                  <button className="secondary" onClick={() => setEditing(null)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                {it.imageUrl && (
                  <button type="button" className="board-card-imgbtn"
                    title="Clique para ampliar" aria-label={`Ampliar imagem${it.title ? `: ${it.title}` : ""}`}
                    data-testid={`board-zoom-${it.id}`}
                    onClick={() => setZoom({ src: it.imageUrl!, alt: it.title ?? "Imagem do mural" })}>
                    <AuthImage src={it.imageUrl} alt={it.title ?? ""} className="board-card-img" />
                    <span className="board-card-zoomhint" aria-hidden>🔍</span>
                  </button>
                )}
                {(it.title || it.body) && (
                  <div className="board-card-body">
                    {it.title && <h3>{it.title}</h3>}
                    {it.body && <p className="muted" style={{ margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{it.body}</p>}
                  </div>
                )}
                {isMaster && (
                  <div className="board-menu-wrap" onClick={(e) => e.stopPropagation()}>
                    <button className="board-menu-btn" aria-label="Opções do card" data-testid={`board-menu-${it.id}`}
                      onClick={() => { setMenuFor(menuFor === it.id ? null : it.id); setFMenuFor(null); }}>⋯</button>
                    {menuFor === it.id && (
                      <div className="card-menu">
                        <button className="ghost" data-testid={`board-edit-${it.id}`} style={{ width: "100%", justifyContent: "flex-start" }}
                          onClick={() => { setMenuFor(null); startEdit(it); }}>✎ Editar</button>
                        <button className="ghost" style={{ width: "100%", justifyContent: "flex-start" }} disabled={idx === 0}
                          onClick={() => { setMenuFor(null); reorder(idx, -1); }}>↑ Subir</button>
                        <button className="ghost" style={{ width: "100%", justifyContent: "flex-start" }} disabled={idx === folderItems.length - 1}
                          onClick={() => { setMenuFor(null); reorder(idx, 1); }}>↓ Descer</button>
                        <div className="card-menu-sep" />
                        <div className="card-menu-label">Mover para</div>
                        <button className="ghost" style={{ width: "100%", justifyContent: "flex-start" }} disabled={!it.folderId}
                          onClick={() => { setMenuFor(null); moveItem(it, null); }}>📂 Raiz</button>
                        {folders.filter((f) => f.id !== it.folderId).map((f) => (
                          <button key={f.id} className="ghost" data-testid={`board-move-${it.id}-${f.id}`} style={{ width: "100%", justifyContent: "flex-start" }}
                            onClick={() => { setMenuFor(null); moveItem(it, f.id); }}>📁 {folderLabel(f)}</button>
                        ))}
                        <div className="card-menu-sep" />
                        <button className="ghost" data-testid={`board-delete-${it.id}`} style={{ width: "100%", justifyContent: "flex-start", color: "var(--err)" }}
                          onClick={() => { setMenuFor(null); remove(it); }}>✕ Excluir</button>
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

      {subfolders.length === 0 && folderItems.length === 0 && (
        <p className="empty" style={{ marginTop: 12 }} data-testid="board-empty">
          {isMaster
            ? (current === null ? "Mural vazio. Crie uma pasta ou um card." : "Pasta vazia. Adicione um card ou uma subpasta.")
            : "Nada por aqui ainda."}
        </p>
      )}
      {error && <p className="error" data-testid="board-error" style={{ marginTop: 14 }}>⚠ {error}</p>}

      {zoom && <Lightbox src={zoom.src} alt={zoom.alt} onClose={() => setZoom(null)} />}
    </div>
  );
}
