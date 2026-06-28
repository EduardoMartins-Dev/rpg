package com.portalrpg.ai;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AiConversationRepository extends JpaRepository<AiConversation, UUID> {

    List<AiConversation> findByCampaignIdAndUserIdOrderByUpdatedAtDesc(UUID campaignId, UUID userId);

    Optional<AiConversation> findByIdAndCampaignIdAndUserId(UUID id, UUID campaignId, UUID userId);
}
