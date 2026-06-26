package com.portalrpg.character;

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

import com.portalrpg.character.dto.CharacterDtos.CharacterResponse;
import com.portalrpg.character.dto.CharacterDtos.CreateCharacterRequest;
import com.portalrpg.character.dto.CharacterDtos.UpdateCharacterRequest;
import com.portalrpg.security.AppPrincipal;

import jakarta.validation.Valid;

/**
 * Fichas dentro de uma campanha. Todo acesso exige ser membro da campanha
 * (@campaignAccess.isMember → 403 p/ não-membro). O refinamento dono-vs-MASTER
 * (E2E-AUTHZ-01) é resolvido no serviço.
 */
@RestController
@RequestMapping("/api/campaigns/{id}/characters")
@PreAuthorize("@campaignAccess.isMember(#id)")
public class CharacterController {

    private final CharacterService service;

    public CharacterController(CharacterService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CharacterResponse create(@PathVariable UUID id,
            @Valid @RequestBody CreateCharacterRequest req,
            @AuthenticationPrincipal AppPrincipal principal) {
        return service.create(id, principal.userId(), req);
    }

    @GetMapping
    public List<CharacterResponse> list(@PathVariable UUID id,
            @AuthenticationPrincipal AppPrincipal principal) {
        return service.list(id, principal.userId());
    }

    @GetMapping("/{charId}")
    public CharacterResponse get(@PathVariable UUID id, @PathVariable UUID charId,
            @AuthenticationPrincipal AppPrincipal principal) {
        return service.get(id, charId, principal.userId());
    }

    @PutMapping("/{charId}")
    public CharacterResponse update(@PathVariable UUID id, @PathVariable UUID charId,
            @Valid @RequestBody UpdateCharacterRequest req,
            @AuthenticationPrincipal AppPrincipal principal) {
        return service.update(id, charId, req, principal.userId());
    }

    @DeleteMapping("/{charId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @PathVariable UUID charId,
            @AuthenticationPrincipal AppPrincipal principal) {
        service.delete(id, charId, principal.userId());
    }
}
