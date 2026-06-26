package com.portalrpg.campaign;

/** Contextual role within a campaign. Never stored in the JWT — resolved per-request. */
public enum CampaignRole {
    MASTER,
    PLAYER
}
