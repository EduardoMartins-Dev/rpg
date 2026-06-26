package com.portalrpg.rag;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.portalrpg.common.ApiException;
import com.portalrpg.system.SystemDocument;
import com.portalrpg.system.SystemDocumentRepository;

/**
 * Pipeline de indexação (prompt §6): extrai texto → chunking → embeddings →
 * document_chunks com system_id → status INDEXED. Idempotente: reindexar um documento
 * limpa seus chunks antes. Disparado pelo upload do admin.
 */
@Service
public class RagIndexingService {

    private static final int MAX_CHUNK_CHARS = 600;

    private final SystemDocumentRepository documents;
    private final DocumentTextExtractor extractor;
    private final DocumentChunkStore store;
    private final EmbeddingModel embeddings;

    public RagIndexingService(SystemDocumentRepository documents, DocumentTextExtractor extractor,
            DocumentChunkStore store, EmbeddingModel embeddings) {
        this.documents = documents;
        this.extractor = extractor;
        this.store = store;
        this.embeddings = embeddings;
    }

    @Transactional
    public void index(UUID documentId) {
        SystemDocument doc = documents.findById(documentId)
                .orElseThrow(() -> ApiException.notFound("document not found"));
        index(doc);
    }

    @Transactional
    public void index(SystemDocument doc) {
        String text = extractor.extract(doc.getFileUrl());
        store.deleteByDocument(doc.getId());
        for (String chunk : chunk(text)) {
            store.insert(doc.getId(), doc.getSystemId(), chunk, embeddings.embed(chunk));
        }
        doc.setStatus(SystemDocument.Status.INDEXED);
        documents.save(doc);
    }

    /** Chunking simples: parágrafos (linhas em branco); parágrafos longos são quebrados. */
    static List<String> chunk(String text) {
        List<String> out = new ArrayList<>();
        if (text == null) {
            return out;
        }
        for (String para : text.split("\\r?\\n\\s*\\r?\\n")) {
            String p = para.strip().replaceAll("\\s+", " ");
            if (p.isEmpty()) {
                continue;
            }
            while (p.length() > MAX_CHUNK_CHARS) {
                int cut = p.lastIndexOf(' ', MAX_CHUNK_CHARS);
                if (cut <= 0) {
                    cut = MAX_CHUNK_CHARS;
                }
                out.add(p.substring(0, cut).strip());
                p = p.substring(cut).strip();
            }
            if (!p.isEmpty()) {
                out.add(p);
            }
        }
        return out;
    }
}
