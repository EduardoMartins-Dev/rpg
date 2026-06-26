package com.portalrpg;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

import io.restassured.RestAssured;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.web.server.LocalServerPort;

/** F0 acceptance: context loads against pgvector, Flyway migrates, ping responds. */
class BackendApplicationTests extends AbstractIntegrationTest {

    @LocalServerPort
    int port;

    @Test
    void contextLoadsAndPingResponds() {
        RestAssured.port = port;
        given()
            .when().get("/api/ping")
            .then().statusCode(200)
            .body("status", equalTo("ok"))
            .body("service", equalTo("portal-rpg"));
    }
}
