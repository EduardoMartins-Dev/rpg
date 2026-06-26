package com.portalrpg.character;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CharacterRepository extends JpaRepository<Character, UUID> {

    List<Character> findByCampaignIdOrderByCreatedAtAsc(UUID campaignId);

    List<Character> findByCampaignIdAndPlayerIdOrderByCreatedAtAsc(UUID campaignId, UUID playerId);
}
