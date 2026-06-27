package com.portalrpg.system.dto;

import java.time.Instant;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class SystemDtos {

    private SystemDtos() {
    }

    public record SystemRequest(
            @NotBlank @Size(max = 255) String name,
            @NotBlank @Size(max = 255) @Pattern(regexp = "^[a-z0-9-]+$",
                    message = "slug must be lowercase alphanumeric with hyphens") String slug,
            String description,
            @Pattern(regexp = "v5|generic", message = "ruleset must be 'v5' or 'generic'") String ruleset) {
    }

    public record SystemResponse(
            UUID id,
            String name,
            String slug,
            String description,
            String ruleset,
            UUID createdBy,
            Instant createdAt) {
    }

    public record SheetSchemaRequest(
            @NotNull JsonNode schema) {
    }

    public record SheetSchemaResponse(
            UUID systemId,
            JsonNode schema) {
    }

    public record DocumentResponse(
            UUID id,
            UUID systemId,
            String fileUrl,
            String status,
            Instant createdAt) {
    }

    /** Ingestão por texto puro ("colar regras") — alimenta o RAG sem subir arquivo. */
    public record TextDocumentRequest(
            @Size(max = 255) String title,
            @NotBlank String text) {
    }

    /** Pedido de signed upload URL (upload direto pro Supabase Storage). */
    public record UploadUrlRequest(@NotBlank @Size(max = 255) String filename) {
    }

    public record UploadUrlResponse(String uploadUrl, String path, String bucket) {
    }

    /** Registra um objeto já enviado ao Storage p/ indexação assíncrona. */
    public record StorageDocumentRequest(@NotBlank String path) {
    }
}
