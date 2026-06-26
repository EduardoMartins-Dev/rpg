package com.portalrpg.user;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.portalrpg.auth.dto.AuthDtos.UserResponse;
import com.portalrpg.common.ApiException;
import com.portalrpg.security.AppPrincipal;

/** Current authenticated user. Protected — requires a valid access token. */
@RestController
@RequestMapping("/api")
public class MeController {

    private final UserRepository users;

    public MeController(UserRepository users) {
        this.users = users;
    }

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal AppPrincipal principal) {
        User u = users.findById(principal.userId())
                .orElseThrow(() -> ApiException.unauthorized("user no longer exists"));
        return new UserResponse(u.getId(), u.getEmail(), u.getDisplayName(), u.isAdmin());
    }
}
