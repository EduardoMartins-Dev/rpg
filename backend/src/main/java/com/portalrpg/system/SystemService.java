package com.portalrpg.system;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.portalrpg.common.ApiException;
import com.portalrpg.rag.AsyncIndexer;
import com.portalrpg.rag.DocumentChunkStore;
import com.portalrpg.rag.RagIndexingService;
import com.portalrpg.storage.StorageService;
import com.portalrpg.system.dto.SystemDtos.DocumentResponse;
import com.portalrpg.system.dto.SystemDtos.SheetSchemaRequest;
import com.portalrpg.system.dto.SystemDtos.SheetSchemaResponse;
import com.portalrpg.system.dto.SystemDtos.SystemRequest;
import com.portalrpg.system.dto.SystemDtos.SystemResponse;

@Service
public class SystemService {

    private final RpgSystemRepository systems;
    private final SystemSheetSchemaRepository schemas;
    private final SystemDocumentRepository documents;
    private final RagIndexingService indexing;
    private final DocumentChunkStore chunks;
    private final StorageService storage;
    private final AsyncIndexer asyncIndexer;
    private final Path uploadDir;

    public SystemService(RpgSystemRepository systems,
            SystemSheetSchemaRepository schemas,
            SystemDocumentRepository documents,
            RagIndexingService indexing,
            DocumentChunkStore chunks,
            StorageService storage,
            AsyncIndexer asyncIndexer,
            @Value("${app.upload.dir:${java.io.tmpdir}/portalrpg-uploads}") String uploadDir) {
        this.systems = systems;
        this.schemas = schemas;
        this.documents = documents;
        this.indexing = indexing;
        this.chunks = chunks;
        this.storage = storage;
        this.asyncIndexer = asyncIndexer;
        this.uploadDir = Path.of(uploadDir);
    }

    @Transactional(readOnly = true)
    public List<SystemResponse> list() {
        return systems.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public SystemResponse get(UUID id) {
        return toResponse(require(id));
    }

    @Transactional
    public SystemResponse create(SystemRequest req, UUID creator) {
        if (systems.existsBySlug(req.slug())) {
            throw ApiException.conflict("slug already in use");
        }
        RpgSystem s = new RpgSystem(req.name(), req.slug(), req.description(), creator);
        s.setRuleset(req.ruleset() == null ? "v5" : req.ruleset());
        systems.save(s);
        return toResponse(s);
    }

    @Transactional
    public SystemResponse update(UUID id, SystemRequest req) {
        RpgSystem s = require(id);
        if (!s.getSlug().equals(req.slug()) && systems.existsBySlug(req.slug())) {
            throw ApiException.conflict("slug already in use");
        }
        s.setName(req.name());
        s.setSlug(req.slug());
        s.setDescription(req.description());
        if (req.ruleset() != null) {
            s.setRuleset(req.ruleset());
        }
        return toResponse(s);
    }

    @Transactional(readOnly = true)
    public SheetSchemaResponse getSchema(UUID systemId) {
        require(systemId);
        SystemSheetSchema sc = schemas.findBySystemId(systemId)
                .orElseThrow(() -> ApiException.notFound("sheet-schema not defined for this system"));
        return new SheetSchemaResponse(systemId, sc.getSchema());
    }

    @Transactional
    public SheetSchemaResponse putSchema(UUID systemId, SheetSchemaRequest req) {
        require(systemId);
        SystemSheetSchema sc = schemas.findBySystemId(systemId)
                .map(existing -> {
                    existing.setSchema(req.schema());
                    return existing;
                })
                .orElseGet(() -> new SystemSheetSchema(systemId, req.schema()));
        schemas.save(sc);
        return new SheetSchemaResponse(systemId, sc.getSchema());
    }

    /**
     * Upload + indexação (F5): armazena o arquivo (PENDING), dispara a indexação
     * (extrai→chunk→embedding→pgvector) e marca INDEXED. Síncrono p/ determinismo.
     */
    @Transactional
    public DocumentResponse uploadDocument(UUID systemId, MultipartFile file, boolean clear) {
        require(systemId);
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("file is required");
        }
        if (clear) {
            clearIndex(systemId);
        }
        SystemDocument doc = new SystemDocument(systemId, "pending://" + file.getOriginalFilename());
        documents.save(doc); // get an id
        try {
            Files.createDirectories(uploadDir);
            Path target = uploadDir.resolve(doc.getId().toString() + "-" + sanitize(file.getOriginalFilename()));
            file.transferTo(target);
            doc.setFileUrl(target.toUri().toString());
        } catch (IOException e) {
            throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                    "failed to store uploaded file: " + e.getMessage());
        }
        // Flush antes da indexação: os chunks (JDBC) têm FK p/ system_documents; o INSERT
        // do JPA é diferido e violaria document_chunks_document_id_fkey sem o flush.
        documents.saveAndFlush(doc);
        indexing.index(doc); // PENDING → INDEXED, popula document_chunks com system_id
        return toDocResponse(doc);
    }

    /** Ingestão por texto puro ("colar regras"): indexa sem subir arquivo. */
    @Transactional
    public DocumentResponse uploadText(UUID systemId, String title, String text, boolean clear) {
        require(systemId);
        if (text == null || text.isBlank()) {
            throw ApiException.badRequest("text is required");
        }
        if (clear) {
            clearIndex(systemId);
        }
        String label = (title == null || title.isBlank()) ? "texto-colado" : title.strip();
        SystemDocument doc = new SystemDocument(systemId, "text://" + sanitize(label));
        documents.saveAndFlush(doc); // FK dos chunks
        indexing.indexText(doc, text);
        return toDocResponse(doc);
    }

    public boolean storageEnabled() {
        return storage.enabled();
    }

    /**
     * Gera uma signed upload URL pro navegador subir o livro DIRETO no Supabase
     * Storage (não passa por Vercel/Render). Retorna a URL e o path do objeto.
     */
    @Transactional(readOnly = true)
    public StorageService.SignedUpload createUploadUrl(UUID systemId, String filename) {
        require(systemId);
        String path = systemId + "/" + UUID.randomUUID() + "-" + sanitize(filename);
        return storage.createSignedUpload(path);
    }

    /**
     * Registra um livro já enviado ao Storage e dispara a indexação ASSÍNCRONA
     * (download+extração+embeddings em background → PENDING → INDEXED/FAILED).
     */
    @Transactional
    public DocumentResponse registerStorageDocument(UUID systemId, String path, boolean clear) {
        require(systemId);
        if (path == null || path.isBlank()) {
            throw ApiException.badRequest("path is required");
        }
        if (clear) {
            clearIndex(systemId);
        }
        SystemDocument doc = new SystemDocument(systemId, "supabase://" + storage.bucket() + "/" + path);
        documents.saveAndFlush(doc);
        asyncIndexer.indexStorageAsync(doc.getId(), path); // background
        return toDocResponse(doc);
    }

    /** Exclui o sistema (schema, documentos e chunks caem por cascade). Bloqueia se houver campanhas. */
    @Transactional
    public void deleteSystem(UUID id) {
        require(id);
        chunks.deleteBySystem(id); // chunks têm FK p/ system_documents; remove antes
        try {
            systems.deleteById(id);
            systems.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw ApiException.conflict("system has campaigns; delete those campaigns first");
        }
    }

    /** Limpa o índice RAG do sistema: apaga chunks e documentos (reindexar do zero). */
    @Transactional
    public int clearIndex(UUID systemId) {
        require(systemId);
        int removed = chunks.deleteBySystem(systemId); // chunks 1º (FK p/ system_documents)
        documents.deleteBySystemId(systemId);
        return removed;
    }

    /** Remove um único documento do RAG (chunks + registro) sem mexer nos demais. */
    @Transactional
    public void deleteDocument(UUID systemId, UUID documentId) {
        require(systemId);
        SystemDocument doc = documents.findById(documentId)
                .orElseThrow(() -> ApiException.notFound("document not found"));
        if (!systemId.equals(doc.getSystemId())) {
            throw ApiException.notFound("document not found"); // não pertence a este sistema
        }
        chunks.deleteByDocument(documentId); // chunks 1º (FK p/ system_documents)
        documents.delete(doc);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> listDocuments(UUID systemId) {
        require(systemId);
        return documents.findBySystemIdOrderByCreatedAtAsc(systemId).stream()
                .map(this::toDocResponse).toList();
    }

    // --- helpers ---------------------------------------------------------

    private RpgSystem require(UUID id) {
        return systems.findById(id).orElseThrow(() -> ApiException.notFound("system not found"));
    }

    private static String sanitize(String name) {
        if (name == null) {
            return "upload.bin";
        }
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private SystemResponse toResponse(RpgSystem s) {
        return new SystemResponse(s.getId(), s.getName(), s.getSlug(), s.getDescription(),
                s.getRuleset(), s.getCreatedBy(), s.getCreatedAt());
    }

    private DocumentResponse toDocResponse(SystemDocument d) {
        return new DocumentResponse(d.getId(), d.getSystemId(), d.getFileUrl(),
                d.getStatus().name(), d.getCreatedAt());
    }
}
