package com.portalrpg.board;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.portalrpg.board.BoardDtos.BoardItemRequest;
import com.portalrpg.board.BoardDtos.BoardItemResponse;
import com.portalrpg.common.ApiException;

@Service
public class BoardService {

    private final BoardItemRepository items;

    public BoardService(BoardItemRepository items) {
        this.items = items;
    }

    @Transactional(readOnly = true)
    public List<BoardItemResponse> list(UUID campaignId) {
        return items.findByCampaignIdOrderBySortOrderAscCreatedAtAsc(campaignId).stream()
                .map(BoardItemResponse::of)
                .toList();
    }

    @Transactional
    public BoardItemResponse create(UUID campaignId, BoardItemRequest req) {
        validateContent(req);
        int order = req.sortOrder() != null ? req.sortOrder() : (int) items.countByCampaignId(campaignId);
        BoardItem item = new BoardItem(campaignId, trim(req.title()), trim(req.body()),
                trim(req.imageUrl()), order);
        return BoardItemResponse.of(items.save(item));
    }

    @Transactional
    public BoardItemResponse update(UUID campaignId, UUID itemId, BoardItemRequest req) {
        validateContent(req);
        BoardItem item = load(campaignId, itemId);
        item.setTitle(trim(req.title()));
        item.setBody(trim(req.body()));
        item.setImageUrl(trim(req.imageUrl()));
        if (req.sortOrder() != null) {
            item.setSortOrder(req.sortOrder());
        }
        return BoardItemResponse.of(items.save(item));
    }

    @Transactional
    public void delete(UUID campaignId, UUID itemId) {
        items.delete(load(campaignId, itemId));
    }

    private BoardItem load(UUID campaignId, UUID itemId) {
        BoardItem item = items.findById(itemId).orElseThrow(() -> ApiException.notFound("board item not found"));
        if (!item.getCampaignId().equals(campaignId)) {
            throw ApiException.notFound("board item not found");
        }
        return item;
    }

    private void validateContent(BoardItemRequest req) {
        boolean empty = isBlank(req.title()) && isBlank(req.body()) && isBlank(req.imageUrl());
        if (empty) {
            throw ApiException.badRequest("informe um título, texto ou imagem");
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static String trim(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
