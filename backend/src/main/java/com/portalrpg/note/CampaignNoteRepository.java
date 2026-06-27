package com.portalrpg.note;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface CampaignNoteRepository extends JpaRepository<CampaignNote, UUID> {

    List<CampaignNote> findByCampaignIdOrderByUpdatedAtDesc(UUID campaignId);

    List<CampaignNote> findByCampaignIdAndAuthorIdOrderByUpdatedAtDesc(UUID campaignId, UUID authorId);
}
