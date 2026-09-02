import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().min(1, "must not be blank").email("must be a well-formed email address"),
  password: z.string().min(8, "size must be between 8 and 100").max(100, "size must be between 8 and 100"),
  displayName: z.string().min(1, "must not be blank").max(255, "size must be between 0 and 255"),
});

export const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

export const refreshSchema = z.object({
  refreshToken: z.string(),
});

/** Edição do próprio perfil. Todos os campos são opcionais (envia só o que mudou).
 * avatarUrl pode ser null/"" para remover a foto. */
export const updateProfileSchema = z.object({
  displayName: z.string().min(1, "must not be blank").max(255, "size must be between 0 and 255").optional(),
  email: z.string().min(1, "must not be blank").email("must be a well-formed email address").optional(),
  avatarUrl: z.string().max(2048).nullish(),
});
