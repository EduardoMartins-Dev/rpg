package com.portalrpg.auth;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.portalrpg.auth.dto.AuthDtos.LoginRequest;
import com.portalrpg.auth.dto.AuthDtos.RefreshRequest;
import com.portalrpg.auth.dto.AuthDtos.RegisterRequest;
import com.portalrpg.auth.dto.AuthDtos.TokenResponse;
import com.portalrpg.auth.dto.AuthDtos.UserResponse;
import com.portalrpg.common.ApiException;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    /** Quando false, novos cadastros são bloqueados (só usuários existentes logam). */
    @Value("${app.auth.registration-enabled:true}")
    private boolean registrationEnabled;

    public AuthController(AuthService auth) {
        this.auth = auth;
    }

    @GetMapping("/config")
    public Map<String, Boolean> config() {
        return Map.of("registrationEnabled", registrationEnabled);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest req) {
        if (!registrationEnabled) {
            throw ApiException.forbidden("registration is disabled");
        }
        return auth.register(req);
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest req) {
        return auth.login(req);
    }

    @PostMapping("/refresh")
    public TokenResponse refresh(@Valid @RequestBody RefreshRequest req) {
        return auth.refresh(req.refreshToken());
    }
}
