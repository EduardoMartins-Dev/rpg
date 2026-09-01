"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, uploadFile, type BoardItem, type Folder } from "@/lib/api";
import { compressImage } from "@/lib/image";
import { AuthImage } from "@/components/AuthImage";

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
          {isMaster ? "Organize em pastas: lore, mapas, locais, documentos da sessão…" : "Mural da crônica — organizado pelo mestre."}
        </span>
        {isMaster && (
          <div style={{ display: "flex", gap: 8 }}>
            {!addingFolder && <button className="secondary" data-testid="folder-new" onClick={() => setAddingFolder(true)}>+ Nova pasta</button>}
            {!creating && <button data-testid="board-new" onClick={() => setCreating(true)}>+ Novo card</button>}
          </div>
        )}
      </div>

      {/* Trilha de navegação (raiz → … → pasta atual) + subir um nível */}
      <div className="folder-crumbs" data-testid="folder-crumbs">
        <button className={`crumb${current === null ? " on" : ""}`} onClick={() => setCurrent(null)}>📋 Mural</button>
        {crumbs.map((f) => (
          <span key={f.id} className="crumb-group">
            <span className="crumb-sep">›</span>
            <button className={`crumb${current === f.id ? " on" : ""}`} onClick={() => setCurrent(f.id)}>{f.name}</button>
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

      {/* Subpastas da pasta atual */}
      {subfolders.length > 0 && (
        <>
          <div className="folder-section-label">Pastas <span className="muted">· {subfolders.length}</span></div>
          <div className="folder-tiles" data-testid="folder-tiles">
            {subfolders.map((f) => {
              const cards = items.filter((i) => i.folderId === f.id).length;
              const subs = folders.filter((x) => x.parentId === f.id).length;
              return (
                <div key={f.id} className="folder-tile" data-testid="folder-tile">
                  <button className="folder-tile-open" onClick={() => setCurrent(f.id)} data-testid={`folder-open-${f.id}`}>
                    <span className="folder-ico">📁</span>
                    <span className="folder-tile-body">
                      <span className="folder-tile-name">{f.name}</span>
                      <span className="folder-tile-count">
                        {cards > 0 && `${cards} card${cards > 1 ? "s" : ""}`}
                        {cards > 0 && subs > 0 && " · "}
                        {subs > 0 && `${subs} pasta${subs > 1 ? "s" : ""}`}
                        {cards === 0 && subs === 0 && "vazia"}
                      </span>
                    </span>
                    <span className="folder-tile-go">›</span>
                  </button>
                  {isMaster && (
                    <div className="folder-tile-actions">
                      <button className="ghost" title="Renomear" data-testid={`folder-rename-${f.id}`} onClick={() => renameFolder(f)}>✎</button>
                      <button className="ghost" title="Excluir pasta" data-testid={`folder-delete-${f.id}`} onClick={() => removeFolder(f)} style={{ color: "var(--err)" }}>✕</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {folderItems.length > 0 && subfolders.length > 0 && (
        <div className="folder-section-label">Cards <span className="muted">· {folderItems.length}</span></div>
      )}
      <div className="board-grid" data-testid="board-list">
        {folderItems.map((it, idx) => (
          <div key={it.id} className="panel board-card" data-testid="board-card">
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
                  </button>
                )}
                <div className="board-card-body">
                  {it.title && <h3>{it.title}</h3>}
                  {it.body && <p className="muted" style={{ margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{it.body}</p>}
                  {isMaster && (
                    <div className="board-card-actions">
                      <button className="ghost" title="Subir" aria-label="Subir card" onClick={() => reorder(idx, -1)} disabled={idx === 0}>↑</button>
                      <button className="ghost" title="Descer" aria-label="Descer card" onClick={() => reorder(idx, 1)} disabled={idx === folderItems.length - 1}>↓</button>
                      <button className="ghost" data-testid={`board-edit-${it.id}`} onClick={() => startEdit(it)}>Editar</button>
                      <button className="ghost" data-testid={`board-delete-${it.id}`} onClick={() => remove(it)} style={{ color: "var(--err)" }}>Excluir</button>
                      <select className="board-move" data-testid={`board-move-${it.id}`} title="Mover para pasta"
                        value={it.folderId ?? ""} onChange={(e) => moveItem(it, e.target.value || null)}>
                        <option value="">📂 Mural (raiz)</option>
                        {folders.map((f) => <option key={f.id} value={f.id}>📁 {folderLabel(f)}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

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

type View = { s: number; x: number; y: number };
const MIN_S = 1, MAX_S = 6;
const clampS = (s: number) => Math.min(MAX_S, Math.max(MIN_S, s));

/**
 * Imagem do mural em tela cheia COM zoom e arrasto — feito para mapas e documentos.
 *  · roda do mouse = zoom no ponto do cursor; botões −/⟲/+ ; duplo-clique alterna 1×↔2,5×
 *  · no celular: pinça com dois dedos para dar zoom, um dedo para arrastar
 *  · fecha no ✕, Esc ou clicando no fundo escuro (fora da imagem)
 * Reaproveita a MESMA blob URL do card (AuthImage memoiza por caminho), então abrir não
 * rebaixa a imagem. touchAction:none entrega o gesto de toque para os nossos handlers.
 */
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [v, setV] = useState<View>({ s: 1, x: 0, y: 0 });
  const vRef = useRef(v); vRef.current = v;
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const pts = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinch = useRef<{ dist: number; s: number; cx: number; cy: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "+" || e.key === "=") zoomAt(1.25, 0, 0);
      else if (e.key === "-" || e.key === "_") zoomAt(1 / 1.25, 0, 0);
      else if (e.key === "0") setV({ s: 1, x: 0, y: 0 });
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  // Aplica zoom por `k` mantendo fixo o ponto (px,py) relativo ao CENTRO do palco.
  function zoomAt(k: number, px: number, py: number) {
    setV((c) => {
      const ns = clampS(c.s * k);
      const kk = ns / c.s;
      if (ns <= 1) return { s: 1, x: 0, y: 0 };
      return { s: ns, x: px - (px - c.x) * kk, y: py - (py - c.y) * kk };
    });
  }
  function rel(clientX: number, clientY: number) {
    const r = stageRef.current!.getBoundingClientRect();
    return { px: clientX - (r.left + r.width / 2), py: clientY - (r.top + r.height / 2) };
  }
  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const { px, py } = rel(e.clientX, e.clientY);
    zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, px, py);
  }
  function onPointerDown(e: React.PointerEvent) {
    stageRef.current?.setPointerCapture(e.pointerId);
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.current.size === 2) {
      const [a, b] = [...pts.current.values()];
      const mid = rel((a.x + b.x) / 2, (a.y + b.y) / 2);
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), s: vRef.current.s, cx: mid.px, cy: mid.py };
      drag.current = null;
    } else if (pts.current.size === 1) {
      drag.current = { px: e.clientX, py: e.clientY, ox: vRef.current.x, oy: vRef.current.y };
    }
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pts.current.size >= 2) {
      const [a, b] = [...pts.current.values()];
      const nd = Math.hypot(a.x - b.x, a.y - b.y);
      const k = nd / pinch.current.dist;
      const ns = clampS(pinch.current.s * k);
      const kk = ns / pinch.current.s;
      const { cx, cy } = pinch.current;
      setV(ns <= 1 ? { s: 1, x: 0, y: 0 } : { s: ns, x: cx - (cx - 0) * kk, y: cy - (cy - 0) * kk });
    } else if (drag.current && pts.current.size === 1) {
      setV((c) => ({ ...c, x: drag.current!.ox + (e.clientX - drag.current!.px), y: drag.current!.oy + (e.clientY - drag.current!.py) }));
    }
  }
  function onPointerUp(e: React.PointerEvent) {
    pts.current.delete(e.pointerId);
    if (pts.current.size < 2) pinch.current = null;
    if (pts.current.size === 0) drag.current = null;
  }

  const zoomed = v.s > 1;
  return (
    <div className="lightbox-overlay" role="dialog" aria-modal="true" aria-label={alt}
      data-testid="board-lightbox" onClick={onClose}>
      <button type="button" className="lightbox-close" aria-label="Fechar" onClick={onClose}>✕</button>
      <div className="lightbox-toolbar" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="secondary" aria-label="Menos zoom" onClick={() => zoomAt(1 / 1.25, 0, 0)}>−</button>
        <span className="lightbox-zoom mono">{Math.round(v.s * 100)}%</span>
        <button type="button" className="secondary" aria-label="Mais zoom" onClick={() => zoomAt(1.25, 0, 0)}>+</button>
        <button type="button" className="secondary" aria-label="Redefinir zoom" title="Redefinir" onClick={() => setV({ s: 1, x: 0, y: 0 })}>⟲</button>
      </div>
      <div
        ref={stageRef}
        className="lightbox-stage"
        style={{ cursor: zoomed ? "grab" : "zoom-in", touchAction: "none" }}
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          if (zoomed) { setV({ s: 1, x: 0, y: 0 }); return; }
          const { px, py } = rel(e.clientX, e.clientY);
          zoomAt(2.5, px, py);
        }}
      >
        <div style={{ transform: `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.s})`, transition: drag.current || pinch.current ? "none" : "transform .12s ease-out", willChange: "transform" }}>
          <AuthImage src={src} alt={alt} className="lightbox-img" />
        </div>
      </div>
    </div>
  );
}

/**
 * Escolha da imagem do card: envia do dispositivo (galeria/câmera no celular) ou cola
 * uma URL. O arquivo é comprimido no navegador antes de subir — foto de celular vem
 * com vários MB e não passaria no limite de corpo da plataforma.
 */
function ImageField({
  campaignId, value, onChange, onError, testid,
}: {
  campaignId: string;
  value: string;
  onChange: (url: string) => void;
  onError: (msg: string | null) => void;
  testid: string;
}) {
  const [busy, setBusy] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permite reenviar o mesmo arquivo depois
    if (!file) return;
    onError(null);
    setBusy(true);
    try {
      const compressed = await compressImage(file);
      const saved = await uploadFile<{ id: string; url: string }>(
        `/campaigns/${campaignId}/media`, compressed);
      onChange(saved.url);
    } catch (err) {
      onError(err instanceof Error ? err.message : "erro ao enviar a imagem");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="img-field">
      <div className="img-field-actions">
        <input ref={fileRef} type="file" accept="image/*" onChange={pick}
          data-testid={`${testid}-file`} style={{ display: "none" }} />
        <button type="button" className="secondary" disabled={busy}
          onClick={() => fileRef.current?.click()} data-testid={`${testid}-pick`}>
          {busy ? <><span className="spinner" /> Enviando…</> : "📷 Enviar imagem"}
        </button>
        {!showUrl && !value && (
          <button type="button" className="ghost" onClick={() => setShowUrl(true)}>ou colar URL</button>
        )}
        {value && (
          <button type="button" className="ghost" onClick={() => { onChange(""); setShowUrl(false); }}
            data-testid={`${testid}-clear`} style={{ color: "var(--err)" }}>Remover</button>
        )}
      </div>

      {(showUrl || (value && !value.startsWith("/api/"))) && (
        <input data-testid={testid} value={value} placeholder="URL de imagem"
          onChange={(e) => onChange(e.target.value)} />
      )}

      {value.trim() && (
        <AuthImage src={value} alt="prévia" className="img-field-preview" />
      )}
    </div>
  );
}
