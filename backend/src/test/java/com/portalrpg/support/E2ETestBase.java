package com.portalrpg.support;

import static io.restassured.RestAssured.given;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.portalrpg.AbstractIntegrationTest;
import com.portalrpg.user.User;
import com.portalrpg.user.UserRepository;

import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import io.restassured.specification.RequestSpecification;

/**
 * Base for HTTP E2E tests. Resets + seeds deterministic users before each test
 * (idempotent: running the suite twice yields the same state). Provides RestAssured
 * helpers for login and authenticated requests.
 */
public abstract class E2ETestBase extends AbstractIntegrationTest {

    @LocalServerPort
    protected int port;

    @Autowired
    protected UserRepository users;

    @Autowired
    protected PasswordEncoder encoder;

    @Autowired
    protected JdbcTemplate jdbc;

    @BeforeEach
    void resetAndSeed() {
        RestAssured.port = port;
        resetDatabase();
        seedUsers();
    }

    /** Idempotent full wipe (FK-safe via CASCADE). Keeps Flyway schema intact. */
    protected void resetDatabase() {
        jdbc.execute("""
            TRUNCATE TABLE characters, campaign_members, campaigns, document_chunks,
                           system_documents, system_sheet_schema, rpg_systems, users
            RESTART IDENTITY CASCADE
            """);
    }

    protected void seedUsers() {
        save(SeedData.ADMIN, "Admin", true);
        save(SeedData.MESTRE, "Mestre", false);
        save(SeedData.PLAYER1, "Player One", false);
        save(SeedData.PLAYER2, "Player Two", false);
        save(SeedData.INTRUSO, "Intruso", false);
    }

    protected User save(String email, String displayName, boolean admin) {
        return users.save(new User(email, encoder.encode(SeedData.PASSWORD), displayName, admin));
    }

    // --- helpers ---------------------------------------------------------

    protected String login(String email, String password) {
        return given()
                .contentType(ContentType.JSON)
                .body("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}")
                .when().post("/api/auth/login")
                .then().statusCode(200)
                .extract().path("accessToken");
    }

    /** Access token for a seeded user (default password). */
    protected String tokenFor(String email) {
        return login(email, SeedData.PASSWORD);
    }

    protected RequestSpecification asUser(String email) {
        return given().header("Authorization", "Bearer " + tokenFor(email)).contentType(ContentType.JSON);
    }

    protected RequestSpecification withToken(String accessToken) {
        return given().header("Authorization", "Bearer " + accessToken).contentType(ContentType.JSON);
    }
}
