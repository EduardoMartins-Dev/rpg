import { z } from "zod";

export const characterRequestSchema = z.object({
  name: z.string().min(1, "must not be blank").max(255, "size must be between 0 and 255"),
  sheetData: z.unknown().refine((v) => v !== undefined && v !== null, "must not be null"),
});
