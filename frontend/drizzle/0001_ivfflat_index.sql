-- drizzle-kit doesn't know how to generate pgvector-specific index syntax
-- (USING ivfflat ... WITH (lists=100)) for a customType column, so it's
-- appended by hand here. Matches the Java backend's V1 migration exactly.
CREATE INDEX "idx_document_chunks_embedding"
    ON "document_chunks" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
