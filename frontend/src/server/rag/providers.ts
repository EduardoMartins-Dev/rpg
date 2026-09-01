import * as hashing from "./embeddings/hashing";
import { jinaEmbeddingModel } from "./embeddings/jina";
import { echoChatModel } from "./chat/echo";
import { groqChatModel } from "./chat/groq";
import { geminiChatModel } from "./chat/gemini";
import { ollamaChatModel } from "./chat/ollama";
import type { ChatModel, EmbeddingModel } from "./types";

const hashingEmbeddingModel: EmbeddingModel = {
  dimension: () => hashing.DIM,
  embed: hashing.embed,
  embedAll: hashing.embedAll,
};

/** Selects the active EmbeddingModel by EMBEDDINGS_PROVIDER (mirrors the Java
 * @ConditionalOnProperty wiring — hashing is the default, matching-if-missing). */
export function embeddingModel(): EmbeddingModel {
  const provider = (process.env.EMBEDDINGS_PROVIDER ?? "hashing").toLowerCase();
  return provider === "jina" ? jinaEmbeddingModel : hashingEmbeddingModel;
}

/** Selects the active ChatModel by AI_PROVIDER (echo is the default). */
export function chatModel(): ChatModel {
  const provider = (process.env.AI_PROVIDER ?? "echo").toLowerCase();
  if (provider === "groq") return groqChatModel;
  if (provider === "gemini") return geminiChatModel;
  if (provider === "ollama") return ollamaChatModel;
  return echoChatModel;
}
