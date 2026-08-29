import { ApiError } from "@/server/http/errors";
import type { EmbeddingModel } from "../types";

export const DIM = 1024;
const MAX_RETRIES = 5; // ~20+40+60+80+100s total wait
const RETRY_WAIT_MS = 20_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type JinaResponse = { data?: Array<{ index?: number; embedding?: number[] }> };

/**
 * Port of JinaEmbeddingModel.java — semantic embedding via the Jina API
 * (jina-embeddings-v3, multilingual). One call for N texts; returns vectors in the SAME
 * order as the input. On 429 (per-minute free-tier rate limit), waits and retries — the
 * window resets every minute, so the backoff unblocks itself without losing the document.
 */
async function request(inputs: string[]): Promise<number[][]> {
  const apiKey = process.env.JINA_API_KEY ?? "";
  if (!apiKey) {
    throw new Error("EMBEDDINGS_PROVIDER=jina requires JINA_API_KEY");
  }
  const baseUrl = process.env.JINA_BASE_URL ?? "https://api.jina.ai/v1";
  const model = process.env.JINA_MODEL ?? "jina-embeddings-v3";

  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(`${baseUrl}/embeddings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, task: "text-matching", dimensions: DIM, input: inputs }),
      });
    } catch (e) {
      throw ApiError.badGateway(`Jina embeddings error: ${e instanceof Error ? e.message : "network error"}`);
    }
    if (res.status === 429) {
      if (attempt >= MAX_RETRIES) {
        throw new ApiError(429, "Jina rate limit (free tier 100k tokens/min); tente novamente em 1 min");
      }
      await sleep(RETRY_WAIT_MS * (attempt + 1)); // 20s, 40s, 60s...
      continue;
    }
    if (!res.ok) {
      throw ApiError.badGateway(`Jina embeddings error: returned ${res.status}`);
    }
    const body = (await res.json()) as JinaResponse;
    if (!body.data || body.data.length !== inputs.length) {
      throw ApiError.badGateway("unexpected embedding count from Jina");
    }
    const ordered: number[][] = new Array(inputs.length);
    for (const d of body.data) {
      if (!d.embedding) {
        throw ApiError.badGateway("empty embedding from Jina");
      }
      ordered[d.index ?? 0] = d.embedding;
    }
    return ordered;
  }
}

export const jinaEmbeddingModel: EmbeddingModel = {
  dimension: () => DIM,
  async embed(text: string) {
    const input = !text || text.trim().length === 0 ? " " : text;
    const [vec] = await request([input]);
    return vec;
  },
  async embedAll(texts: string[]) {
    if (texts.length === 0) return [];
    // Empty strings break the API; swap for a space (keeps the position in the batch).
    const inputs = texts.map((t) => (!t || t.trim().length === 0 ? " " : t));
    return request(inputs);
  },
};
