import { z } from "zod";

export const createCampaignSchema = z.object({
  name: z.string().min(1, "must not be blank").max(255, "size must be between 0 and 255"),
  systemId: z.string().uuid("must not be null"),
  description: z.string().nullish(),
});

export const updateCampaignSchema = z.object({
  name: z.string().min(1, "must not be blank").max(255, "size must be between 0 and 255"),
  description: z.string().nullish(),
  bannerUrl: z.string().max(2048, "size must be between 0 and 2048").nullish(),
  theme: z.string().max(32, "size must be between 0 and 32").nullish(),
});

export const joinCampaignSchema = z.object({
  inviteCode: z.string().min(1, "must not be blank"),
});
