import { z } from "zod";

export const systemRequestSchema = z.object({
  name: z.string().min(1, "must not be blank").max(255, "size must be between 0 and 255"),
  slug: z
    .string()
    .min(1, "must not be blank")
    .max(255, "size must be between 0 and 255")
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric with hyphens"),
  description: z.string().nullish(),
  ruleset: z.enum(["v5", "t20", "generic"]).nullish(),
});

export const sheetSchemaRequestSchema = z.object({
  schema: z.unknown().refine((v) => v !== undefined && v !== null, "must not be null"),
});

export const textDocumentRequestSchema = z.object({
  title: z.string().max(255, "size must be between 0 and 255").nullish(),
  text: z.string().min(1, "must not be blank"),
});

export const uploadUrlRequestSchema = z.object({
  filename: z.string().min(1, "must not be blank").max(255, "size must be between 0 and 255"),
});

export const storageDocumentRequestSchema = z.object({
  path: z.string().min(1, "must not be blank"),
});
