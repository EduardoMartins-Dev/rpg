import { ApiError } from "@/server/http/errors";
import { SYSTEM_PROMPT } from "../prompts";
import { providerErrorDetail } from "./providerError";
import type { ChatModel, RetrievedChunk, Turn } from "../types";

/**
 * Geração via Ollama (modelo local, ex.: Qwen2.5-14B). Usa o endpoint NATIVO /api/chat
 * porque só nele dá para fixar `options.num_ctx` — o Ollama, por padrão, usa um contexto
 * curto (~2–4K) e CORTA o prompt em silêncio, o que apagaria o trecho do livro do RAG e
 * levaria à alucinação. Por isso num_ctx alto é obrigatório aqui.
 *
 * Mesmo ancoramento dos outros provedores (SYSTEM_PROMPT): responder só pelo trecho.
 * Como o app roda em serverless (Vercel), OLLAMA_BASE_URL precisa ser um endereço que o
 * servidor alcance — na prática, um túnel (cloudflared/ngrok) para a máquina com o Ollama.
 */
export const ollamaChatModel: ChatModel = {
  async generate(question: string, sources: RetrievedChunk[], systemId: string, history: Turn[] = []) {
    const baseUrl = (process.env.OLLAMA_BASE_URL ?? "http://localhost:11434").replace(/\/$/, "");
    const model = process.env.OLLAMA_MODEL ?? "qwen2.5:14b-instruct-q4_K_M";
    const numCtx = Math.max(2048, Number(process.env.OLLAMA_NUM_CTX ?? 16384) || 16384);
    const apiKey = process.env.OLLAMA_API_KEY ?? "";

    const context = sources.map((s) => s.content).join("\n---\n");
    const messages: Array<{ role: string; content: string }> = [{ role: "system", content: SYSTEM_PROMPT }];
    for (const t of history) {
      messages.push({ role: t.role === "assistant" ? "assistant" : "user", content: t.content });
    }
    messages.push({
      role: "user",
      content: `Contexto (system_id=${systemId}):\n${context}\n\nPergunta: ${question}`,
    });

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Pula a página de aviso do ngrok free (interstitial) para chamadas de servidor.
          // Inofensivo fora do ngrok; garante que a resposta venha como JSON, não como HTML.
          "ngrok-skip-browser-warning": "1",
          // Opcional: se o túnel exigir um header de acesso (ex.: Cloudflare Access / proxy).
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: { temperature: 0.2, num_ctx: numCtx },
        }),
      });
    } catch (e) {
      throw ApiError.badGateway(`AI provider error: ${e instanceof Error ? e.message : "network error"}`);
    }
    if (!res.ok) {
      const detalhe = await providerErrorDetail(res, "ollama");
      console.error(`[ollama] modelo="${model}" ${detalhe}`);
      throw ApiError.badGateway(`Erro do provedor de IA — ${detalhe} (modelo: ${model})`);
    }
    const body = (await res.json()) as { message?: { content?: string } };
    const content = body.message?.content;
    if (!content) {
      throw ApiError.badGateway("empty response from AI provider");
    }
    return content;
  },
};
