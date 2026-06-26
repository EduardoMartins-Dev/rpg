package com.portalrpg;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

/**
 * Base for all integration/E2E tests. Uses a SINGLETON pgvector/pgvector:pg16
 * container started once for the whole JVM (NOT plain Postgres). The singleton
 * pattern is required because Spring caches the application context across test
 * classes: a per-class @Container would be stopped between classes while the
 * cached datasource still points at it. @ServiceConnection wires Flyway + JPA
 * to the running container automatically. No external DB, no real LLM.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES;

    static {
        POSTGRES = new PostgreSQLContainer<>(
                DockerImageName.parse("pgvector/pgvector:pg16")
                        .asCompatibleSubstituteFor("postgres"))
                .withDatabaseName("portalrpg")
                .withUsername("portalrpg")
                .withPassword("portalrpg");
        POSTGRES.start();
    }
}
