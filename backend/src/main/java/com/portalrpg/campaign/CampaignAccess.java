package com.portalrpg.campaign;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import com.portalrpg.security.AppPrincipal;

/**
 * Authorization guard used in {@code @PreAuthorize}. The MASTER/PLAYER role is NEVER
 * carried in the JWT — it is resolved here, per-request, against campaign_members.
 * The same user can be MASTER in one campaign and PLAYER in another (E2E-AUTHZ-03).
 */
@Component("campaignAccess")
public class CampaignAccess {

    private final CampaignMemberRepository members;

    public CampaignAccess(CampaignMemberRepository members) {
        this.members = members;
    }

    /** True if the current user is any member (MASTER or PLAYER) of the campaign. */
    public boolean isMember(UUID campaignId) {
        UUID uid = currentUserId();
        return uid != null && members.existsByCampaignIdAndUserId(campaignId, uid);
    }

    /** True if the current user holds the given role in the campaign. */
    public boolean hasRole(UUID campaignId, String role) {
        UUID uid = currentUserId();
        if (uid == null) {
            return false;
        }
        return members.existsByCampaignIdAndUserIdAndRole(campaignId, uid, CampaignRole.valueOf(role));
    }

    private UUID currentUserId() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a != null && a.getPrincipal() instanceof AppPrincipal p) {
            return p.userId();
        }
        return null;
    }
}
