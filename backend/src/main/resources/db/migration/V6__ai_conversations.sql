-- Histórico de chat com a IA: conversas (contextos) por usuário dentro da campanha,
-- estilo ChatGPT. Cada conversa guarda suas mensagens em ordem. Cai junto com a
-- campanha e com o usuário (FK cascade).
CREATE TABLE ai_conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL DEFAULT 'Nova conversa',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_conversations_owner
    ON ai_conversations (campaign_id, user_id, updated_at DESC);

CREATE TABLE ai_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role            VARCHAR(16) NOT NULL,   -- user | assistant
    content         TEXT NOT NULL,
    grounded        BOOLEAN NOT NULL DEFAULT false,
    source_count    INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_messages_conversation
    ON ai_messages (conversation_id, created_at);
