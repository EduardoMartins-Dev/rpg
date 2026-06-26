package com.portalrpg.rag;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

import org.springframework.stereotype.Component;

import com.portalrpg.common.ApiException;

/**
 * Extrai texto do documento enviado. Texto puro (.txt/.md) é lido como UTF-8.
 * PDF é o formato de produção: a extração via Apache PDFBox entra aqui (ponto de
 * extensão) — mantida fora do build de teste para CI hermético; as fixtures de RAG
 * usam texto. O pipeline (chunk→embedding→pgvector→retrieval) é idêntico.
 */
@Component
public class DocumentTextExtractor {

    public String extract(String fileUrl) {
        Path path = Path.of(URI.create(fileUrl));
        String name = path.getFileName().toString().toLowerCase(Locale.ROOT);
        byte[] bytes;
        try {
            bytes = Files.readAllBytes(path);
        } catch (IOException e) {
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "failed to read document for indexing: " + e.getMessage());
        }
        if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".text")) {
            return new String(bytes, StandardCharsets.UTF_8);
        }
        if (name.endsWith(".pdf")) {
            throw ApiException.badRequest(
                    "PDF extraction not enabled in this build; index a .txt fixture (PDFBox is the prod extractor)");
        }
        // fallback: trata como UTF-8
        return new String(bytes, StandardCharsets.UTF_8);
    }
}
