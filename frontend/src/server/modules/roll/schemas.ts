import { z } from "zod";

export const OUTCOMES = [
  "SUCESSO",
  "CRITICO",
  "CRITICO_CONFUSO",
  "FALHA",
  "FALHA_BESTIAL",
  "ROUSE_OK",
  "ROUSE_FALHA",
] as const;

export const createRollSchema = z.object({
  characterName: z.string().max(255).nullish(),
  label: z.string().min(1, "must not be blank").max(255, "size must be between 0 and 255"),
  pool: z.number().int().min(0).max(50),
  hunger: z.number().int().min(0).max(10),
  difficulty: z.number().int().min(0).max(20),
  dice: z
    .array(z.object({ v: z.number().int().min(1).max(10), hunger: z.boolean() }))
    .max(50),
  successes: z.number().int().min(0).max(100),
  outcome: z.enum(OUTCOMES),
});
