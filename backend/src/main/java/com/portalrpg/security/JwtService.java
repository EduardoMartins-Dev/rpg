package com.portalrpg.security;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/**
 * Issues and validates JWTs. Tokens carry only user_id (subject) + is_admin.
 * Token type ("access"/"refresh") is a claim so a refresh token cannot be used
 * as an access token. HMAC-SHA256 signature: any tamper (e.g. flipping is_admin)
 * invalidates the signature and the token is rejected.
 */
@Service
public class JwtService {

    public static final String CLAIM_ADMIN = "is_admin";
    public static final String CLAIM_TYPE = "type";
    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    private final SecretKey key;
    private final long accessTtlMinutes;
    private final long refreshTtlDays;

    public JwtService(JwtProperties props) {
        byte[] secretBytes = props.getSecret().getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalStateException("app.jwt.secret must be at least 32 bytes for HS256");
        }
        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.accessTtlMinutes = props.getAccessTtlMinutes();
        this.refreshTtlDays = props.getRefreshTtlDays();
    }

    public String generateAccessToken(UUID userId, boolean admin) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim(CLAIM_ADMIN, admin)
                .claim(CLAIM_TYPE, TYPE_ACCESS)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTtlMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    public String generateRefreshToken(UUID userId, boolean admin) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim(CLAIM_ADMIN, admin)
                .claim(CLAIM_TYPE, TYPE_REFRESH)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(refreshTtlDays, ChronoUnit.DAYS)))
                .signWith(key)
                .compact();
    }

    public long getAccessTtlSeconds() {
        return accessTtlMinutes * 60;
    }

    /** Parses + verifies signature/expiry. Throws JwtException if invalid. */
    public Claims parse(String token) {
        Jws<Claims> jws = Jwts.parser().verifyWith(key).build().parseSignedClaims(token);
        return jws.getPayload();
    }

    public AppPrincipal toPrincipal(Claims claims) {
        UUID userId = UUID.fromString(claims.getSubject());
        boolean admin = Boolean.TRUE.equals(claims.get(CLAIM_ADMIN, Boolean.class));
        return new AppPrincipal(userId, admin);
    }

    public boolean isRefresh(Claims claims) {
        return TYPE_REFRESH.equals(claims.get(CLAIM_TYPE, String.class));
    }

    public boolean isAccess(Claims claims) {
        return TYPE_ACCESS.equals(claims.get(CLAIM_TYPE, String.class));
    }

    public static boolean isJwtException(Exception e) {
        return e instanceof JwtException;
    }
}
