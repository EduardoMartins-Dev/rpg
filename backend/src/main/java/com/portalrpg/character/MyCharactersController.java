package com.portalrpg.character;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portalrpg.campaign.Campaign;
import com.portalrpg.campaign.CampaignRepository;
import com.portalrpg.security.AppPrincipal;
import com.portalrpg.system.RpgSystem;
import com.portalrpg.system.RpgSystemRepository;

/**
 * Todos os personagens do usuário autenticado, em todas as campanhas, com nome da
 * campanha e do sistema (pra agrupar por sistema no front). Só os DELE.
 */
@RestController
@RequestMapping("/api/me")
public class MyCharactersController {

    public record MyCharacterView(UUID id, String name, UUID campaignId, String campaignName,
            UUID systemId, String systemName) {
    }

    private final CharacterRepository characters;
    private final CampaignRepository campaigns;
    private final RpgSystemRepository systems;

    public MyCharactersController(CharacterRepository characters, CampaignRepository campaigns,
            RpgSystemRepository systems) {
        this.characters = characters;
        this.campaigns = campaigns;
        this.systems = systems;
    }

    @GetMapping("/characters")
    public List<MyCharacterView> myCharacters(@AuthenticationPrincipal AppPrincipal principal) {
        List<Character> mine = characters.findByPlayerIdOrderByCreatedAtAsc(principal.userId());
        if (mine.isEmpty()) {
            return List.of();
        }

        Map<UUID, Campaign> campById = campaigns.findAllById(
                mine.stream().map(Character::getCampaignId).distinct().toList()).stream()
                .collect(Collectors.toMap(Campaign::getId, Function.identity()));

        Map<UUID, RpgSystem> sysById = systems.findAllById(
                campById.values().stream().map(Campaign::getSystemId).distinct().toList()).stream()
                .collect(Collectors.toMap(RpgSystem::getId, Function.identity()));

        return mine.stream().map(ch -> {
            Campaign c = campById.get(ch.getCampaignId());
            RpgSystem s = c == null ? null : sysById.get(c.getSystemId());
            return new MyCharacterView(
                    ch.getId(), ch.getName(),
                    ch.getCampaignId(), c == null ? "—" : c.getName(),
                    s == null ? null : s.getId(), s == null ? "—" : s.getName());
        }).toList();
    }
}
