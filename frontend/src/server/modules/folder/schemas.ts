import { z } from "zod";

export const folderKindSchema = z.enum(["board", "notes"]);

export const createFolderSchema = z.object({
  kind: folderKindSchema,
  name: z.string().min(1, "must not be blank").max(255, "size must be between 0 and 255"),
  parentId: z.string().uuid("must be a valid id").nullish(),
});

export const renameFolderSchema = z.object({
  name: z.string().min(1, "must not be blank").max(255, "size must be between 0 and 255"),
});
