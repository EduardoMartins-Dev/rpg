import { z } from "zod";

export const characterRequestSchema = z.object({
  name: z.string().min(1, "must not be blank").max(255, "size must be between 0 and 255"),
  sheetData: z.unknown().refine((v) => v !== undefined && v !== null, "must not be null"),
});

/** Criar ficha avulsa em "Personagens": nome + sistema (sem campanha). */
export const standaloneCharacterSchema = z.object({
  name: z.string().min(1, "must not be blank").max(255, "size must be between 0 and 255"),
  systemId: z.string().uuid("must be a valid id"),
});

/** Adicionar (copiar) uma ficha avulsa a uma campanha. */
export const attachCharacterSchema = z.object({
  characterId: z.string().uuid("must be a valid id"),
});
