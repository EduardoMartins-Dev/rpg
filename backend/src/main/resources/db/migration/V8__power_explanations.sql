-- Cache PERSISTENTE das explicações PT-BR de poderes de disciplina. A tradução/estruturação do
-- trecho do livro via IA é cara e a cota diária do provedor free é pequena, então cada poder é
-- gerado UMA vez e servido do banco para sempre (sobrevive a restart/deploy, ao contrário do
-- cache em memória). Chave: sistema + nome normalizado do poder.
CREATE TABLE power_explanations (
    system_id   UUID        NOT NULL,
    power_norm  TEXT        NOT NULL,
    power       TEXT        NOT NULL,
    content     TEXT        NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (system_id, power_norm)
);
