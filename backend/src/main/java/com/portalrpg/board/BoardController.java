package com.portalrpg.board;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.portalrpg.board.BoardDtos.BoardItemRequest;
import com.portalrpg.board.BoardDtos.BoardItemResponse;

import jakarta.validation.Valid;

/**
 * Mural da campanha. Leitura para qualquer membro; escrita só para o MASTER —
 * mesmas salvaguardas de papel resolvidas por requisição (@campaignAccess).
 */
@RestController
@RequestMapping("/api/campaigns/{id}/board")
public class BoardController {

    private final BoardService service;

    public BoardController(BoardService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@campaignAccess.isMember(#id)")
    public List<BoardItemResponse> list(@PathVariable UUID id) {
        return service.list(id);
    }

    @PostMapping
    @PreAuthorize("@campaignAccess.hasRole(#id, 'MASTER')")
    @ResponseStatus(HttpStatus.CREATED)
    public BoardItemResponse create(@PathVariable UUID id, @Valid @RequestBody BoardItemRequest req) {
        return service.create(id, req);
    }

    @PutMapping("/{itemId}")
    @PreAuthorize("@campaignAccess.hasRole(#id, 'MASTER')")
    public BoardItemResponse update(@PathVariable UUID id, @PathVariable UUID itemId,
            @Valid @RequestBody BoardItemRequest req) {
        return service.update(id, itemId, req);
    }

    @DeleteMapping("/{itemId}")
    @PreAuthorize("@campaignAccess.hasRole(#id, 'MASTER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @PathVariable UUID itemId) {
        service.delete(id, itemId);
    }
}
