package com.portalrpg.note;

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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.portalrpg.campaign.CampaignAccess;
import com.portalrpg.note.NoteDtos.NoteRequest;
import com.portalrpg.note.NoteDtos.NoteResponse;
import com.portalrpg.security.AppPrincipal;

import jakarta.validation.Valid;

/**
 * Anotações da campanha. Qualquer membro acessa (escreve as suas); o serviço
 * filtra/permite por papel — mestre vê e gerencia todas, jogador só as próprias.
 */
@RestController
@RequestMapping("/api/campaigns/{id}/notes")
public class NoteController {

    private final NoteService service;
    private final CampaignAccess access;

    public NoteController(NoteService service, CampaignAccess access) {
        this.service = service;
        this.access = access;
    }

    @GetMapping
    @PreAuthorize("@campaignAccess.isMember(#id)")
    public List<NoteResponse> list(@PathVariable UUID id, @AuthenticationPrincipal AppPrincipal principal) {
        return service.list(id, principal.userId(), isMaster(id));
    }

    @PostMapping
    @PreAuthorize("@campaignAccess.isMember(#id)")
    @ResponseStatus(HttpStatus.CREATED)
    public NoteResponse create(@PathVariable UUID id, @Valid @RequestBody NoteRequest req,
            @AuthenticationPrincipal AppPrincipal principal) {
        return service.create(id, principal.userId(), isMaster(id), req);
    }

    @PutMapping("/{noteId}")
    @PreAuthorize("@campaignAccess.isMember(#id)")
    public NoteResponse update(@PathVariable UUID id, @PathVariable UUID noteId,
            @Valid @RequestBody NoteRequest req, @AuthenticationPrincipal AppPrincipal principal) {
        return service.update(id, noteId, principal.userId(), isMaster(id), req);
    }

    @DeleteMapping("/{noteId}")
    @PreAuthorize("@campaignAccess.isMember(#id)")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @PathVariable UUID noteId,
            @AuthenticationPrincipal AppPrincipal principal) {
        service.delete(id, noteId, principal.userId(), isMaster(id));
    }

    private boolean isMaster(UUID campaignId) {
        return access.hasRole(campaignId, "MASTER");
    }
}
