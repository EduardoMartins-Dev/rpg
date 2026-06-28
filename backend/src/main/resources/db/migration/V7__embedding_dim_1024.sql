-- Embeddings passam de lexical (hashing 1536) para semântico (jina-v3, 1024).
-- A dimensão da coluna muda, então os vetores antigos são incompatíveis: limpamos os
-- chunks (precisam ser reembeddados) e marcamos os documentos para reindexação.
--
-- Após o deploy: reenviar os documentos do sistema (upload com clear) OU reindexar,
-- agora gerando embeddings de 1024 dims com o provedor ativo.

DROP INDEX IF EXISTS idx_document_chunks_embedding;

-- TRUNCATE é necessário: ALTER de vector(1536) -> vector(1024) falha com dados presentes.
TRUNCATE TABLE document_chunks;

ALTER TABLE document_chunks
    ALTER COLUMN embedding TYPE vector(1024);

CREATE INDEX idx_document_chunks_embedding
    ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Documentos voltam a PENDING: seus chunks sumiram e precisam ser reindexados.
UPDATE system_documents SET status = 'PENDING';
