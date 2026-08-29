import { ApiError } from "@/server/http/errors";
import { SYSTEM_PROMPT } from "../prompts";
import type { ChatModel, RetrievedChunk, Turn } from "../types";

/**
 * Port of GroqChatModel.java — real generation via an OpenAI-compatible API. Anchored:
 * the prompt instructs the model to answer only from the retrieved chunks.
 */
export const groqChatModel: ChatModel = {
  async generate(question: string, sources: RetrievedChunk[], systemId: string, history: Turn[] = []) {
    const apiKey = process.env.GROQ_API_KEY ?? "";
    if (!apiKey) {
      throw new Error("AI_PROVIDER=groq requires GROQ_API_KEY");
    }
    const baseUrl = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
    const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

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
      res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, temperature: 0.2, messages }),
      });
    } catch (e) {
      throw ApiError.badGateway(`AI provider error: ${e instanceof Error ? e.message : "network error"}`);
    }
    if (!res.ok) {
      throw ApiError.badGateway(`AI provider error: groq returned ${res.status}`);
    }
    const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = body.choices?.[0]?.message?.content;
    if (!content) {
      throw ApiError.badGateway("empty response from AI provider");
    }
    return content;
  },
};
