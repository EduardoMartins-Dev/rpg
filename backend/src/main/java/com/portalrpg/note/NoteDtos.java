package com.portalrpg.note;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Size;

public final class NoteDtos {

    private NoteDtos() {
    }

    public record NoteRequest(
            @Size(max = 255) String title,
            String body) {
    }

    public record NoteResponse(
            UUID id,
            UUID authorId,
            String authorName,
            String title,
            String body,
            boolean canEdit,
            Instant createdAt,
            Instant updatedAt) {
    }
}
