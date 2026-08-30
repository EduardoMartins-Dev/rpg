import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/server/db/client";
import { campaignRolls, users } from "@/server/db/schema";
import type { z } from "zod";
import type { createRollSchema } from "./schemas";

/** Quantas rolagens o mestre vê no histórico. O foco é "o que rolou agora na mesa",
 *  não auditoria — janela curta mantém a lista legível e a consulta barata. */
const FEED_LIMIT = 40;

export type RollDie = { v: number; hunger: boolean };
export type RollResponse = {
  id: string;
  userId: string;
  playerName: string;
  characterName: string | null;
  label: string;
  pool: number;
  hunger: number;
  difficulty: number;
  dice: RollDie[];
  successes: number;
  outcome: string;
  createdAt: string;
};

export async function record(
  campaignId: string,
  userId: string,
  req: z.infer<typeof createRollSchema>,
): Promise<{ id: string }> {
  const [row] = await db
    .insert(campaignRolls)
    .values({
      campaignId,
      userId,
      characterName: req.characterName ?? null,
      label: req.label,
      pool: req.pool,
      hunger: req.hunger,
      difficulty: req.difficulty,
      dice: req.dice,
      successes: req.successes,
      outcome: req.outcome,
    })
    .returning({ id: campaignRolls.id });
  return { id: row.id };
}

/**
 * Histórico da campanha. MASTER vê a mesa inteira (é o ponto da feature); PLAYER vê só
 * as próprias rolagens — mesma regra de visibilidade das fichas e anotações.
 */
export async function list(campaignId: string, userId: string, master: boolean): Promise<RollResponse[]> {
  const where = master
    ? eq(campaignRolls.campaignId, campaignId)
    : and(eq(campaignRolls.campaignId, campaignId), eq(campaignRolls.userId, userId));

  const rows = await db
    .select()
    .from(campaignRolls)
    .where(where)
    .orderBy(desc(campaignRolls.createdAt))
    .limit(FEED_LIMIT);
  if (rows.length === 0) return [];

  const authors = await db
    .select({ id: users.id, displayName: users.displayName })
    .from(users)
    .where(inArray(users.id, [...new Set(rows.map((r) => r.userId))]));
  const nameOf = new Map(authors.map((u) => [u.id, u.displayName]));

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    playerName: nameOf.get(r.userId) ?? "—",
    characterName: r.characterName,
    label: r.label,
    pool: r.pool,
    hunger: r.hunger,
    difficulty: r.difficulty,
    dice: r.dice as RollDie[],
    successes: r.successes,
    outcome: r.outcome,
    createdAt: r.createdAt.toISOString(),
  }));
}
