-- Anotações da campanha: cada jogador escreve as suas; o mestre vê/edita/exclui todas.
-- Caem junto com a campanha (FK cascade). O autor é preservado por usuário.
CREATE TABLE campaign_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255),
    body        TEXT NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_notes_campaign ON campaign_notes (campaign_id, author_id, updated_at DESC);
