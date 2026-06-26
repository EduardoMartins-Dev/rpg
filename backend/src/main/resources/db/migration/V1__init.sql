-- Portal de RPG — schema inicial
-- pgvector required for RAG (document_chunks.embedding)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- users: papel global apenas via is_admin. Papel por campanha NÃO mora aqui.
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name  VARCHAR(255) NOT NULL,
    is_admin      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- rpg_systems: admin cadastra sistemas dinamicamente
-- ---------------------------------------------------------------------------
CREATE TABLE rpg_systems (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_by  UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- system_sheet_schema: template (jsonb) da ficha por sistema (1:1)
-- ---------------------------------------------------------------------------
CREATE TABLE system_sheet_schema (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_id  UUID NOT NULL UNIQUE REFERENCES rpg_systems(id) ON DELETE CASCADE,
    schema     JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- system_documents: PDFs por sistema; status de indexação
-- ---------------------------------------------------------------------------
CREATE TABLE system_documents (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    system_id  UUID NOT NULL REFERENCES rpg_systems(id) ON DELETE CASCADE,
    file_url   VARCHAR(1024) NOT NULL,
    status     VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING | INDEXED
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- document_chunks: chunk + embedding (pgvector), escopado por system_id
-- dimensão 1536 (configurável); o filtro por system_id é obrigatório no RAG
-- ---------------------------------------------------------------------------
CREATE TABLE document_chunks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES system_documents(id) ON DELETE CASCADE,
    system_id   UUID NOT NULL REFERENCES rpg_systems(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    embedding   vector(1536),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- IVFFlat por embedding (cosine). Criado após haver dados idealmente, mas
-- declarado aqui para o schema. lists=100 default razoável p/ corpus pequeno.
CREATE INDEX idx_document_chunks_embedding
    ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_document_chunks_system ON document_chunks(system_id);

-- ---------------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------------
CREATE TABLE campaigns (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    system_id   UUID NOT NULL REFERENCES rpg_systems(id),
    master_id   UUID NOT NULL REFERENCES users(id),
    invite_code VARCHAR(64) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- campaign_members: papel contextual por campanha (MASTER | PLAYER)
-- ---------------------------------------------------------------------------
CREATE TABLE campaign_members (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role        VARCHAR(16) NOT NULL, -- MASTER | PLAYER
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uk_campaign_member UNIQUE (campaign_id, user_id)
);
CREATE INDEX idx_campaign_members_user ON campaign_members(user_id);

-- ---------------------------------------------------------------------------
-- characters: ficha como jsonb validado contra system_sheet_schema
-- ---------------------------------------------------------------------------
CREATE TABLE characters (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    player_id   UUID NOT NULL REFERENCES users(id),
    name        VARCHAR(255) NOT NULL,
    sheet_data  JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_characters_campaign ON characters(campaign_id);
CREATE INDEX idx_characters_player ON characters(player_id);
