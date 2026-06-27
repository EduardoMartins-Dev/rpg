package com.portalrpg.board;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Size;

public final class BoardDtos {

    private BoardDtos() {
    }

    /** Pelo menos um campo de conteúdo deve vir preenchido (validado no service). */
    public record BoardItemRequest(
            @Size(max = 255) String title,
            String body,
            @Size(max = 2048) String imageUrl,
            Integer sortOrder) {
    }

    public record BoardItemResponse(
            UUID id,
            UUID campaignId,
            String title,
            String body,
            String imageUrl,
            int sortOrder,
            Instant createdAt,
            Instant updatedAt) {

        static BoardItemResponse of(BoardItem i) {
            return new BoardItemResponse(i.getId(), i.getCampaignId(), i.getTitle(), i.getBody(),
                    i.getImageUrl(), i.getSortOrder(), i.getCreatedAt(), i.getUpdatedAt());
        }
    }
}
