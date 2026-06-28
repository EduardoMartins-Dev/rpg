package com.portalrpg.ai;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;

public final class AiDtos {

    private AiDtos() {
    }

    /** Resumo de conversa para a lista lateral. */
    public record ConversationSummary(UUID id, String title, Instant updatedAt) {
    }

    public record MessageView(
            UUID id, String role, String content, boolean grounded, int sourceCount, Instant createdAt) {
    }

    /** Conversa completa com suas mensagens em ordem. */
    public record ConversationDetail(
            UUID id, String title, Instant createdAt, Instant updatedAt, List<MessageView> messages) {
    }

    public record SendMessageRequest(@NotBlank String question) {
    }

    /** Resultado de enviar uma pergunta: a mensagem do assistente + a conversa atualizada. */
    public record SendMessageResponse(UUID conversationId, String title, MessageView answer) {
    }
}
