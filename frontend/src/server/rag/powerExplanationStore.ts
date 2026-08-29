/**
 * Port of backend/src/main/java/com/portalrpg/rag/PowerExplanationStore.java. Persistent
 * cache (power_explanations table) of PT-BR power explanations — generated once, served
 * from the DB forever (survives restarts/deploys, unlike an in-memory cache).
 */
import { sqlRaw } from "@/server/db/client";

export async function find(systemId: string, powerNorm: string): Promise<string | null> {
  const rows = await sqlRaw<{ content: string }[]>`
    SELECT content FROM power_explanations WHERE system_id = ${systemId} AND power_norm = ${powerNorm}
  `;
  return rows[0]?.content ?? null;
}

export async function save(systemId: string, powerNorm: string, power: string, content: string): Promise<void> {
  await sqlRaw`
    INSERT INTO power_explanations (system_id, power_norm, power, content)
    VALUES (${systemId}, ${powerNorm}, ${power}, ${content})
    ON CONFLICT (system_id, power_norm) DO UPDATE SET content = EXCLUDED.content
  `;
}
