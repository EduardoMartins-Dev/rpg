package com.portalrpg.rag;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;

import org.junit.jupiter.api.Test;

import com.portalrpg.support.E2ETestBase;
import com.portalrpg.support.SeedData;

/**
 * F5 — RAG. Cobre E2E-ADMIN-03 (indexação PENDING→INDEXED, chunks com system_id),
 * E2E-RAG-01..05 (recuperação escopada + isolamento + fallback) e E2E-SHEET-13
 * (texto integral do poder vindo do PDF indexado). Geração mockada (EchoChatModel) —
 * nenhum LLM real; só o retrieval contra pgvector é validado.
 */
class RagE2ETest extends E2ETestBase {

    private static final String V5_CORPUS = """
            Vitalidade. A Vitalidade de um vampiro é igual ao seu Vigor mais 3. \
            Um personagem com Vigor 3 tem Vitalidade 6.

            Forca de Vontade. A Forca de Vontade e igual a Autocontrole mais Determinacao.

            Perdicao do cla Ravnos. O Ravnos queima por dentro se dormir no mesmo local \
            duas vezes em sete noites; o dano agravado e igual a Gravidade da Perdicao.

            Vicissitude. Vicissitude e um poder de Proteanismo que permite ao vampiro \
            remodelar a propria carne e ossos como argila, esculpindo o proprio corpo a vontade.
            """;

    private static final String D20_CORPUS = """
            Classe de Armadura. Em sistemas d20, a Classe de Armadura representa o quao \
            dificil e acertar um alvo em combate.

            Pontos de acerto. Os pontos dependem do dado da classe e do modificador de Constituicao.
            """;

    private String createSystem(String slug) {
        return asUser(SeedData.ADMIN)
                .body("{\"name\":\"" + slug + "\",\"slug\":\"" + slug + "\",\"description\":\"x\"}")
                .when().post("/api/systems").then().statusCode(201).extract().path("id");
    }

    private void uploadCorpus(String systemId, String filename, String content) {
        given().header("Authorization", "Bearer " + tokenFor(SeedData.ADMIN))
                .multiPart("file", filename, content.getBytes(), "text/plain")
                .when().post("/api/systems/" + systemId + "/documents")
                .then().statusCode(201)
                .body("status", equalTo("INDEXED")); // E2E-ADMIN-03: PENDING→INDEXED
    }

    /** mestre cria campanha no sistema; player1 entra; devolve campaignId. */
    private String campaignOn(String systemId) {
        io.restassured.path.json.JsonPath jp = asUser(SeedData.MESTRE)
                .body("{\"name\":\"Cronica\",\"systemId\":\"" + systemId + "\",\"description\":\"d\"}")
                .when().post("/api/campaigns").then().statusCode(201).extract().jsonPath();
        String id = jp.getString("id");
        asUser(SeedData.PLAYER1).body("{\"inviteCode\":\"" + jp.getString("inviteCode") + "\"}")
                .when().post("/api/campaigns/join").then().statusCode(200);
        return id;
    }

    /** E2E-RAG-01 — pergunta na campanha V5 recupera só do system_id de V5; cita Vigor+3. */
    @Test
    void ragScopedRetrievalCitesSource() {
        String v5 = createSystem("vampiro-v5");
        uploadCorpus(v5, "v5.txt", V5_CORPUS);
        String camp = campaignOn(v5);

        asUser(SeedData.PLAYER1).body("{\"question\":\"Qual a formula da Vitalidade?\"}")
                .when().post("/api/campaigns/" + camp + "/ai/ask")
                .then().statusCode(200)
                .body("grounded", equalTo(true))
                .body("systemId", equalTo(v5))
                .body("answer", containsString("Vigor"))
                .body("answer", containsString("3"))
                // E2E-ADMIN-03: todo chunk recuperado pertence ao system_id de V5
                .body("sources.systemId", everyItem(equalTo(v5)));
    }

    /** E2E-RAG-02 — lore: Perdição do clã Ravnos recupera do corpus do sistema. */
    @Test
    void ragRetrievesLore() {
        String v5 = createSystem("vampiro-v5");
        uploadCorpus(v5, "v5.txt", V5_CORPUS);
        String camp = campaignOn(v5);

        asUser(SeedData.PLAYER1).body("{\"question\":\"Qual a Perdicao do cla Ravnos?\"}")
                .when().post("/api/campaigns/" + camp + "/ai/ask")
                .then().statusCode(200)
                .body("grounded", equalTo(true))
                .body("answer", containsString("Ravnos"))
                .body("answer", containsString("queima"));
    }

    /** E2E-RAG-03 — isolamento: a mesma pergunta numa campanha d20 não retorna chunks de V5. */
    @Test
    void ragIsolationBetweenSystems() {
        String v5 = createSystem("vampiro-v5");
        uploadCorpus(v5, "v5.txt", V5_CORPUS);
        String d20 = createSystem("generico-d20");
        uploadCorpus(d20, "d20.txt", D20_CORPUS);
        String campD20 = campaignOn(d20);

        asUser(SeedData.PLAYER1).body("{\"question\":\"Qual a formula da Vitalidade?\"}")
                .when().post("/api/campaigns/" + campD20 + "/ai/ask")
                .then().statusCode(200)
                .body("systemId", equalTo(d20))
                // nenhum chunk de V5 vaza para a campanha d20
                .body("sources.systemId", everyItem(equalTo(d20)))
                .body("sources.systemId", not(org.hamcrest.Matchers.hasItem(v5)))
                .body("answer", not(containsString("Vigor mais 3")));
    }

    /** E2E-RAG-04 — sistema sem PDF responde fallback claro (sem alucinar de outro corpus). */
    @Test
    void ragFallbackWhenNoCorpus() {
        // existe corpus de V5 noutro sistema, mas a campanha aponta p/ sistema sem PDF
        String v5 = createSystem("vampiro-v5");
        uploadCorpus(v5, "v5.txt", V5_CORPUS);
        String vazio = createSystem("sistema-vazio");
        String camp = campaignOn(vazio);

        asUser(SeedData.PLAYER1).body("{\"question\":\"Qual a formula da Vitalidade?\"}")
                .when().post("/api/campaigns/" + camp + "/ai/ask")
                .then().statusCode(200)
                .body("grounded", equalTo(false))
                .body("answer", equalTo(RagQueryService.FALLBACK))
                .body("sources", hasSize(0))
                .body("answer", not(containsString("Vigor")));
    }

    /** E2E-RAG-05 — poder do Companion (Vicissitude) recupera do corpus, com system_id de V5. */
    @Test
    void ragRetrievesCompanionPower() {
        String v5 = createSystem("vampiro-v5");
        uploadCorpus(v5, "v5.txt", V5_CORPUS);
        String camp = campaignOn(v5);

        asUser(SeedData.PLAYER1).body("{\"question\":\"O que faz Vicissitude?\"}")
                .when().post("/api/campaigns/" + camp + "/ai/ask")
                .then().statusCode(200)
                .body("grounded", equalTo(true))
                .body("systemId", equalTo(v5))
                .body("answer", containsString("Vicissitude"))
                .body("answer", containsString("remodelar"));
    }

    /** E2E-SHEET-13 — disciplina exibe o texto integral do poder (vindo do PDF indexado). */
    @Test
    void disciplinePowerIntegralText() {
        String v5 = createSystem("vampiro-v5");
        uploadCorpus(v5, "v5.txt", V5_CORPUS);
        String camp = campaignOn(v5);

        asUser(SeedData.PLAYER1)
                .when().get("/api/campaigns/" + camp + "/disciplines/Vicissitude")
                .then().statusCode(200)
                .body("systemId", equalTo(v5))
                .body("power", equalTo("Vicissitude"))
                .body("text", containsString("remodelar a propria carne"));

        // não-membro não acessa
        asUser(SeedData.INTRUSO)
                .when().get("/api/campaigns/" + camp + "/disciplines/Vicissitude")
                .then().statusCode(403);
    }
}
