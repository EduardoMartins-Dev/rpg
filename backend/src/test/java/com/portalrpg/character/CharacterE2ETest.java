package com.portalrpg.character;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.notNullValue;

import org.junit.jupiter.api.Test;

import com.portalrpg.support.E2ETestBase;
import com.portalrpg.support.SeedData;

/**
 * F4 — Ficha (persistência + motor V5 via API). Cobre E2E-PLAYER-03, E2E-SHEET-01/02/12/15/18
 * e E2E-AUTHZ-01 (MASTER vê todas as fichas, PLAYER só a sua). A mecânica pura (rolagem, dano,
 * XP, etc.) é coberta determinísticamente em rules/V5EngineTest e rules/V5CatalogTest.
 */
class CharacterE2ETest extends E2ETestBase {

    private static final String V5_ATTRS =
            "[\"forca\",\"destreza\",\"vigor\",\"carisma\",\"manipulacao\",\"autocontrole\","
                    + "\"inteligencia\",\"raciocinio\",\"determinacao\"]";
    private static final String V5_SKILLS =
            "[\"briga\",\"armas_brancas\",\"atletismo\",\"intimidacao\",\"ocultismo\"]";

    /** admin cria sistema V5 + sheet-schema; devolve systemId. */
    private String setupV5System() {
        String systemId = asUser(SeedData.ADMIN)
                .body("{\"name\":\"Vampiro V5\",\"slug\":\"vampiro-v5\",\"description\":\"piloto\"}")
                .when().post("/api/systems").then().statusCode(201).extract().path("id");
        asUser(SeedData.ADMIN)
                .body("{\"schema\":{\"attributes\":" + V5_ATTRS + ",\"skills\":" + V5_SKILLS + "}}")
                .when().put("/api/systems/" + systemId + "/sheet-schema").then().statusCode(200);
        return systemId;
    }

    /** mestre cria campanha; devolve {campaignId, inviteCode}. */
    private String[] setupCampaign(String systemId) {
        io.restassured.path.json.JsonPath jp = asUser(SeedData.MESTRE)
                .body("{\"name\":\"Crônica\",\"systemId\":\"" + systemId + "\",\"description\":\"d\"}")
                .when().post("/api/campaigns").then().statusCode(201).extract().jsonPath();
        return new String[] { jp.getString("id"), jp.getString("inviteCode") };
    }

    private void join(String user, String inviteCode) {
        asUser(user).body("{\"inviteCode\":\"" + inviteCode + "\"}")
                .when().post("/api/campaigns/join").then().statusCode(200);
    }

    /** E2E-PLAYER-03 + E2E-SHEET-01 — player cria ficha conforme schema; derivados calculados. */
    @Test
    void playerCreatesSheetWithDerivedStats() {
        String systemId = setupV5System();
        String[] camp = setupCampaign(systemId);
        join(SeedData.PLAYER1, camp[1]);

        String body = """
                {"name":"Lucian","sheetData":{
                  "type":"VAMPIRO","clan":"BRUJAH",
                  "attributes":{"vigor":3,"autocontrole":3,"determinacao":2,"forca":2},
                  "skills":{"briga":2},"hunger":1,"humanity":7}}
                """;
        String charId = asUser(SeedData.PLAYER1).body(body)
                .when().post("/api/campaigns/" + camp[0] + "/characters")
                .then().statusCode(201)
                .body("playerId", notNullValue())
                .body("sheetData.derived.vitality", equalTo(6))   // Vigor 3 + 3
                .body("sheetData.derived.willpower", equalTo(5))  // 3 + 2
                .extract().path("id");

        // E2E-SHEET-01 — recalcula ao editar o atributo-base (Vigor 3→5 ⇒ Vitalidade 8)
        String edit = """
                {"name":"Lucian","sheetData":{
                  "type":"VAMPIRO","clan":"BRUJAH",
                  "attributes":{"vigor":5,"autocontrole":4,"determinacao":2,"forca":2},
                  "skills":{"briga":2},"hunger":1,"humanity":7}}
                """;
        asUser(SeedData.PLAYER1).body(edit)
                .when().put("/api/campaigns/" + camp[0] + "/characters/" + charId)
                .then().statusCode(200)
                .body("sheetData.derived.vitality", equalTo(8))
                .body("sheetData.derived.willpower", equalTo(6));
    }

    /** E2E-SHEET-02 — atributos 1–5; rejeita 0 e 6. */
    @Test
    void attributeRangeIsEnforced() {
        String systemId = setupV5System();
        String[] camp = setupCampaign(systemId);
        join(SeedData.PLAYER1, camp[1]);

        // 6 → 400
        asUser(SeedData.PLAYER1).body("""
                {"name":"X","sheetData":{"attributes":{"vigor":6}}}
                """)
                .when().post("/api/campaigns/" + camp[0] + "/characters")
                .then().statusCode(400);

        // 0 → 400
        asUser(SeedData.PLAYER1).body("""
                {"name":"X","sheetData":{"attributes":{"forca":0}}}
                """)
                .when().post("/api/campaigns/" + camp[0] + "/characters")
                .then().statusCode(400);

        // campo fora do schema → 400
        asUser(SeedData.PLAYER1).body("""
                {"name":"X","sheetData":{"attributes":{"naoexiste":3}}}
                """)
                .when().post("/api/campaigns/" + camp[0] + "/characters")
                .then().statusCode(400);
    }

    /** E2E-SHEET-12 — seleção de clã auto-popula disciplinas+maldição+compulsão (Brujah/Nosferatu). */
    @Test
    void clanAutoPopulatesCoreClans() {
        String systemId = setupV5System();
        String[] camp = setupCampaign(systemId);
        join(SeedData.PLAYER1, camp[1]);

        asUser(SeedData.PLAYER1).body("""
                {"name":"Brujah","sheetData":{"clan":"BRUJAH","attributes":{"vigor":2}}}
                """)
                .when().post("/api/campaigns/" + camp[0] + "/characters")
                .then().statusCode(201)
                .body("sheetData.clanDisciplines", contains("Celeridade", "Potência", "Presença"))
                .body("sheetData.compulsion", equalTo("Rebelião"))
                .body("sheetData.bane", notNullValue());

        asUser(SeedData.PLAYER1).body("""
                {"name":"Nosferatu","sheetData":{"clan":"NOSFERATU","attributes":{"vigor":2}}}
                """)
                .when().post("/api/campaigns/" + camp[0] + "/characters")
                .then().statusCode(201)
                .body("sheetData.clanDisciplines", contains("Animalismo", "Ofuscação", "Potência"))
                .body("sheetData.compulsion", equalTo("Criptofilia"));
    }

    /** E2E-SHEET-15 — clãs do Companion (Ravnos) auto-populam. */
    @Test
    void clanAutoPopulatesCompanionClans() {
        String systemId = setupV5System();
        String[] camp = setupCampaign(systemId);
        join(SeedData.PLAYER1, camp[1]);

        asUser(SeedData.PLAYER1).body("""
                {"name":"Ravnos","sheetData":{"clan":"RAVNOS","attributes":{"vigor":2}}}
                """)
                .when().post("/api/campaigns/" + camp[0] + "/characters")
                .then().statusCode(201)
                .body("sheetData.clanDisciplines", contains("Animalismo", "Ofuscação", "Presença"))
                .body("sheetData.compulsion", equalTo("Destino Tentador"));
    }

    /** E2E-SHEET-18 — fichas alternativas: Mortal (sem clã/predador) e Carniçal (com clã). */
    @Test
    void mortalAndGhoulSheets() {
        String systemId = setupV5System();
        String[] camp = setupCampaign(systemId);
        join(SeedData.PLAYER1, camp[1]);

        // Mortal sem clã → ok, sem disciplinas
        asUser(SeedData.PLAYER1).body("""
                {"name":"Joana","sheetData":{"type":"MORTAL","attributes":{"vigor":2,"autocontrole":3,"determinacao":2}}}
                """)
                .when().post("/api/campaigns/" + camp[0] + "/characters")
                .then().statusCode(201)
                .body("sheetData.type", equalTo("MORTAL"))
                .body("sheetData.derived.vitality", equalTo(5))
                .body("sheetData.clanDisciplines", org.hamcrest.Matchers.nullValue());

        // Mortal com clã → 400
        asUser(SeedData.PLAYER1).body("""
                {"name":"Bug","sheetData":{"type":"MORTAL","clan":"BRUJAH","attributes":{"vigor":2}}}
                """)
                .when().post("/api/campaigns/" + camp[0] + "/characters")
                .then().statusCode(400);

        // Carniçal com clã do domitor → ok, clã popula
        asUser(SeedData.PLAYER1).body("""
                {"name":"Renfield","sheetData":{"type":"CARNICAL","clan":"VENTRUE","attributes":{"vigor":2}}}
                """)
                .when().post("/api/campaigns/" + camp[0] + "/characters")
                .then().statusCode(201)
                .body("sheetData.type", equalTo("CARNICAL"))
                .body("sheetData.clanDisciplines", contains("Dominação", "Fortitude", "Presença"));
    }

    /** E2E-AUTHZ-01 — MASTER lista todas as fichas; PLAYER só a sua. */
    @Test
    void masterSeesAllPlayerSeesOwn() {
        String systemId = setupV5System();
        String[] camp = setupCampaign(systemId);
        String campaignId = camp[0];
        join(SeedData.PLAYER1, camp[1]);
        join(SeedData.PLAYER2, camp[1]);

        String charA = asUser(SeedData.PLAYER1).body("""
                {"name":"FichaP1","sheetData":{"attributes":{"vigor":2}}}
                """).when().post("/api/campaigns/" + campaignId + "/characters")
                .then().statusCode(201).extract().path("id");
        asUser(SeedData.PLAYER2).body("""
                {"name":"FichaP2","sheetData":{"attributes":{"vigor":2}}}
                """).when().post("/api/campaigns/" + campaignId + "/characters")
                .then().statusCode(201);

        // MASTER vê as duas
        asUser(SeedData.MESTRE).when().get("/api/campaigns/" + campaignId + "/characters")
                .then().statusCode(200)
                .body("name", org.hamcrest.Matchers.hasItems("FichaP1", "FichaP2"))
                .body("$", hasSize(2));

        // PLAYER1 vê só a sua
        asUser(SeedData.PLAYER1).when().get("/api/campaigns/" + campaignId + "/characters")
                .then().statusCode(200)
                .body("$", hasSize(1))
                .body("[0].name", equalTo("FichaP1"));

        // PLAYER2 não acessa a ficha de PLAYER1 por id → 403
        asUser(SeedData.PLAYER2).when().get("/api/campaigns/" + campaignId + "/characters/" + charA)
                .then().statusCode(403);

        // MASTER acessa a ficha de PLAYER1 por id → 200
        asUser(SeedData.MESTRE).when().get("/api/campaigns/" + campaignId + "/characters/" + charA)
                .then().statusCode(200).body("name", equalTo("FichaP1"));

        // não-membro → 403
        asUser(SeedData.INTRUSO).when().get("/api/campaigns/" + campaignId + "/characters")
                .then().statusCode(403);
    }
}
