package com.portalrpg.campaign;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.portalrpg.campaign.dto.CampaignDtos.CampaignResponse;
import com.portalrpg.campaign.dto.CampaignDtos.CreateCampaignRequest;
import com.portalrpg.campaign.dto.CampaignDtos.InviteResponse;
import com.portalrpg.campaign.dto.CampaignDtos.JoinRequest;
import com.portalrpg.campaign.dto.CampaignDtos.MemberResponse;
import com.portalrpg.campaign.dto.CampaignDtos.UpdateCampaignRequest;
import com.portalrpg.security.AppPrincipal;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/campaigns")
public class CampaignController {

    private final CampaignService service;

    public CampaignController(CampaignService service) {
        this.service = service;
    }

    // --- create / list (any authenticated user) ---------------------------

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CampaignResponse create(@Valid @RequestBody CreateCampaignRequest req,
            @AuthenticationPrincipal AppPrincipal principal) {
        return service.create(req, principal.userId());
    }

    @GetMapping
    public List<CampaignResponse> list(@AuthenticationPrincipal AppPrincipal principal) {
        return service.listForUser(principal.userId());
    }

    @PostMapping("/join")
    public CampaignResponse join(@Valid @RequestBody JoinRequest req,
            @AuthenticationPrincipal AppPrincipal principal) {
        return service.join(req.inviteCode(), principal.userId());
    }

    // --- single campaign: must be a member (403 otherwise) ----------------

    @GetMapping("/{id}")
    @PreAuthorize("@campaignAccess.isMember(#id)")
    public CampaignResponse get(@PathVariable UUID id,
            @AuthenticationPrincipal AppPrincipal principal) {
        return service.get(id, principal.userId());
    }

    @GetMapping("/{id}/members")
    @PreAuthorize("@campaignAccess.isMember(#id)")
    public List<MemberResponse> members(@PathVariable UUID id) {
        return service.listMembers(id);
    }

    // --- MASTER-only management -------------------------------------------

    @PutMapping("/{id}")
    @PreAuthorize("@campaignAccess.hasRole(#id, 'MASTER')")
    public CampaignResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateCampaignRequest req,
            @AuthenticationPrincipal AppPrincipal principal) {
        return service.update(id, req, principal.userId());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@campaignAccess.hasRole(#id, 'MASTER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }

    @PostMapping("/{id}/invite")
    @PreAuthorize("@campaignAccess.hasRole(#id, 'MASTER')")
    public InviteResponse invite(@PathVariable UUID id) {
        return service.regenerateInvite(id);
    }

    @DeleteMapping("/{id}/members/{userId}")
    @PreAuthorize("@campaignAccess.hasRole(#id, 'MASTER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(@PathVariable UUID id, @PathVariable UUID userId) {
        service.removeMember(id, userId);
    }
}
