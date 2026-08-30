"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, uploadFile, type BoardItem } from "@/lib/api";
import { compressImage } from "@/lib/image";
import { AuthImage } from "@/components/AuthImage";

type Draft = { title: string; body: string; imageUrl: string };
const EMPTY: Draft = { title: "", body: "", imageUrl: "" };

/**
 * Mural da campanha. Qualquer membro lê; só o mestre cria/edita/exclui cards.
 * Card = título/texto/imagem opcionais. A imagem pode vir do dispositivo (upload,
 * comprimido no navegador) ou de uma URL colada. Ordenável (subir/descer).
 */
export function CampaignBoard({ campaignId, isMaster }: { campaignId: string; isMaster: boolean }) {
  const [items, setItems] = useState<BoardItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [editing, setEditing] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY);
  // Imagem aberta em tela cheia (lightbox). Qualquer membro pode ampliar para usar na mesa.
  const [zoom, setZoom] = useState<{ src: string; alt: string } | null>(null);

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
      <div className="board-head">
        <span className="muted" style={{ fontSize: 14 }}>
          {isMaster ? "Publique cards com lore, ganchos, mapas e imagens para a mesa." : "Mural da crônica — publicado pelo mestre."}
        </span>
        {isMaster && !creating && (
          <button data-testid="board-new" onClick={() => setCreating(true)}>+ Novo card</button>
        )}
      </div>

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
            <button type="submit" data-testid="board-publish" disabled={empty(draft)}>Publicar</button>
            <button type="button" className="secondary" onClick={() => { setCreating(false); setDraft(EMPTY); }}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="board-grid" data-testid="board-list">
        {items.map((it, idx) => (
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
                      <button className="ghost" title="Subir" aria-label="Subir card" onClick={() => move(idx, -1)} disabled={idx === 0}>↑</button>
                      <button className="ghost" title="Descer" aria-label="Descer card" onClick={() => move(idx, 1)} disabled={idx === items.length - 1}>↓</button>
                      <button className="ghost" data-testid={`board-edit-${it.id}`} onClick={() => startEdit(it)}>Editar</button>
                      <button className="ghost" data-testid={`board-delete-${it.id}`} onClick={() => remove(it)} style={{ color: "var(--err)" }}>Excluir</button>
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

      {zoom && <Lightbox src={zoom.src} alt={zoom.alt} onClose={() => setZoom(null)} />}
    </div>
  );
}

/**
 * Imagem do mural em tela cheia. Fecha no ✕, na tecla Esc ou clicando no fundo escuro;
 * clicar na própria imagem NÃO fecha, para o jogador poder olhar/dar zoom (pinça no
 * celular) sem sumir com ela. Reaproveita a MESMA blob URL do card (AuthImage memoiza
 * por caminho), então abrir não rebaixa a imagem.
 */
function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // trava o scroll do fundo enquanto aberto
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prevOverflow; };
  }, [onClose]);

  return (
    <div className="lightbox-overlay" role="dialog" aria-modal="true" aria-label={alt}
      data-testid="board-lightbox" onClick={onClose}>
      <button type="button" className="lightbox-close" aria-label="Fechar" onClick={onClose}>✕</button>
      <div className="lightbox-stage" onClick={(e) => e.stopPropagation()}>
        <AuthImage src={src} alt={alt} className="lightbox-img" />
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
