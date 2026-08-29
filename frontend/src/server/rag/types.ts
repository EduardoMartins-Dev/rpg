export type RetrievedChunk = { content: string; systemId: string };
export type Turn = { role: "user" | "assistant"; content: string };

export interface EmbeddingModel {
  dimension(): number;
  embed(text: string): Promise<number[]> | number[];
  embedAll(texts: string[]): Promise<number[][]> | number[][];
}

export interface ChatModel {
  generate(question: string, sources: RetrievedChunk[], systemId: string, history?: Turn[]): Promise<string>;
}
