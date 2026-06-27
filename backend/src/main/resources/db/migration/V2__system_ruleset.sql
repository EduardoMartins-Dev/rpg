-- Ruleset por sistema: define o conjunto de regras (catálogo de clãs/perícias V5, etc).
-- 'v5' = Vampiro: A Máscara V5 (catálogo rico); 'generic' = ficha 100% pelo schema.
-- Default 'v5' por ser o piloto; admin troca para 'generic' em sistemas não-V5.
ALTER TABLE rpg_systems ADD COLUMN ruleset VARCHAR(32) NOT NULL DEFAULT 'v5';
