-- Aplicado FORA do drizzle-kit (não está no meta/_journal.json): o drizzle-kit não
-- gera a sintaxe de índice específica do pgvector (USING ivfflat ... WITH (lists=100))
-- para uma coluna customType. Rode uma vez por banco novo, depois do `db:migrate`.
-- Idêntico ao índice da migração V1 do backend Java.
CREATE INDEX "idx_document_chunks_embedding"
    ON "document_chunks" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
