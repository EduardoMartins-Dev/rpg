package com.portalrpg.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.portalrpg.user.User;
import com.portalrpg.user.UserRepository;

/**
 * Bootstrap do admin inicial em PRODUÇÃO. Cria o admin a partir de ADMIN_EMAIL/
 * ADMIN_PASSWORD se (e somente se) ainda não existir — idempotente, sem credencial
 * no código. Se as variáveis não forem definidas, não faz nada (loga aviso).
 * Só roda no perfil prod.
 */
@Component
@Profile("prod")
public class ProdSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProdSeeder.class);

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String adminEmail;
    private final String adminPassword;
    private final String adminName;

    public ProdSeeder(UserRepository users, PasswordEncoder encoder,
            @Value("${app.bootstrap.admin-email:}") String adminEmail,
            @Value("${app.bootstrap.admin-password:}") String adminPassword,
            @Value("${app.bootstrap.admin-name:Admin}") String adminName) {
        this.users = users;
        this.encoder = encoder;
        this.adminEmail = adminEmail;
        this.adminPassword = adminPassword;
        this.adminName = adminName;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (adminEmail.isBlank() || adminPassword.isBlank()) {
            log.warn("prod admin bootstrap skipped: set ADMIN_EMAIL and ADMIN_PASSWORD to create the initial admin");
            return;
        }
        if (users.existsByEmail(adminEmail)) {
            log.info("prod admin bootstrap: admin '{}' already exists, nothing to do", adminEmail);
            return;
        }
        users.save(new User(adminEmail, encoder.encode(adminPassword), adminName, true));
        log.info("prod admin bootstrap: created admin '{}'", adminEmail);
    }
}
