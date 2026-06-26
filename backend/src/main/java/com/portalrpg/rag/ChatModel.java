package com.portalrpg.rag;

import java.util.List;
import java.util.UUID;

import com.portalrpg.rag.DocumentChunkStore.RetrievedChunk;

/**
 * Geração da resposta a partir da pergunta + chunks recuperados. Em produção, um
 * provedor (Groq/OpenAI) implementaria isto; nos testes a geração é mockada e NUNCA
 * chama LLM real (prompt §0.3). Só o retrieval é validado de verdade.
 */
public interface ChatModel {

    String generate(String question, List<RetrievedChunk> sources, UUID systemId);
}
