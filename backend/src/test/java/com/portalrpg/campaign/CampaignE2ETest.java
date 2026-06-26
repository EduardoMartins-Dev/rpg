package com.portalrpg.campaign;

import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;

import org.junit.jupiter.api.Test;

import com.portalrpg.support.E2ETestBase;
import com.portalrpg.support.SeedData;

/**
 * F3 — Campanhas + Authz. Cobre E2E-CAMP-01/02, E2E-PLAYER-01/02 e
 * E2E-AUTHZ-02/03/04. (AUTHZ-01 — listagem de fichas por papel — fecha junto da F4,
 * pois mexe em characters; aqui validamos toda a authz de membro/papel por campanha.)
 */
class CampaignE2ETest extends E2ETestBase {

    /** Cria um sistema (admin) e devolve o id. */
    private String createSystem(String slug) {
        return asUser(SeedData.ADMIN)
                .body("{\"name\":\"" + slug + "\",\"slug\":\"" + slug + "\",\"description\":\"x\"}")
                .when().post("/api/systems")
                .then().statusCode(201)
                .extract().path("id");
    }

    /** Mestre cria campanha no sistema dado; devolve {id, inviteCode}. */
    private String[] createCampaign(String master, String name, String systemId) {
        io.restassured.path.json.JsonPath jp = asUser(master)
                .body("{\"name\":\"" + name + "\",\"systemId\":\"" + systemId + "\",\"description\":\"d\"}")
                .when().post("/api/campaigns")
                .then().statusCode(201)
                .body("role", equalTo("MASTER"))
                .body("masterId", notNullValue())
                .body("inviteCode", notNullValue())
                .extract().jsonPath();
        return new String[] { jp.getString("id"), jp.getString("inviteCode") };
    }

    /** E2E-CAMP-01 — mestre cria campanha V5 → vira MASTER na mesma transação; recebe invite_code. */
    @Test
    void masterCreatesCampaignBecomesMasterSameTransaction() {
        String systemId = createSystem("vampiro-v5");
        String[] camp = createCampaign(SeedData.MESTRE, "Noites de Sangue", systemId);
        String campaignId = camp[0];

        // o criador é MASTER, resolvido por campanha (não via JWT)
        asUser(SeedData.MESTRE).when().get("/api/campaigns/" + campaignId)
                .then().statusCode(200)
                .body("role", equalTo("MASTER"))
                .body("systemId", equalTo(systemId));

        // aparece em "minhas campanhas"
        asUser(SeedData.MESTRE).when().get("/api/campaigns")
                .then().statusCode(200)
                .body("id", hasItem(campaignId))
                .body("find { it.id == '" + campaignId + "' }.role", equalTo("MASTER"));

        // e já consta como membro MASTER na mesma transação
        asUser(SeedData.MESTRE).when().get("/api/campaigns/" + campaignId + "/members")
                .then().statusCode(200)
                .body("findAll { it.role == 'MASTER' }.email", hasItem(SeedData.MESTRE));
    }

    /** E2E-CAMP-02 — campanha sem system_id válido → erro de validação. */
    @Test
    void createCampaignWithInvalidSystemFails() {
        // systemId ausente → 400 (bean validation)
        asUser(SeedData.MESTRE)
                .body("{\"name\":\"Sem sistema\",\"description\":\"x\"}")
                .when().post("/api/campaigns")
                .then().statusCode(400);

        // systemId inexistente → 400 (validação de negócio)
        asUser(SeedData.MESTRE)
                .body("{\"name\":\"Sistema fantasma\",\"systemId\":\"" + java.util.UUID.randomUUID()
                        + "\",\"description\":\"x\"}")
                .when().post("/api/campaigns")
                .then().statusCode(400);
    }

    /** E2E-PLAYER-01 — join via invite_code → vira PLAYER. */
    @Test
    void playerJoinsViaInviteCodeBecomesPlayer() {
        String systemId = createSystem("vampiro-v5");
        String[] camp = createCampaign(SeedData.MESTRE, "Camarilla", systemId);
        String campaignId = camp[0];
        String inviteCode = camp[1];

        asUser(SeedData.PLAYER1)
                .body("{\"inviteCode\":\"" + inviteCode + "\"}")
                .when().post("/api/campaigns/join")
                .then().statusCode(200)
                .body("id", equalTo(campaignId))
                .body("role", equalTo("PLAYER"));

        // agora é membro PLAYER
        asUser(SeedData.PLAYER1).when().get("/api/campaigns/" + campaignId)
                .then().statusCode(200)
                .body("role", equalTo("PLAYER"));
    }

    /** E2E-PLAYER-02 — convite inválido → erro. */
    @Test
    void invalidInviteCodeFails() {
        asUser(SeedData.PLAYER1)
                .body("{\"inviteCode\":\"NOPENOPE\"}")
                .when().post("/api/campaigns/join")
                .then().statusCode(404);
    }

    /** E2E-AUTHZ-02 — não-membro em /campaigns/{id}/... → 403. */
    @Test
    void nonMemberGets403() {
        String systemId = createSystem("vampiro-v5");
        String[] camp = createCampaign(SeedData.MESTRE, "Sabbat", systemId);
        String campaignId = camp[0];

        // intruso não é membro
        asUser(SeedData.INTRUSO).when().get("/api/campaigns/" + campaignId)
                .then().statusCode(403);
        asUser(SeedData.INTRUSO).when().get("/api/campaigns/" + campaignId + "/members")
                .then().statusCode(403);

        // e não pode gerenciar (MASTER-only)
        asUser(SeedData.INTRUSO)
                .body("{\"name\":\"hack\",\"description\":\"x\"}")
                .when().put("/api/campaigns/" + campaignId)
                .then().statusCode(403);
        asUser(SeedData.INTRUSO).when().post("/api/campaigns/" + campaignId + "/invite")
                .then().statusCode(403);
        asUser(SeedData.INTRUSO).when().delete("/api/campaigns/" + campaignId)
                .then().statusCode(403);
    }

    /**
     * E2E-AUTHZ-03 (OBRIGATÓRIO) — papéis simultâneos: player2 é PLAYER na campanha A
     * e MASTER na campanha B. O acesso/papel resolve por campanha, não pelo usuário.
     */
    @Test
    void simultaneousRolesResolvePerCampaign() {
        String systemId = createSystem("vampiro-v5");

        // Campanha A: mestre é MASTER, player2 entra como PLAYER
        String[] a = createCampaign(SeedData.MESTRE, "Campanha A", systemId);
        String campA = a[0];
        asUser(SeedData.PLAYER2)
                .body("{\"inviteCode\":\"" + a[1] + "\"}")
                .when().post("/api/campaigns/join").then().statusCode(200)
                .body("role", equalTo("PLAYER"));

        // Campanha B: player2 cria → é MASTER
        String[] b = createCampaign(SeedData.PLAYER2, "Campanha B", systemId);
        String campB = b[0];

        // mesmo usuário: PLAYER em A, MASTER em B
        asUser(SeedData.PLAYER2).when().get("/api/campaigns/" + campA)
                .then().statusCode(200).body("role", equalTo("PLAYER"));
        asUser(SeedData.PLAYER2).when().get("/api/campaigns/" + campB)
                .then().statusCode(200).body("role", equalTo("MASTER"));

        // PLAYER em A não pode gerenciar A (MASTER-only) → 403
        asUser(SeedData.PLAYER2).when().post("/api/campaigns/" + campA + "/invite")
                .then().statusCode(403);
        // mas pode gerenciar B onde é MASTER → 200
        asUser(SeedData.PLAYER2).when().post("/api/campaigns/" + campB + "/invite")
                .then().statusCode(200).body("inviteCode", notNullValue());
    }

    /** E2E-AUTHZ-04 — isolamento de tenant: PLAYER de A não enxerga B. */
    @Test
    void tenantIsolationPlayerOfAdoesNotSeeB() {
        String systemId = createSystem("vampiro-v5");
        String[] a = createCampaign(SeedData.MESTRE, "Campanha A", systemId);
        String campA = a[0];
        String[] b = createCampaign(SeedData.PLAYER2, "Campanha B", systemId);
        String campB = b[0];

        // player1 entra só em A
        asUser(SeedData.PLAYER1)
                .body("{\"inviteCode\":\"" + a[1] + "\"}")
                .when().post("/api/campaigns/join").then().statusCode(200);

        // sua lista contém A e NÃO contém B
        asUser(SeedData.PLAYER1).when().get("/api/campaigns")
                .then().statusCode(200)
                .body("id", hasItem(campA))
                .body("id", not(hasItem(campB)))
                .body("findAll { true }", hasSize(1))
                .body("role", everyItem(equalTo("PLAYER")));

        // e acesso direto a B → 403
        asUser(SeedData.PLAYER1).when().get("/api/campaigns/" + campB)
                .then().statusCode(403);
    }

    /** MASTER remove um PLAYER; o ex-membro perde acesso (403). */
    @Test
    void masterRemovesPlayer() {
        String systemId = createSystem("vampiro-v5");
        String[] camp = createCampaign(SeedData.MESTRE, "Anarquia", systemId);
        String campaignId = camp[0];

        asUser(SeedData.PLAYER1)
                .body("{\"inviteCode\":\"" + camp[1] + "\"}")
                .when().post("/api/campaigns/join").then().statusCode(200);

        String player1Id = users.findByEmail(SeedData.PLAYER1).orElseThrow().getId().toString();

        asUser(SeedData.MESTRE).when().delete("/api/campaigns/" + campaignId + "/members/" + player1Id)
                .then().statusCode(204);

        // removido → não é mais membro
        asUser(SeedData.PLAYER1).when().get("/api/campaigns/" + campaignId)
                .then().statusCode(403);

        // master não pode ser removido por essa via
        String masterId = users.findByEmail(SeedData.MESTRE).orElseThrow().getId().toString();
        asUser(SeedData.MESTRE).when().delete("/api/campaigns/" + campaignId + "/members/" + masterId)
                .then().statusCode(400);
    }
}
