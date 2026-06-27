package com.portalrpg.user;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.portalrpg.common.ApiException;
import com.portalrpg.security.AppPrincipal;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Gestão de usuários — exclusivo de admin. Lista contas, alterna o papel de admin
 * e remove contas. Salvaguardas: não rebaixar/excluir a si mesmo, nem remover o
 * último admin, e bloquear exclusão de quem ainda tem dados vinculados (FK).
 */
@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public AdminUserController(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    public record AdminUserView(UUID id, String email, String displayName, boolean admin, Instant createdAt) {
    }

    public record SetAdminRequest(@NotNull Boolean admin) {
    }

    public record CreateUserRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(max = 255) String displayName,
            @NotBlank @Size(min = 8, max = 255) String password,
            boolean admin) {
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AdminUserView create(@Valid @RequestBody CreateUserRequest req) {
        String email = req.email().trim().toLowerCase();
        if (users.existsByEmail(email)) {
            throw ApiException.conflict("email already in use");
        }
        User u = new User(email, encoder.encode(req.password()), req.displayName().trim(), req.admin());
        users.save(u);
        return new AdminUserView(u.getId(), u.getEmail(), u.getDisplayName(), u.isAdmin(), u.getCreatedAt());
    }

    @GetMapping
    public List<AdminUserView> list() {
        return users.findAll().stream()
                .sorted(Comparator.comparing(User::getEmail))
                .map(u -> new AdminUserView(u.getId(), u.getEmail(), u.getDisplayName(), u.isAdmin(), u.getCreatedAt()))
                .toList();
    }

    @PutMapping("/{id}/admin")
    public AdminUserView setAdmin(@PathVariable UUID id, @RequestBody SetAdminRequest req,
            @AuthenticationPrincipal AppPrincipal principal) {
        if (req == null || req.admin() == null) {
            throw ApiException.badRequest("admin flag is required");
        }
        User u = users.findById(id).orElseThrow(() -> ApiException.notFound("user not found"));
        if (u.getId().equals(principal.userId()) && !req.admin()) {
            throw ApiException.badRequest("you cannot remove your own admin role");
        }
        if (u.isAdmin() && !req.admin() && countAdmins() <= 1) {
            throw ApiException.badRequest("cannot remove the last admin");
        }
        u.setAdmin(req.admin());
        users.save(u);
        return new AdminUserView(u.getId(), u.getEmail(), u.getDisplayName(), u.isAdmin(), u.getCreatedAt());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal AppPrincipal principal) {
        User u = users.findById(id).orElseThrow(() -> ApiException.notFound("user not found"));
        if (u.getId().equals(principal.userId())) {
            throw ApiException.badRequest("you cannot delete your own account here");
        }
        if (u.isAdmin() && countAdmins() <= 1) {
            throw ApiException.badRequest("cannot delete the last admin");
        }
        try {
            users.delete(u);
            users.flush();
        } catch (DataIntegrityViolationException e) {
            throw ApiException.conflict("user has linked data (campaigns/characters); remove those first");
        }
    }

    private long countAdmins() {
        return users.findAll().stream().filter(User::isAdmin).count();
    }
}
