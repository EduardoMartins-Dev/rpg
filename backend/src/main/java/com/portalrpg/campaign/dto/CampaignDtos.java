package com.portalrpg.campaign.dto;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class CampaignDtos {

    private CampaignDtos() {
    }

    public record CreateCampaignRequest(
            @NotBlank @Size(max = 255) String name,
            @NotNull UUID systemId,
            String description) {
    }

    public record UpdateCampaignRequest(
            @NotBlank @Size(max = 255) String name,
            String description,
            @Size(max = 2048) String bannerUrl,
            @Size(max = 32) String theme) {
    }

    public record JoinRequest(
            @NotBlank String inviteCode) {
    }

    /** Includes the requesting user's role in this campaign (resolved per-request). */
    public record CampaignResponse(
            UUID id,
            String name,
            String description,
            UUID systemId,
            UUID masterId,
            String inviteCode,
            String bannerUrl,
            String theme,
            String role,
            Instant createdAt) {
    }

    public record InviteResponse(
            UUID campaignId,
            String inviteCode) {
    }

    public record MemberResponse(
            UUID userId,
            String email,
            String displayName,
            String role,
            Instant joinedAt) {
    }
}
