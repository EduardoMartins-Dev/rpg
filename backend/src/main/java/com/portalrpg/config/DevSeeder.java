package com.portalrpg.config;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.ApplicationArguments;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.portalrpg.user.User;
import com.portalrpg.user.UserRepository;

/**
 * Seed determinístico para o ambiente DEV (e p/ a suíte E2E de UI / Playwright).
 * Cria os usuários do prompt §8 de forma idempotente — só insere o que faltar.
 * NÃO roda em test (perfil test/default usa o seed do E2ETestBase).
 */
@Component
@Profile("dev")
public class DevSeeder implements ApplicationRunner {

    /** Mesma senha do seed de testes (prompt §8). Apenas DEV — nunca produção. */
    public static final String PASSWORD = "Sup3rSenha!";

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public DevSeeder(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        seed("admin@test", "Admin", true);
        seed("mestre@test", "Mestre", false);
        seed("player1@test", "Player One", false);
        seed("player2@test", "Player Two", false);
        seed("intruso@test", "Intruso", false);
    }

    private void seed(String email, String displayName, boolean admin) {
        if (users.existsByEmail(email)) {
            return;
        }
        users.save(new User(email, encoder.encode(PASSWORD), displayName, admin));
    }
}
