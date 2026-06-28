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

    // Chunk maior mantém a descrição de um clã/grupo inteira num único trecho, em vez de
    // recuperar só a menção/índice. jina-v3 (8192 tokens) e o LLM aguentam folgado.
    private static final int MAX_CHUNK_CHARS = 1100;

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

    /** Parágrafos curtos (nome de poder, "Level 2", cabeçalho de seção) NÃO viram chunk
     *  sozinhos: são acumulados e PREFIXADOS no próximo parágrafo de conteúdo. Antes eram
     *  descartados, o que separava o NOME do poder das suas mecânicas — a IA via o efeito
     *  mas não o nome e acabava inventando. Mesclar mantém "Level 2 fleetness <mecânica>"
     *  num único trecho. Também neutraliza ruído de header ("CLÃS"): em vez de virar um
     *  chunk que afoga a busca, vira um prefixo barato do conteúdo seguinte. */
    private static final int MIN_CHUNK_CHARS = 40;

    /** Teto do prefixo acumulado: evita que uma sequência longa de linhas curtas/ruído
     *  (ex.: header repetido em várias páginas) inche o próximo chunk. */
    private static final int MAX_PENDING_CHARS = 200;

    /** Chunking por parágrafos (linhas em branco). Parágrafos longos são quebrados;
     *  parágrafos curtos (headings) são mesclados no parágrafo de conteúdo seguinte. */
    static List<String> chunk(String text) {
        List<String> out = new ArrayList<>();
        if (text == null) {
            return out;
        }
        StringBuilder pending = new StringBuilder(); // headings curtos aguardando conteúdo
        for (String para : text.split("\\r?\\n\\s*\\r?\\n")) {
            String p = para.strip().replaceAll("\\s+", " ");
            if (p.isEmpty()) {
                continue;
            }
            if (p.length() < MIN_CHUNK_CHARS) {
                appendPending(pending, p); // heading/título/ruído: segura p/ prefixar o próximo
                continue;
            }
            if (pending.length() > 0) {
                p = pending + " " + p;
                pending.setLength(0);
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
                out.add(p); // cauda de parágrafo longo é mantida mesmo se curta
            }
        }
        // headings finais sem conteúdo seguinte só são emitidos se já têm densidade própria
        if (pending.length() >= MIN_CHUNK_CHARS) {
            out.add(pending.toString().strip());
        }
        return out;
    }

    /** Acumula um heading no prefixo, respeitando {@link #MAX_PENDING_CHARS} (descarta o
     *  começo se estourar — mantém os headings mais recentes, próximos do conteúdo). */
    private static void appendPending(StringBuilder pending, String heading) {
        if (pending.length() > 0) {
            pending.append(' ');
        }
        pending.append(heading);
        if (pending.length() > MAX_PENDING_CHARS) {
            pending.delete(0, pending.length() - MAX_PENDING_CHARS);
        }
    }
}
