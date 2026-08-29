import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().min(1, "must not be blank").email("must be a well-formed email address"),
  displayName: z.string().min(1, "must not be blank").max(255, "size must be between 0 and 255"),
  password: z.string().min(8, "size must be between 8 and 255").max(255, "size must be between 8 and 255"),
  admin: z.boolean(),
});

export const setAdminSchema = z.object({
  admin: z.boolean(),
});
