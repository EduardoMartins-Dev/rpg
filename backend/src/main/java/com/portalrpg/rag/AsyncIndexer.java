package com.portalrpg.rag;

import java.util.UUID;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.portalrpg.system.SystemDocument;
import com.portalrpg.system.SystemDocumentRepository;

/**
 * Indexação assíncrona: o endpoint retorna na hora (status PENDING) e o trabalho
 * pesado (download + extração + embeddings) roda fora do request, evitando o
 * timeout do proxy da Vercel. Falha marca o documento como FAILED.
 */
@Component
public class AsyncIndexer {

    private final RagIndexingService indexing;
    private final SystemDocumentRepository documents;

    public AsyncIndexer(RagIndexingService indexing, SystemDocumentRepository documents) {
        this.indexing = indexing;
        this.documents = documents;
    }

    @Async
    public void indexStorageAsync(UUID documentId, String path) {
        try {
            indexing.indexStorage(documentId, path);
        } catch (Exception e) {
            markFailed(documentId);
        }
    }

    /** Tx própria (separada da que falhou) pra persistir o FAILED. */
    @Transactional
    public void markFailed(UUID documentId) {
        documents.findById(documentId).ifPresent(d -> {
            d.setStatus(SystemDocument.Status.FAILED);
            documents.save(d);
        });
    }
}
