-- Personalização da campanha pelo mestre: banner (imagem por URL) e tema (cor de destaque).
ALTER TABLE campaigns ADD COLUMN banner_url TEXT;
ALTER TABLE campaigns ADD COLUMN theme VARCHAR(32);
