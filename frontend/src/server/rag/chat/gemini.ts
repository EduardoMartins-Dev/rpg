import { ApiError } from "@/server/http/errors";
import { SYSTEM_PROMPT } from "../prompts";
import type { ChatModel, RetrievedChunk, Turn } from "../types";

// Generous output cap — avoids an accidental giant response without truncating real ones.
const MAX_OUTPUT_TOKENS = 2048;
// Retry on 429 (quota) and 5xx (e.g. 503 "high demand", common on the free flash tier).
const MAX_RETRIES = 4;
const RETRY_WAIT_MS = 4000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type GeminiResponse = { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };

function firstText(res: GeminiResponse | null): string | null {
  const parts = res?.candidates?.[0]?.content?.parts;
  if (!parts || parts.length === 0) return null;
  return parts
    .map((p) => p.text)
    .filter((t): t is string => !!t)
    .join("");
}

/**
 * Port of GeminiChatModel.java — real generation via Google Gemini. Same anchoring as
 * Groq (see SYSTEM_PROMPT). Gemini uses "user"/"model" roles (not "assistant").
 */
export const geminiChatModel: ChatModel = {
  async generate(question: string, sources: RetrievedChunk[], systemId: string, history: Turn[] = []) {
    const apiKey = process.env.GEMINI_API_KEY ?? "";
    if (!apiKey) {
      throw new Error("AI_PROVIDER=gemini requires GEMINI_API_KEY");
    }
    const baseUrl = process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta";
    const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

    const context = sources.map((s) => s.content).join("\n---\n");
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    for (const t of history) {
      contents.push({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] });
    }
    contents.push({
      role: "user",
      parts: [{ text: `Contexto (system_id=${systemId}):\n${context}\n\nPergunta: ${question}` }],
    });

    const generationConfig: Record<string, unknown> = { temperature: 0.2, maxOutputTokens: MAX_OUTPUT_TOKENS };
    // thinkingConfig only exists on 2.5+ models (sending it to 2.0 errors "unknown field").
    if (model.includes("2.5")) {
      generationConfig.thinkingConfig = { thinkingBudget: 0 };
    }
    const body = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig,
    };

    let lastMessage = "";
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      let res: Response;
      try {
        res = await fetch(`${baseUrl}/models/${model}:generateContent`, {
          method: "POST",
          headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (e) {
        throw ApiError.badGateway(`AI provider error: ${e instanceof Error ? e.message : "network error"}`);
      }
      if (!res.ok) {
        if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES - 1) {
          lastMessage = `gemini returned ${res.status}`;
          await sleep(RETRY_WAIT_MS * (attempt + 1));
          continue;
        }
        throw ApiError.badGateway(`AI provider error: gemini returned ${res.status}`);
      }
      const json = (await res.json()) as GeminiResponse;
      const text = firstText(json);
      if (!text) {
        throw ApiError.badGateway("empty response from AI provider");
      }
      return text;
    }
    throw ApiError.badGateway(`AI provider indisponível após retentativas: ${lastMessage}`);
  },
};
