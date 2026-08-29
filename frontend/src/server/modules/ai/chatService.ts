/**
 * Port of backend/src/main/java/com/portalrpg/ai/AiChatService.java. ChatGPT-style AI
 * chat: per-user conversations with persisted history. Each question retrieves passages
 * from the campaign's system (RAG) and generates an anchored answer, considering the
 * prior turns of the same conversation.
 */
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/server/db/client";
import { aiConversations, aiMessages } from "@/server/db/schema";
import { ApiError } from "@/server/http/errors";
import * as rag from "@/server/rag/queryService";
import { chatModel } from "@/server/rag/providers";
import type { Turn } from "@/server/rag/types";

// How many prior turns to send to the model (bounds prompt size).
const HISTORY_TURNS = 12;
// How many prior USER turns feed the retrieval query (keeps the topic for follow-ups).
const RETRIEVAL_CONTEXT_TURNS = 2;
const FALLBACK = rag.FALLBACK;

export type ConversationSummary = { id: string; title: string; updatedAt: string };
export type MessageView = { id: string; role: string; content: string; grounded: boolean; sourceCount: number; createdAt: string };
export type ConversationDetail = { id: string; title: string; createdAt: string; updatedAt: string; messages: MessageView[] };
export type SendMessageResponse = { conversationId: string; title: string; answer: MessageView };

function toSummary(c: typeof aiConversations.$inferSelect): ConversationSummary {
  return { id: c.id, title: c.title, updatedAt: c.updatedAt.toISOString() };
}

function toView(m: typeof aiMessages.$inferSelect): MessageView {
  return { id: m.id, role: m.role, content: m.content, grounded: m.grounded, sourceCount: m.sourceCount, createdAt: m.createdAt.toISOString() };
}

async function require(campaignId: string, userId: string, conversationId: string): Promise<typeof aiConversations.$inferSelect> {
  const [c] = await db
    .select()
    .from(aiConversations)
    .where(and(eq(aiConversations.id, conversationId), eq(aiConversations.campaignId, campaignId), eq(aiConversations.userId, userId)))
    .limit(1);
  if (!c) throw ApiError.notFound("conversation not found");
  return c;
}

function titleFrom(question: string): string {
  const t = question.trim().replace(/\s+/g, " ");
  return t.length <= 60 ? t : `${t.slice(0, 57).trim()}…`;
}

/** Joins the last user questions with the current one for the retrieval embedding, so
 * short follow-ups inherit the conversation's topic. Doesn't affect what's sent to the model. */
function retrievalQuery(prior: (typeof aiMessages.$inferSelect)[], question: string): string {
  const userMsgs = prior.filter((m) => m.role === "user").map((m) => m.content);
  const topic = userMsgs.slice(Math.max(0, userMsgs.length - RETRIEVAL_CONTEXT_TURNS)).join(" ");
  return topic.trim().length === 0 ? question : `${topic} ${question}`;
}

async function persist(conversationId: string, role: string, content: string, grounded: boolean, sourceCount: number): Promise<typeof aiMessages.$inferSelect> {
  const [m] = await db.insert(aiMessages).values({ conversationId, role, content, grounded, sourceCount }).returning();
  return m;
}

export async function list(campaignId: string, userId: string): Promise<ConversationSummary[]> {
  const rows = await db
    .select()
    .from(aiConversations)
    .where(and(eq(aiConversations.campaignId, campaignId), eq(aiConversations.userId, userId)))
    .orderBy(desc(aiConversations.updatedAt));
  return rows.map(toSummary);
}

export async function create(campaignId: string, userId: string): Promise<ConversationSummary> {
  const [c] = await db.insert(aiConversations).values({ campaignId, userId }).returning();
  return toSummary(c);
}

export async function get(campaignId: string, userId: string, conversationId: string): Promise<ConversationDetail> {
  const c = await require(campaignId, userId, conversationId);
  const msgs = await db.select().from(aiMessages).where(eq(aiMessages.conversationId, c.id)).orderBy(asc(aiMessages.createdAt));
  return { id: c.id, title: c.title, createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(), messages: msgs.map(toView) };
}

export async function deleteConversation(campaignId: string, userId: string, conversationId: string): Promise<void> {
  const c = await require(campaignId, userId, conversationId);
  await db.delete(aiConversations).where(eq(aiConversations.id, c.id)); // messages cascade via FK
}

export async function send(campaignId: string, userId: string, conversationId: string, question: string): Promise<SendMessageResponse> {
  const c = await require(campaignId, userId, conversationId);

  // Prior history (before recording the current question), capped to the last N turns.
  const prior = await db.select().from(aiMessages).where(eq(aiMessages.conversationId, c.id)).orderBy(asc(aiMessages.createdAt));
  const history: Turn[] = prior.slice(Math.max(0, prior.length - HISTORY_TURNS)).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));

  await persist(c.id, "user", question, false, 0);

  const grounding = await rag.retrieve(campaignId, retrievalQuery(prior, question));
  const grounded = grounding.chunks.length > 0;
  const answer = grounded ? await chatModel().generate(question, grounding.chunks, grounding.systemId, history) : FALLBACK;
  const assistant = await persist(c.id, "assistant", answer, grounded, grounding.chunks.length);

  // First question titles the conversation; touches updated_at so it rises in the list.
  const updates: { title?: string; updatedAt: Date } = { updatedAt: new Date() };
  if (prior.length === 0 || c.title === "Nova conversa") {
    updates.title = titleFrom(question);
  }
  const [updatedConversation] = await db.update(aiConversations).set(updates).where(eq(aiConversations.id, c.id)).returning();

  return { conversationId: c.id, title: updatedConversation.title, answer: toView(assistant) };
}
