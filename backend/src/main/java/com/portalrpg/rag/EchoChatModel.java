package com.portalrpg.rag;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import com.portalrpg.rag.DocumentChunkStore.RetrievedChunk;

/**
 * Geração determinística (mock): ecoa o system_id e o conteúdo integral dos chunks
 * recuperados. É o ChatModel PADRÃO (tests/dev) — geração reprodutível, retrieval real,
 * sem LLM. Em prod, AI_PROVIDER=groq ativa o {@link GroqChatModel} no lugar deste.
 */
@Component
@ConditionalOnProperty(prefix = "app.ai", name = "provider", havingValue = "echo", matchIfMissing = true)
public class EchoChatModel implements ChatModel {

    @Override
    public String generate(String question, List<RetrievedChunk> sources, UUID systemId) {
        String context = sources.stream().map(RetrievedChunk::content)
                .collect(Collectors.joining(" | "));
        return "Resposta (system_id=" + systemId + ") para \"" + question + "\": " + context;
    }
}
