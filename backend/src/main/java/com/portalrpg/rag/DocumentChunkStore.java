package com.portalrpg.rag;

import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Acesso a document_chunks via JDBC (pgvector). Mantém o vetor como literal
 * {@code [..]::vector} — evita mapear o tipo pgvector no Hibernate. A busca KNN é
 * SEMPRE filtrada por system_id (isolamento obrigatório entre sistemas, prompt §6).
 */
@Repository
public class DocumentChunkStore {

    /** Chunk recuperado com seu system_id (para os testes de isolamento). */
    public record RetrievedChunk(String content, UUID systemId) {
    }

    private final JdbcTemplate jdbc;

    public DocumentChunkStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void deleteByDocument(UUID documentId) {
        jdbc.update("DELETE FROM document_chunks WHERE document_id = ?", documentId);
    }

    public void insert(UUID documentId, UUID systemId, String content, float[] embedding) {
        jdbc.update(
                "INSERT INTO document_chunks (document_id, system_id, content, embedding) "
                        + "VALUES (?, ?, ?, CAST(? AS vector))",
                documentId, systemId, content, toVectorLiteral(embedding));
    }

    /** Top-k chunks mais próximos (cosseno) DENTRO do system_id dado. */
    public List<RetrievedChunk> search(UUID systemId, float[] queryEmbedding, int k) {
        // Corpus pequeno: sonda todas as listas do ivfflat p/ KNN exato (evita misses
        // com lists=100/probes=1). SET LOCAL vale só nesta transação de leitura.
        jdbc.execute("SET LOCAL ivfflat.probes = 100");
        return jdbc.query(
                "SELECT content, system_id FROM document_chunks "
                        + "WHERE system_id = ? "
                        + "ORDER BY embedding <=> CAST(? AS vector) LIMIT ?",
                (rs, i) -> new RetrievedChunk(rs.getString("content"), rs.getObject("system_id", UUID.class)),
                systemId, toVectorLiteral(queryEmbedding), k);
    }

    public long countBySystem(UUID systemId) {
        Long n = jdbc.queryForObject(
                "SELECT count(*) FROM document_chunks WHERE system_id = ?", Long.class, systemId);
        return n == null ? 0 : n;
    }

    static String toVectorLiteral(float[] v) {
        StringBuilder sb = new StringBuilder(v.length * 8);
        sb.append('[');
        for (int i = 0; i < v.length; i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(v[i]);
        }
        return sb.append(']').toString();
    }
}
