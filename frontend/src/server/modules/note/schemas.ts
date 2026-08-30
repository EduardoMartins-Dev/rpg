import { z } from "zod";

export const noteRequestSchema = z.object({
  title: z.string().max(255, "size must be between 0 and 255").nullish(),
  body: z.string().nullish(),
  folderId: z.string().uuid("must be a valid id").nullish(),
});
