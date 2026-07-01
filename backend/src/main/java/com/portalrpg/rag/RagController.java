package com.portalrpg.rag;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portalrpg.rag.dto.RagDtos.AskRequest;
import com.portalrpg.rag.dto.RagDtos.AskResponse;
import com.portalrpg.rag.dto.RagDtos.PowerTextResponse;

import jakarta.validation.Valid;

/**
 * IA escopada à campanha. Exige ser membro (papel resolvido por campanha). A consulta
 * filtra o retrieval pelo system_id da campanha — isolamento entre sistemas.
 */
@RestController
@RequestMapping("/api/campaigns/{id}")
@PreAuthorize("@campaignAccess.isMember(#id)")
public class RagController {

    private final RagQueryService service;

    public RagController(RagQueryService service) {
        this.service = service;
    }

    @PostMapping("/ai/ask")
    public AskResponse ask(@PathVariable UUID id, @Valid @RequestBody AskRequest req) {
        return service.ask(id, req.question());
    }

    /** E2E-SHEET-13 — texto integral do poder de disciplina (do PDF indexado do sistema). */
    @GetMapping("/disciplines/{power}")
    public PowerTextResponse powerText(@PathVariable UUID id, @PathVariable String power) {
        return service.powerText(id, power);
    }

    /** Informação COMPLETA do poder, traduzida e organizada em PT-BR a partir do trecho do livro.
     *  `text` vem null quando o poder não está no índice — o front usa a descrição do catálogo. */
    @GetMapping("/disciplines/{power}/explicacao")
    public PowerTextResponse powerExplained(@PathVariable UUID id, @PathVariable String power) {
        return service.powerExplained(id, power);
    }
}
