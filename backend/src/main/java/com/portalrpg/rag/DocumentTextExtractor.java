package com.portalrpg.rag;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

import com.portalrpg.common.ApiException;

/**
 * Extrai texto do documento enviado. Texto puro (.txt/.md) é lido como UTF-8;
 * PDF é extraído via Apache PDFBox. O pipeline seguinte
 * (chunk→embedding→pgvector→retrieval) é idêntico para ambos.
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
        if (name.endsWith(".pdf")) {
            return extractPdf(bytes);
        }
        // .txt/.md/.text e fallback: UTF-8
        return new String(bytes, StandardCharsets.UTF_8);
    }

    private String extractPdf(byte[] bytes) {
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            String text = new PDFTextStripper().getText(doc);
            if (text == null || text.isBlank()) {
                throw ApiException.badRequest(
                        "could not extract text from PDF (it may be scanned/image-only)");
            }
            return text;
        } catch (IOException e) {
            throw ApiException.badRequest("invalid or unreadable PDF: " + e.getMessage());
        }
    }
}
