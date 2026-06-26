package com.portalrpg.campaign;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CampaignMemberRepository extends JpaRepository<CampaignMember, UUID> {

    boolean existsByCampaignIdAndUserId(UUID campaignId, UUID userId);

    boolean existsByCampaignIdAndUserIdAndRole(UUID campaignId, UUID userId, CampaignRole role);

    Optional<CampaignMember> findByCampaignIdAndUserId(UUID campaignId, UUID userId);

    List<CampaignMember> findByCampaignIdOrderByJoinedAtAsc(UUID campaignId);

    List<CampaignMember> findByUserId(UUID userId);
}
