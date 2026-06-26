package com.portalrpg.auth;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.portalrpg.auth.dto.AuthDtos.LoginRequest;
import com.portalrpg.auth.dto.AuthDtos.RegisterRequest;
import com.portalrpg.auth.dto.AuthDtos.TokenResponse;
import com.portalrpg.auth.dto.AuthDtos.UserResponse;
import com.portalrpg.common.ApiException;
import com.portalrpg.security.JwtService;
import com.portalrpg.user.User;
import com.portalrpg.user.UserRepository;

import io.jsonwebtoken.Claims;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @Transactional
    public UserResponse register(RegisterRequest req) {
        String email = req.email().toLowerCase();
        if (users.existsByEmail(email)) {
            throw ApiException.conflict("email already registered");
        }
        // New users are never admin via self-registration.
        User user = new User(email, encoder.encode(req.password()), req.displayName(), false);
        users.save(user);
        return toUserResponse(user);
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest req) {
        User user = users.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> ApiException.unauthorized("invalid credentials"));
        if (!encoder.matches(req.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("invalid credentials");
        }
        return issueTokens(user);
    }

    @Transactional(readOnly = true)
    public TokenResponse refresh(String refreshToken) {
        Claims claims;
        try {
            claims = jwt.parse(refreshToken);
        } catch (Exception e) {
            throw ApiException.unauthorized("invalid refresh token");
        }
        if (!jwt.isRefresh(claims)) {
            throw ApiException.unauthorized("not a refresh token");
        }
        // Reload to reflect current is_admin (authoritative source = DB, not the token).
        User user = users.findById(jwt.toPrincipal(claims).userId())
                .orElseThrow(() -> ApiException.unauthorized("user no longer exists"));
        return issueTokens(user);
    }

    private TokenResponse issueTokens(User user) {
        String access = jwt.generateAccessToken(user.getId(), user.isAdmin());
        String refresh = jwt.generateRefreshToken(user.getId(), user.isAdmin());
        return new TokenResponse(access, refresh, "Bearer", jwt.getAccessTtlSeconds());
    }

    private UserResponse toUserResponse(User u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getDisplayName(), u.isAdmin());
    }
}
