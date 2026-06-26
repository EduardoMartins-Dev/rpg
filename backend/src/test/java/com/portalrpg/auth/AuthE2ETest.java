package com.portalrpg.auth;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portalrpg.support.E2ETestBase;
import com.portalrpg.support.SeedData;

import io.restassured.http.ContentType;

class AuthE2ETest extends E2ETestBase {

    private final ObjectMapper mapper = new ObjectMapper();

    /** E2E-AUTH-01 — registro → login (access+refresh); refresh renova. */
    @Test
    void registerThenLoginThenRefresh() {
        // register
        given().contentType(ContentType.JSON)
                .body("""
                      {"email":"novato@test","password":"Sup3rSenha!","displayName":"Novato"}
                      """)
                .when().post("/api/auth/register")
                .then().statusCode(201)
                .body("email", equalTo("novato@test"))
                .body("isAdmin", equalTo(false))
                .body("id", notNullValue());

        // login -> access + refresh
        var login = given().contentType(ContentType.JSON)
                .body("""
                      {"email":"novato@test","password":"Sup3rSenha!"}
                      """)
                .when().post("/api/auth/login")
                .then().statusCode(200)
                .body("accessToken", notNullValue())
                .body("refreshToken", notNullValue())
                .body("tokenType", equalTo("Bearer"))
                .extract();

        String access = login.path("accessToken");
        String refresh = login.path("refreshToken");

        // access works
        given().header("Authorization", "Bearer " + access)
                .when().get("/api/me")
                .then().statusCode(200).body("email", equalTo("novato@test"));

        // refresh renews -> new access works
        String newAccess = given().contentType(ContentType.JSON)
                .body(Map.of("refreshToken", refresh))
                .when().post("/api/auth/refresh")
                .then().statusCode(200)
                .body("accessToken", notNullValue())
                .extract().path("accessToken");

        given().header("Authorization", "Bearer " + newAccess)
                .when().get("/api/me")
                .then().statusCode(200).body("email", equalTo("novato@test"));
    }

    /** E2E-AUTH-02 — JWT carrega user_id+is_admin; NÃO carrega papel de campanha. */
    @Test
    void jwtCarriesUserIdAndAdminButNoCampaignRole() throws Exception {
        String access = tokenFor(SeedData.ADMIN);
        Map<String, Object> claims = decodePayload(access);

        assertThat(claims).containsKey("sub");          // user_id
        assertThat(claims).containsKey("is_admin");
        assertThat(claims.get("is_admin")).isEqualTo(true);

        // no campaign role leaked into the token
        assertThat(claims).doesNotContainKey("role");
        assertThat(claims).doesNotContainKey("campaign_id");
        assertThat(claims).doesNotContainKey("MASTER");
        assertThat(claims).doesNotContainKey("PLAYER");
    }

    /** E2E-AUTH-03 — token adulterado (flip is_admin) rejeitado. */
    @Test
    void tamperedTokenRejected() throws Exception {
        String access = tokenFor(SeedData.PLAYER1); // is_admin=false
        String[] parts = access.split("\\.");
        Map<String, Object> payload = decodePayload(access);

        // attacker flips is_admin -> true, re-encodes payload, keeps old signature
        payload.put("is_admin", true);
        String forgedPayload = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(mapper.writeValueAsBytes(payload));
        String forged = parts[0] + "." + forgedPayload + "." + parts[2];

        given().header("Authorization", "Bearer " + forged)
                .when().get("/api/me")
                .then().statusCode(401);
    }

    /** E2E-AUTH-04 — sem Authorization → 401. */
    @Test
    void missingAuthHeaderReturns401() {
        given().when().get("/api/me").then().statusCode(401);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> decodePayload(String jwt) throws Exception {
        String payload = jwt.split("\\.")[1];
        byte[] json = Base64.getUrlDecoder().decode(payload);
        return mapper.readValue(new String(json, StandardCharsets.UTF_8), Map.class);
    }
}
