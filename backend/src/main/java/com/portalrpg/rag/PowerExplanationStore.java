package com.portalrpg.rag;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

/**
 * Cache PERSISTENTE (tabela power_explanations) das explicações PT-BR de poderes. Como a cota
 * diária do provedor de IA free é pequena, cada poder é gerado UMA vez e servido do banco para
 * sempre — inclusive após restart/deploy, o que o cache em memória não garantia.
 */
@Repository
public class PowerExplanationStore {

    private final JdbcTemplate jdbc;

    public PowerExplanationStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<String> find(UUID systemId, String powerNorm) {
        List<String> rows = jdbc.query(
                "SELECT content FROM power_explanations WHERE system_id = ? AND power_norm = ?",
                (rs, i) -> rs.getString("content"), systemId, powerNorm);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public void save(UUID systemId, String powerNorm, String power, String content) {
        jdbc.update(
                "INSERT INTO power_explanations (system_id, power_norm, power, content) "
                        + "VALUES (?, ?, ?, ?) "
                        + "ON CONFLICT (system_id, power_norm) DO UPDATE SET content = EXCLUDED.content",
                systemId, powerNorm, power, content);
    }
}
