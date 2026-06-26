package com.portalrpg.campaign;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CampaignRepository extends JpaRepository<Campaign, UUID> {

    Optional<Campaign> findByInviteCode(String inviteCode);

    boolean existsByInviteCode(String inviteCode);
}
