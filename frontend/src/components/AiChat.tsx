"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  api, ApiError,
  type AiChatMessage, type AiConversationDetail, type AiConversationSummary,
  type SendMessageResponse,
} from "@/lib/api";

/**
 * Chat com a IA estilo ChatGPT: lista de conversas (contextos) à esquerda, histórico
 * de mensagens à direita. Cada conversa guarda seu histórico; o backend usa os turnos
 * anteriores como contexto e ancora a resposta nos trechos do sistema da campanha.
 */
export default function AiChat({ campaignId, systemName }: { campaignId: string; systemName?: string }) {
  const [convos, setConvos] = useState<AiConversationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const base = `/campaigns/${campaignId}/ai/conversations`;

  const openConvo = useCallback(async (cid: string) => {
    setError(null);
    setActiveId(cid);
    try {
      const detail = await api.get<AiConversationDetail>(`${base}/${cid}`);
      setMessages(detail.messages);
    } catch (e) { setError(msg(e)); setMessages([]); }
  }, [base]);

  const loadConvos = useCallback(async () => {
    try {
      const list = await api.get<AiConversationSummary[]>(base);
      setConvos(list);
      if (list.length) await openConvo(list[0].id);
    } catch (e) { setError(msg(e)); }
  }, [base, openConvo]);

  useEffect(() => { void loadConvos(); }, [loadConvos]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  function newConvo() {
    // conversa em rascunho: criada de fato no backend ao enviar a 1ª pergunta
    setActiveId(null);
    setMessages([]);
    setError(null);
  }

  async function deleteConvo(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Excluir esta conversa?")) return;
    try {
      await api.del(`${base}/${id}`);
      const rest = convos.filter((c) => c.id !== id);
      setConvos(rest);
      if (activeId === id) { setActiveId(null); setMessages([]); }
    } catch (err) { setError(msg(err)); }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || sending) return;
    setSending(true);
    setError(null);

    // mostra a pergunta de imediato (otimista)
    const optimistic: AiChatMessage = {
      id: `tmp-${Date.now()}`, role: "user", content: q,
      grounded: false, sourceCount: 0, createdAt: null,
    };
    setMessages((m) => [...m, optimistic]);
    setQuestion("");

    try {
      let convoId = activeId;
      if (!convoId) {
        const created = await api.post<AiConversationSummary>(base, {});
        convoId = created.id;
        setActiveId(convoId);
        setConvos((c) => [created, ...c]);
      }
      const res = await api.post<SendMessageResponse>(`${base}/${convoId}/messages`, { question: q });
      setMessages((m) => [...m, res.answer]);
      // atualiza título/ordem na lista lateral
      setConvos((c) => {
        const without = c.filter((x) => x.id !== res.conversationId);
        return [{ id: res.conversationId, title: res.title, updatedAt: new Date().toISOString() }, ...without];
      });
    } catch (err) {
      setError(msg(err));
      // remove a pergunta otimista que não foi respondida
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      setQuestion(q);
    } finally {
      setSending(false);
    }
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <div className="ai-layout" data-testid="ai-chat">
      {/* sidebar de conversas */}
      <aside className="ai-side">
        <button type="button" className="ai-new" data-testid="ai-new-conversation" onClick={newConvo}>
          ＋ Nova conversa
        </button>
        <div className="ai-convos" data-testid="ai-conversations">
          {convos.length === 0 && <p className="muted ai-side-empty">Sem conversas ainda.</p>}
          {convos.map((c) => (
            <div
              key={c.id}
              data-testid={`ai-conversation-${c.id}`}
              className={`ai-convo ${activeId === c.id ? "active" : ""}`}
              onClick={() => openConvo(c.id)}
            >
              <span className="ai-convo-title">{c.title}</span>
              <button
                type="button" className="ai-convo-del" aria-label="excluir conversa"
                data-testid={`ai-conversation-del-${c.id}`} onClick={(e) => deleteConvo(c.id, e)}
              >✕</button>
            </div>
          ))}
        </div>
      </aside>

      {/* painel de mensagens */}
      <section className="ai-main">
        <header className="ai-head">
          <span className="ai-avatar">✦</span>
          <div>
            <div className="ai-head-title">Mestre de Regras</div>
            <div className="muted ai-head-sub">baseado em {systemName ?? "este sistema"}</div>
          </div>
        </header>

        <div className="ai-msgs" ref={scrollRef}>
          {messages.length === 0 && !sending && (
            <p className="muted ai-empty">
              Pergunte sobre as regras do sistema desta campanha. As respostas usam o material indexado.
            </p>
          )}
          {messages.map((m) => {
            const isLastAssistant = m.role === "assistant" && m.id === lastAssistant?.id;
            return (
              <div key={m.id} className={`ai-row ${m.role}`}>
                <div className="ai-bubble" data-testid={isLastAssistant ? "ai-answer" : undefined}>
                  <div className="ai-bubble-text">{m.content}</div>
                  {m.role === "assistant" && (
                    <div className="ai-bubble-meta mono">
                      {m.grounded ? `${m.sourceCount} trecho(s) do sistema` : "sem material indexado"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {sending && (
            <div className="ai-row assistant">
              <div className="ai-bubble"><div className="ai-typing"><span/><span/><span/></div></div>
            </div>
          )}
        </div>

        {error && <p className="error ai-error">⚠ {error}</p>}

        <form className="ai-input" onSubmit={send}>
          <input
            data-testid="ai-question" value={question}
            placeholder="Pergunte sobre as regras do sistema…"
            onChange={(e) => setQuestion(e.target.value)}
          />
          <button type="submit" data-testid="ai-ask" disabled={sending || !question.trim()}>
            {sending ? "…" : "Enviar"}
          </button>
        </form>
      </section>
    </div>
  );
}

function msg(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  return e instanceof Error ? e.message : "Falha inesperada";
}
