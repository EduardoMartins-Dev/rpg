package com.portalrpg.character;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.portalrpg.campaign.Campaign;
import com.portalrpg.campaign.CampaignMemberRepository;
import com.portalrpg.campaign.CampaignRepository;
import com.portalrpg.campaign.CampaignRole;
import com.portalrpg.character.dto.CharacterDtos.CharacterResponse;
import com.portalrpg.character.dto.CharacterDtos.CreateCharacterRequest;
import com.portalrpg.character.dto.CharacterDtos.UpdateCharacterRequest;
import com.portalrpg.common.ApiException;
import com.portalrpg.system.SystemSheetSchema;
import com.portalrpg.system.SystemSheetSchemaRepository;

@Service
public class CharacterService {

    private final CharacterRepository characters;
    private final CampaignRepository campaigns;
    private final CampaignMemberRepository members;
    private final SystemSheetSchemaRepository schemas;
    private final V5SheetProcessor processor;

    public CharacterService(CharacterRepository characters, CampaignRepository campaigns,
            CampaignMemberRepository members, SystemSheetSchemaRepository schemas, V5SheetProcessor processor) {
        this.characters = characters;
        this.campaigns = campaigns;
        this.members = members;
        this.schemas = schemas;
        this.processor = processor;
    }

    /** E2E-PLAYER-03 — cria ficha conforme o sheet-schema do sistema da campanha. */
    @Transactional
    public CharacterResponse create(UUID campaignId, UUID playerId, CreateCharacterRequest req) {
        Campaign campaign = requireCampaign(campaignId);
        JsonNode enriched = processor.process(req.sheetData(), schemaFor(campaign));
        Character c = new Character(campaignId, playerId, req.name(), enriched);
        characters.save(c);
        return toResponse(c);
    }

    /** E2E-AUTHZ-01 — MASTER vê todas as fichas; PLAYER só a própria. */
    @Transactional(readOnly = true)
    public List<CharacterResponse> list(UUID campaignId, UUID userId) {
        requireCampaign(campaignId);
        List<Character> rows = isMaster(campaignId, userId)
                ? characters.findByCampaignIdOrderByCreatedAtAsc(campaignId)
                : characters.findByCampaignIdAndPlayerIdOrderByCreatedAtAsc(campaignId, userId);
        return rows.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CharacterResponse get(UUID campaignId, UUID charId, UUID userId) {
        return toResponse(requireAccessible(campaignId, charId, userId));
    }

    @Transactional
    public CharacterResponse update(UUID campaignId, UUID charId, UpdateCharacterRequest req, UUID userId) {
        Character c = requireAccessible(campaignId, charId, userId);
        Campaign campaign = requireCampaign(campaignId);
        c.setName(req.name());
        c.setSheetData(processor.process(req.sheetData(), schemaFor(campaign)));
        return toResponse(c);
    }

    @Transactional
    public void delete(UUID campaignId, UUID charId, UUID userId) {
        Character c = requireAccessible(campaignId, charId, userId);
        characters.delete(c);
    }

    // --- helpers ---------------------------------------------------------

    private Campaign requireCampaign(UUID campaignId) {
        return campaigns.findById(campaignId)
                .orElseThrow(() -> ApiException.notFound("campaign not found"));
    }

    private JsonNode schemaFor(Campaign campaign) {
        SystemSheetSchema sc = schemas.findBySystemId(campaign.getSystemId())
                .orElseThrow(() -> ApiException.badRequest("system has no sheet-schema defined"));
        return sc.getSchema();
    }

    private boolean isMaster(UUID campaignId, UUID userId) {
        return members.existsByCampaignIdAndUserIdAndRole(campaignId, userId, CampaignRole.MASTER);
    }

    /** Acesso a UMA ficha: dono OU MASTER da campanha (caso contrário 403). */
    private Character requireAccessible(UUID campaignId, UUID charId, UUID userId) {
        Character c = characters.findById(charId)
                .orElseThrow(() -> ApiException.notFound("character not found"));
        if (!c.getCampaignId().equals(campaignId)) {
            throw ApiException.notFound("character not found in this campaign");
        }
        if (!c.getPlayerId().equals(userId) && !isMaster(campaignId, userId)) {
            throw ApiException.forbidden("not allowed to access this character");
        }
        return c;
    }

    private CharacterResponse toResponse(Character c) {
        return new CharacterResponse(c.getId(), c.getCampaignId(), c.getPlayerId(),
                c.getName(), c.getSheetData(), c.getCreatedAt());
    }
}
