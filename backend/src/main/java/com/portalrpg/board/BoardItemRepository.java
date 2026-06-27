package com.portalrpg.board;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BoardItemRepository extends JpaRepository<BoardItem, UUID> {

    List<BoardItem> findByCampaignIdOrderBySortOrderAscCreatedAtAsc(UUID campaignId);

    long countByCampaignId(UUID campaignId);
}
