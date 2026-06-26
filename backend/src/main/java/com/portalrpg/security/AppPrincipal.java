package com.portalrpg.security;

import java.util.UUID;

/**
 * Authenticated principal resolved from the JWT. Carries ONLY user_id + is_admin.
 * Campaign roles (MASTER/PLAYER) are NOT here — they are resolved per-request
 * against campaign_members (see F3).
 */
public record AppPrincipal(UUID userId, boolean admin) {
}
