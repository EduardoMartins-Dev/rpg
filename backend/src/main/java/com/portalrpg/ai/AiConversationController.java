package com.portalrpg.ai;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portalrpg.ai.AiDtos.ConversationDetail;
import com.portalrpg.ai.AiDtos.ConversationSummary;
import com.portalrpg.ai.AiDtos.SendMessageRequest;
import com.portalrpg.ai.AiDtos.SendMessageResponse;
import com.portalrpg.security.AppPrincipal;

import jakarta.validation.Valid;

/**
 * Chat com IA por conversa (contexto), estilo ChatGPT. Escopado à campanha (exige ser
 * membro) e ao usuário autenticado — cada um vê só as próprias conversas.
 */
@RestController
@RequestMapping("/api/campaigns/{id}/ai/conversations")
@PreAuthorize("@campaignAccess.isMember(#id)")
public class AiConversationController {

    private final AiChatService service;

    public AiConversationController(AiChatService service) {
        this.service = service;
    }

    @GetMapping
    public List<ConversationSummary> list(@PathVariable UUID id,
            @AuthenticationPrincipal AppPrincipal principal) {
        return service.list(id, principal.userId());
    }

    @PostMapping
    public ConversationSummary create(@PathVariable UUID id,
            @AuthenticationPrincipal AppPrincipal principal) {
        return service.create(id, principal.userId());
    }

    @GetMapping("/{conversationId}")
    public ConversationDetail get(@PathVariable UUID id, @PathVariable UUID conversationId,
            @AuthenticationPrincipal AppPrincipal principal) {
        return service.get(id, principal.userId(), conversationId);
    }

    @PostMapping("/{conversationId}/messages")
    public SendMessageResponse send(@PathVariable UUID id, @PathVariable UUID conversationId,
            @Valid @RequestBody SendMessageRequest req,
            @AuthenticationPrincipal AppPrincipal principal) {
        return service.send(id, principal.userId(), conversationId, req.question());
    }

    @DeleteMapping("/{conversationId}")
    public void delete(@PathVariable UUID id, @PathVariable UUID conversationId,
            @AuthenticationPrincipal AppPrincipal principal) {
        service.delete(id, principal.userId(), conversationId);
    }
}
