package com.portalrpg.character.dto;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class CharacterDtos {

    private CharacterDtos() {
    }

    public record CreateCharacterRequest(
            @NotBlank @Size(max = 255) String name,
            @NotNull JsonNode sheetData) {
    }

    public record UpdateCharacterRequest(
            @NotBlank @Size(max = 255) String name,
            @NotNull JsonNode sheetData) {
    }

    public record CharacterResponse(
            UUID id,
            UUID campaignId,
            UUID playerId,
            String name,
            JsonNode sheetData,
            Instant createdAt) {
    }
}
