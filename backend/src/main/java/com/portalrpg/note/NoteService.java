package com.portalrpg.note;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.portalrpg.common.ApiException;
import com.portalrpg.note.NoteDtos.NoteRequest;
import com.portalrpg.note.NoteDtos.NoteResponse;
import com.portalrpg.user.User;
import com.portalrpg.user.UserRepository;

/**
 * Anotações de campanha. Jogador enxerga/gerencia só as suas; mestre enxerga
 * todas e pode editar/excluir qualquer uma. O papel é resolvido por requisição
 * e passado como {@code master} pelo controller.
 */
@Service
public class NoteService {

    private final CampaignNoteRepository notes;
    private final UserRepository users;

    public NoteService(CampaignNoteRepository notes, UserRepository users) {
        this.notes = notes;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> list(UUID campaignId, UUID userId, boolean master) {
        List<CampaignNote> rows = master
                ? notes.findByCampaignIdOrderByUpdatedAtDesc(campaignId)
                : notes.findByCampaignIdAndAuthorIdOrderByUpdatedAtDesc(campaignId, userId);
        Map<UUID, User> byId = users.findAllById(
                rows.stream().map(CampaignNote::getAuthorId).distinct().toList()).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        return rows.stream().map(n -> toResponse(n, byId.get(n.getAuthorId()), userId, master)).toList();
    }

    @Transactional
    public NoteResponse create(UUID campaignId, UUID userId, boolean master, NoteRequest req) {
        CampaignNote n = new CampaignNote(campaignId, userId, trim(req.title()), req.body());
        notes.save(n);
        return toResponse(n, users.findById(userId).orElse(null), userId, master);
    }

    @Transactional
    public NoteResponse update(UUID campaignId, UUID noteId, UUID userId, boolean master, NoteRequest req) {
        CampaignNote n = load(campaignId, noteId);
        requireWriter(n, userId, master);
        n.setTitle(trim(req.title()));
        n.setBody(req.body());
        notes.save(n);
        return toResponse(n, users.findById(n.getAuthorId()).orElse(null), userId, master);
    }

    @Transactional
    public void delete(UUID campaignId, UUID noteId, UUID userId, boolean master) {
        CampaignNote n = load(campaignId, noteId);
        requireWriter(n, userId, master);
        notes.delete(n);
    }

    private CampaignNote load(UUID campaignId, UUID noteId) {
        CampaignNote n = notes.findById(noteId).orElseThrow(() -> ApiException.notFound("note not found"));
        if (!n.getCampaignId().equals(campaignId)) {
            throw ApiException.notFound("note not found");
        }
        return n;
    }

    /** Autor da nota OU mestre da campanha podem alterar/excluir. */
    private void requireWriter(CampaignNote n, UUID userId, boolean master) {
        if (!master && !n.getAuthorId().equals(userId)) {
            throw ApiException.forbidden("you can only change your own notes");
        }
    }

    private NoteResponse toResponse(CampaignNote n, User author, UUID userId, boolean master) {
        boolean canEdit = master || n.getAuthorId().equals(userId);
        return new NoteResponse(n.getId(), n.getAuthorId(),
                author != null ? author.getDisplayName() : "—",
                n.getTitle(), n.getBody(), canEdit, n.getCreatedAt(), n.getUpdatedAt());
    }

    private static String trim(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
