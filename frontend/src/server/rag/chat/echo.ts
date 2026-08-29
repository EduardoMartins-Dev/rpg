import type { ChatModel, RetrievedChunk, Turn } from "../types";

/**
 * Port of EchoChatModel.java — deterministic mock (no network call). Default provider
 * for tests/dev: reproducible generation, real retrieval, no LLM.
 */
export const echoChatModel: ChatModel = {
  async generate(question: string, sources: RetrievedChunk[], systemId: string, history: Turn[] = []) {
    const context = sources.map((s) => s.content).join(" | ");
    const hist = history.length === 0 ? "" : ` [hist=${history.length}]`;
    return `Resposta (system_id=${systemId})${hist} para "${question}": ${context}`;
  },
};
