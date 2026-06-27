-- Mural da campanha: cards livres que o mestre publica (texto + imagem por URL).
-- Visível a qualquer membro; só o mestre edita. Cai junto com a campanha (FK cascade).
CREATE TABLE campaign_board_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    title       VARCHAR(255),
    body        TEXT,
    image_url   TEXT,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_board_items_campaign ON campaign_board_items (campaign_id, sort_order, created_at);
