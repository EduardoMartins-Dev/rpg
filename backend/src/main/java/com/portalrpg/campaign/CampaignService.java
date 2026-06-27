package com.portalrpg.campaign;

import java.security.SecureRandom;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.portalrpg.campaign.dto.CampaignDtos.CampaignResponse;
import com.portalrpg.campaign.dto.CampaignDtos.CreateCampaignRequest;
import com.portalrpg.campaign.dto.CampaignDtos.InviteResponse;
import com.portalrpg.campaign.dto.CampaignDtos.MemberResponse;
import com.portalrpg.campaign.dto.CampaignDtos.UpdateCampaignRequest;
import com.portalrpg.common.ApiException;
import com.portalrpg.system.RpgSystemRepository;
import com.portalrpg.user.User;
import com.portalrpg.user.UserRepository;

@Service
public class CampaignService {

    private static final SecureRandom RNG = new SecureRandom();
    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
    private static final int CODE_LEN = 8;

    private final CampaignRepository campaigns;
    private final CampaignMemberRepository members;
    private final RpgSystemRepository systems;
    private final UserRepository users;

    public CampaignService(CampaignRepository campaigns, CampaignMemberRepository members,
            RpgSystemRepository systems, UserRepository users) {
        this.campaigns = campaigns;
        this.members = members;
        this.systems = systems;
        this.users = users;
    }

    /**
     * Create campaign and insert the creator as MASTER in the SAME transaction
     * (E2E-CAMP-01). Rejects a missing/unknown system_id as a validation error (E2E-CAMP-02).
     */
    @Transactional
    public CampaignResponse create(CreateCampaignRequest req, UUID creator) {
        if (!systems.existsById(req.systemId())) {
            throw ApiException.badRequest("system not found");
        }
        Campaign c = new Campaign(req.name(), req.description(), req.systemId(), creator, generateInviteCode());
        campaigns.save(c);
        members.save(new CampaignMember(c.getId(), creator, CampaignRole.MASTER));
        return toResponse(c, CampaignRole.MASTER);
    }

    /** Campaigns where the user is a member, each tagged with that user's role. */
    @Transactional(readOnly = true)
    public List<CampaignResponse> listForUser(UUID userId) {
        return members.findByUserId(userId).stream()
                .map(m -> campaigns.findById(m.getCampaignId())
                        .map(c -> toResponse(c, m.getRole()))
                        .orElse(null))
                .filter(r -> r != null)
                .toList();
    }

    @Transactional(readOnly = true)
    public CampaignResponse get(UUID campaignId, UUID userId) {
        Campaign c = require(campaignId);
        return toResponse(c, roleOf(campaignId, userId));
    }

    @Transactional
    public CampaignResponse update(UUID campaignId, UpdateCampaignRequest req, UUID userId) {
        Campaign c = require(campaignId);
        c.setName(req.name());
        c.setDescription(req.description());
        c.setBannerUrl(blankToNull(req.bannerUrl()));
        c.setTheme(blankToNull(req.theme()));
        return toResponse(c, roleOf(campaignId, userId));
    }

    @Transactional
    public void delete(UUID campaignId) {
        require(campaignId);
        // campaign_members + characters cascade via FK ON DELETE CASCADE.
        campaigns.deleteById(campaignId);
    }

    @Transactional
    public InviteResponse regenerateInvite(UUID campaignId) {
        Campaign c = require(campaignId);
        c.setInviteCode(generateInviteCode());
        return new InviteResponse(c.getId(), c.getInviteCode());
    }

    /** Join via invite code → become PLAYER (E2E-PLAYER-01). Unknown code → error (E2E-PLAYER-02). */
    @Transactional
    public CampaignResponse join(String inviteCode, UUID userId) {
        Campaign c = campaigns.findByInviteCode(inviteCode)
                .orElseThrow(() -> ApiException.notFound("invalid invite code"));
        if (members.existsByCampaignIdAndUserId(c.getId(), userId)) {
            throw ApiException.conflict("already a member of this campaign");
        }
        members.save(new CampaignMember(c.getId(), userId, CampaignRole.PLAYER));
        return toResponse(c, CampaignRole.PLAYER);
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> listMembers(UUID campaignId) {
        require(campaignId);
        List<CampaignMember> rows = members.findByCampaignIdOrderByJoinedAtAsc(campaignId);
        Map<UUID, User> userById = users.findAllById(
                rows.stream().map(CampaignMember::getUserId).toList()).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
        return rows.stream().map(m -> {
            User u = userById.get(m.getUserId());
            return new MemberResponse(m.getUserId(),
                    u != null ? u.getEmail() : null,
                    u != null ? u.getDisplayName() : null,
                    m.getRole().name(), m.getJoinedAt());
        }).toList();
    }

    @Transactional
    public void removeMember(UUID campaignId, UUID targetUserId) {
        require(campaignId);
        CampaignMember m = members.findByCampaignIdAndUserId(campaignId, targetUserId)
                .orElseThrow(() -> ApiException.notFound("user is not a member of this campaign"));
        if (m.getRole() == CampaignRole.MASTER) {
            throw ApiException.badRequest("cannot remove the campaign master");
        }
        members.delete(m);
    }

    // --- helpers ---------------------------------------------------------

    private Campaign require(UUID id) {
        return campaigns.findById(id).orElseThrow(() -> ApiException.notFound("campaign not found"));
    }

    /** Role of the user in the campaign, or null if (somehow) not a member. */
    private CampaignRole roleOf(UUID campaignId, UUID userId) {
        return members.findByCampaignIdAndUserId(campaignId, userId)
                .map(CampaignMember::getRole).orElse(null);
    }

    private String generateInviteCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder sb = new StringBuilder(CODE_LEN);
            for (int i = 0; i < CODE_LEN; i++) {
                sb.append(CODE_ALPHABET.charAt(RNG.nextInt(CODE_ALPHABET.length())));
            }
            String code = sb.toString();
            if (!campaigns.existsByInviteCode(code)) {
                return code;
            }
        }
        throw new ApiException(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR,
                "could not generate a unique invite code");
    }

    private CampaignResponse toResponse(Campaign c, CampaignRole role) {
        return new CampaignResponse(c.getId(), c.getName(), c.getDescription(), c.getSystemId(),
                c.getMasterId(), c.getInviteCode(), c.getBannerUrl(), c.getTheme(),
                role != null ? role.name() : null, c.getCreatedAt());
    }

    private static String blankToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
