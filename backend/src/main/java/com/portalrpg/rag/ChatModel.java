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

    /** Geração stateless (uma pergunta, sem histórico) — usada por {@code /ai/ask}. */
    default String generate(String question, List<RetrievedChunk> sources, UUID systemId) {
        return generate(question, sources, systemId, List.of());
    }

    /**
     * Geração com histórico de conversa (chat estilo ChatGPT). {@code history} são os
     * turnos anteriores em ordem cronológica (sem a pergunta atual). A resposta continua
     * ancorada nos chunks do sistema da campanha.
     */
    String generate(String question, List<RetrievedChunk> sources, UUID systemId, List<Turn> history);

    /** Turno anterior da conversa. role = "user" | "assistant". */
    record Turn(String role, String content) {
    }
}
