import { z } from "zod";

export const boardItemRequestSchema = z.object({
  title: z.string().max(255, "size must be between 0 and 255").nullish(),
  body: z.string().nullish(),
  imageUrl: z.string().max(2048, "size must be between 0 and 2048").nullish(),
  sortOrder: z.number().int().nullish(),
});
