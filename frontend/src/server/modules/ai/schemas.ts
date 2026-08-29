import { z } from "zod";

export const askRequestSchema = z.object({
  question: z.string().min(1, "must not be blank"),
});

export const sendMessageRequestSchema = z.object({
  question: z.string().min(1, "must not be blank"),
});
