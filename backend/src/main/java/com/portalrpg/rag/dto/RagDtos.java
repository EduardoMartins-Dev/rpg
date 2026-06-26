package com.portalrpg.rag.dto;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;

public final class RagDtos {

    private RagDtos() {
    }

    public record AskRequest(
            @NotBlank String question) {
    }

    public record SourceChunk(String content, UUID systemId) {
    }

    public record AskResponse(
            UUID campaignId,
            UUID systemId,
            String question,
            String answer,
            boolean grounded,
            List<SourceChunk> sources) {
    }

    public record PowerTextResponse(
            UUID systemId,
            String power,
            String text) {
    }
}
