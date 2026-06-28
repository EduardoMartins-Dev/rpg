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
    private final com.portalrpg.storage.StorageService storage;

    public RagIndexingService(SystemDocumentRepository documents, DocumentTextExtractor extractor,
            DocumentChunkStore store, EmbeddingModel embeddings,
            com.portalrpg.storage.StorageService storage) {
        this.documents = documents;
        this.extractor = extractor;
        this.store = store;
        this.embeddings = embeddings;
        this.storage = storage;
    }

    /** Baixa o objeto do Storage e indexa (usado pela indexação assíncrona). */
    @Transactional
    public void indexStorage(UUID documentId, String path) {
        SystemDocument doc = documents.findById(documentId)
                .orElseThrow(() -> ApiException.notFound("document not found"));
        byte[] bytes = storage.download(path);
        indexText(doc, extractor.extractBytes(bytes, path));
    }

    @Transactional
    public void index(UUID documentId) {
        SystemDocument doc = documents.findById(documentId)
                .orElseThrow(() -> ApiException.notFound("document not found"));
        index(doc);
    }

    @Transactional
    public void index(SystemDocument doc) {
        indexText(doc, extractor.extract(doc.getFileUrl()));
    }

    /** Indexa texto já extraído (ex.: "colar regras", ingestão por texto puro). */
    /** Quantos chunks por chamada de embedding (lote). Mantém o request curto e respeita
     *  limites do provedor; documentos grandes deixam de fazer 1 call por chunk. */
    private static final int EMBED_BATCH = 64;

    @Transactional
    public void indexText(SystemDocument doc, String text) {
        if (text == null || text.isBlank()) {
            throw ApiException.badRequest("no text to index");
        }
        store.deleteByDocument(doc.getId());
        List<String> chunks = chunk(text);
        for (int i = 0; i < chunks.size(); i += EMBED_BATCH) {
            List<String> slice = chunks.subList(i, Math.min(i + EMBED_BATCH, chunks.size()));
            List<float[]> vectors = embeddings.embedAll(slice);
            for (int j = 0; j < slice.size(); j++) {
                store.insert(doc.getId(), doc.getSystemId(), slice.get(j), vectors.get(j));
            }
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
