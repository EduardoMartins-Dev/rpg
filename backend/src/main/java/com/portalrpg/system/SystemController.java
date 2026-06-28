package com.portalrpg.system;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.portalrpg.security.AppPrincipal;
import com.portalrpg.system.dto.SystemDtos.DocumentResponse;
import com.portalrpg.system.dto.SystemDtos.SheetSchemaRequest;
import com.portalrpg.system.dto.SystemDtos.SheetSchemaResponse;
import com.portalrpg.system.dto.SystemDtos.StorageDocumentRequest;
import com.portalrpg.system.dto.SystemDtos.SystemRequest;
import com.portalrpg.system.dto.SystemDtos.SystemResponse;
import com.portalrpg.system.dto.SystemDtos.TextDocumentRequest;
import com.portalrpg.system.dto.SystemDtos.UploadUrlRequest;
import com.portalrpg.system.dto.SystemDtos.UploadUrlResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/systems")
public class SystemController {

    private final SystemService service;

    public SystemController(SystemService service) {
        this.service = service;
    }

    // --- read: any authenticated user --------------------------------------

    @GetMapping
    public List<SystemResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    public SystemResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @GetMapping("/{id}/sheet-schema")
    public SheetSchemaResponse getSchema(@PathVariable UUID id) {
        return service.getSchema(id);
    }

    @GetMapping("/{id}/documents")
    @PreAuthorize("hasRole('ADMIN')")
    public List<DocumentResponse> listDocuments(@PathVariable UUID id) {
        return service.listDocuments(id);
    }

    // --- write: admin only -------------------------------------------------

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public SystemResponse create(@Valid @RequestBody SystemRequest req,
            @AuthenticationPrincipal AppPrincipal principal) {
        return service.create(req, principal.userId());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public SystemResponse update(@PathVariable UUID id, @Valid @RequestBody SystemRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.deleteSystem(id);
    }

    @PutMapping("/{id}/sheet-schema")
    @PreAuthorize("hasRole('ADMIN')")
    public SheetSchemaResponse putSchema(@PathVariable UUID id, @Valid @RequestBody SheetSchemaRequest req) {
        return service.putSchema(id, req);
    }

    @PostMapping("/{id}/documents")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentResponse uploadDocument(@PathVariable UUID id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "clear", defaultValue = "false") boolean clear) {
        return service.uploadDocument(id, file, clear);
    }

    /** Ingestão por texto puro ("colar regras") — alimenta o RAG sem subir arquivo. */
    @PostMapping("/{id}/documents/text")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentResponse uploadText(@PathVariable UUID id, @Valid @RequestBody TextDocumentRequest req,
            @RequestParam(value = "clear", defaultValue = "false") boolean clear) {
        return service.uploadText(id, req.title(), req.text(), clear);
    }

    /** Limpa o índice RAG do sistema (chunks + documentos) — reindexar do zero. */
    @DeleteMapping("/{id}/index")
    @PreAuthorize("hasRole('ADMIN')")
    public java.util.Map<String, Integer> clearIndex(@PathVariable UUID id) {
        return java.util.Map.of("removedChunks", service.clearIndex(id));
    }

    /** Remove um único documento do RAG (chunks + registro), sem afetar os demais. */
    @DeleteMapping("/{id}/documents/{docId}")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDocument(@PathVariable UUID id, @PathVariable UUID docId) {
        service.deleteDocument(id, docId);
    }

    // --- Supabase Storage: upload direto do navegador + indexação assíncrona ---

    @GetMapping("/storage/enabled")
    @PreAuthorize("hasRole('ADMIN')")
    public java.util.Map<String, Boolean> storageEnabled() {
        return java.util.Map.of("enabled", service.storageEnabled());
    }

    /** Gera signed upload URL — o navegador faz PUT direto no Supabase. */
    @PostMapping("/{id}/documents/upload-url")
    @PreAuthorize("hasRole('ADMIN')")
    public UploadUrlResponse uploadUrl(@PathVariable UUID id, @Valid @RequestBody UploadUrlRequest req) {
        var s = service.createUploadUrl(id, req.filename());
        return new UploadUrlResponse(s.uploadUrl(), s.path(), s.bucket());
    }

    /** Registra o objeto enviado ao Storage e indexa em background (retorna PENDING). */
    @PostMapping("/{id}/documents/storage")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public DocumentResponse registerStorage(@PathVariable UUID id, @Valid @RequestBody StorageDocumentRequest req,
            @RequestParam(value = "clear", defaultValue = "false") boolean clear) {
        return service.registerStorageDocument(id, req.path(), clear);
    }
}
