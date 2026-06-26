package com.portalrpg.system;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.notNullValue;

import org.junit.jupiter.api.Test;

import com.portalrpg.support.E2ETestBase;
import com.portalrpg.support.SeedData;

class SystemE2ETest extends E2ETestBase {

    /** E2E-ADMIN-01 — admin cria V5 e define sheet-schema. */
    @Test
    void adminCreatesSystemAndDefinesSheetSchema() {
        String systemId = asUser(SeedData.ADMIN)
                .body("""
                      {"name":"Vampiro: A Máscara V5","slug":"vampiro-v5",
                       "description":"Sistema-piloto"}
                      """)
                .when().post("/api/systems")
                .then().statusCode(201)
                .body("slug", equalTo("vampiro-v5"))
                .body("id", notNullValue())
                .extract().path("id");

        // appears in the list
        asUser(SeedData.ADMIN).when().get("/api/systems")
                .then().statusCode(200)
                .body("slug", org.hamcrest.Matchers.hasItem("vampiro-v5"));

        // define sheet-schema (jsonb template)
        asUser(SeedData.ADMIN)
                .body("""
                      {"schema":{
                        "attributes":["forca","destreza","vigor"],
                        "skills":["armas_brancas","atletismo"],
                        "fields":{"humanidade":{"type":"int","min":0,"max":10}}
                      }}
                      """)
                .when().put("/api/systems/" + systemId + "/sheet-schema")
                .then().statusCode(200)
                .body("systemId", equalTo(systemId))
                .body("schema.attributes[0]", equalTo("forca"))
                .body("schema.fields.humanidade.max", equalTo(10));

        // schema is readable back
        asUser(SeedData.ADMIN).when().get("/api/systems/" + systemId + "/sheet-schema")
                .then().statusCode(200)
                .body("schema.skills[0]", equalTo("armas_brancas"));
    }

    /** E2E-ADMIN-02 — não-admin cria sistema → 403. */
    @Test
    void nonAdminCannotCreateSystem() {
        asUser(SeedData.MESTRE)
                .body("""
                      {"name":"Hack","slug":"hack","description":"x"}
                      """)
                .when().post("/api/systems")
                .then().statusCode(403);
    }

    /** F5 upload dispara indexação: doc vai a INDEXED com file_url (E2E-ADMIN-03 coberto a fundo em RagE2ETest). */
    @Test
    void adminUploadsDocumentGetsIndexed() {
        String systemId = asUser(SeedData.ADMIN)
                .body("""
                      {"name":"V5","slug":"v5-upload","description":"x"}
                      """)
                .when().post("/api/systems").then().statusCode(201).extract().path("id");

        given().header("Authorization", "Bearer " + tokenFor(SeedData.ADMIN))
                .multiPart("file", "rulebook.txt", "Vitalidade = Vigor + 3".getBytes(), "text/plain")
                .when().post("/api/systems/" + systemId + "/documents")
                .then().statusCode(201)
                .body("status", equalTo("INDEXED"))
                .body("fileUrl", notNullValue());

        asUser(SeedData.ADMIN).when().get("/api/systems/" + systemId + "/documents")
                .then().statusCode(200)
                .body("[0].status", equalTo("INDEXED"));
    }
}
