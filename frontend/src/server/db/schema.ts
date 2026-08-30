import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * pgvector column type. Drizzle has no built-in `vector` type, so we round-trip
 * as the Postgres array literal `[v0,v1,...]` (same serialization the Java
 * backend used) and cast with `::vector` on write.
 */
const vector = (dimensions: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType() {
      return `vector(${dimensions})`;
    },
    toDriver(value: number[]) {
      return `[${value.join(",")}]`;
    },
    fromDriver(value: string) {
      return value
        .slice(1, -1)
        .split(",")
        .filter((v) => v.length > 0)
        .map(Number);
    },
  });

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const rpgSystems = pgTable("rpg_systems", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  // V2: default is 'v5' at the DB level (the app-layer default-on-null-update
  // behavior is handled in the system service, not here — see V5Engine notes).
  ruleset: varchar("ruleset", { length: 32 }).notNull().default("v5"),
});

export const systemSheetSchema = pgTable("system_sheet_schema", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  systemId: uuid("system_id")
    .notNull()
    .unique()
    .references(() => rpgSystems.id, { onDelete: "cascade" }),
  schema: jsonb("schema").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

export const systemDocuments = pgTable("system_documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  systemId: uuid("system_id")
    .notNull()
    .references(() => rpgSystems.id, { onDelete: "cascade" }),
  fileUrl: varchar("file_url", { length: 1024 }).notNull(),
  status: varchar("status", { length: 32 }).notNull().default("PENDING"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// document_chunks is queried mostly via raw SQL (see rag/chunkStore.ts) because
// the similarity search needs `SET LOCAL ivfflat.probes` + the `<=>` operator,
// but the table is still declared here for inserts/deletes via Drizzle.
export const documentChunks = pgTable(
  "document_chunks",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    documentId: uuid("document_id")
      .notNull()
      .references(() => systemDocuments.id, { onDelete: "cascade" }),
    systemId: uuid("system_id")
      .notNull()
      .references(() => rpgSystems.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    embedding: vector(1024)("embedding"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("idx_document_chunks_system").on(t.systemId)],
);

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Intentionally NO onDelete cascade: deleting a system while campaigns
  // reference it is blocked at the app layer with a friendly 409 instead of
  // a DB FK error. Preserve this asymmetry — every other campaign-owned
  // table below DOES cascade from `campaigns`.
  systemId: uuid("system_id")
    .notNull()
    .references(() => rpgSystems.id),
  masterId: uuid("master_id")
    .notNull()
    .references(() => users.id),
  inviteCode: varchar("invite_code", { length: 64 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  // V4
  bannerUrl: text("banner_url"),
  theme: varchar("theme", { length: 32 }),
});

export const campaignMembers = pgTable(
  "campaign_members",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 16 }).notNull(), // MASTER | PLAYER
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [
    unique("uk_campaign_member").on(t.campaignId, t.userId),
    index("idx_campaign_members_user").on(t.userId),
  ],
);

export const characters = pgTable(
  "characters",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    // Nulo = ficha "avulsa" do jogador (fica em Personagens, fora de qualquer mesa).
    // Ao adicionar a uma campanha, criamos uma CÓPIA com este campo preenchido —
    // o template avulso continua do jogador, reutilizável em outras mesas.
    campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "cascade" }),
    playerId: uuid("player_id")
      .notNull()
      .references(() => users.id),
    // Sistema da ficha. Usado para o schema/ruleset quando não há campanha (avulsa);
    // nas fichas de campanha o sistema também vem daqui (preenchido = o da campanha).
    systemId: uuid("system_id").references(() => rpgSystems.id),
    name: varchar("name", { length: 255 }).notNull(),
    sheetData: jsonb("sheet_data").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("idx_characters_campaign").on(t.campaignId), index("idx_characters_player").on(t.playerId)],
);

// V3
export const campaignBoardItems = pgTable(
  "campaign_board_items",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }),
    body: text("body"),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("idx_board_items_campaign").on(t.campaignId, t.sortOrder, t.createdAt)],
);

/**
 * Imagens enviadas do dispositivo do mestre para o mural. Guardadas no próprio banco
 * (não em object storage) de propósito: o mural é pequeno — poucas dezenas de imagens
 * por campanha — e assim a feature funciona em qualquer ambiente sem depender de bucket
 * configurado. As imagens são comprimidas no navegador antes do upload (ver
 * CampaignBoard), então cada linha fica na casa das centenas de KB.
 *
 * O board guarda só a URL da rota que serve estes bytes, nunca o base64 inline — assim
 * a listagem do mural continua leve e o navegador cacheia cada imagem separadamente.
 */
export const campaignMedia = pgTable(
  "campaign_media",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    uploadedBy: uuid("uploaded_by")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contentType: varchar("content_type", { length: 100 }).notNull(),
    bytes: customType<{ data: Buffer; driverData: Buffer }>({
      dataType() {
        return "bytea";
      },
    })("bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("idx_campaign_media_campaign").on(t.campaignId, t.createdAt)],
);

/**
 * Histórico de rolagens da mesa. Antes a rolagem era só client-side (Math.random no
 * navegador) e sumia no reload, então o mestre não tinha como conferir o que cada
 * jogador tirou. Guardamos o RESULTADO já apurado (dados, sucessos, desfecho), não só
 * a entrada, para o mestre ver exatamente o que o jogador viu.
 */
export const campaignRolls = pgTable(
  "campaign_rolls",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Personagem usado na rolagem, quando ela partiu de uma ficha. Sem cascade de
    // exclusão de ficha: o histórico da mesa sobrevive à ficha ser apagada.
    characterName: varchar("character_name", { length: 255 }),
    /** O que foi rolado: "Vigor + Briga", "Rouse Check", "Reserva manual"… */
    label: varchar("label", { length: 255 }).notNull(),
    pool: integer("pool").notNull(),
    hunger: integer("hunger").notNull(),
    difficulty: integer("difficulty").notNull(),
    /** [{ v: 1..10, hunger: bool }] — as faces exatas que saíram. */
    dice: jsonb("dice").notNull(),
    successes: integer("successes").notNull(),
    /** SUCESSO | CRITICO | CRITICO_CONFUSO | FALHA | FALHA_BESTIAL | ROUSE_OK | ROUSE_FALHA */
    outcome: varchar("outcome", { length: 32 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("idx_campaign_rolls_campaign").on(t.campaignId, t.createdAt)],
);

// V5
export const campaignNotes = pgTable(
  "campaign_notes",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }),
    body: text("body").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("idx_campaign_notes_campaign").on(t.campaignId, t.authorId, t.updatedAt)],
);

// V6
export const aiConversations = pgTable(
  "ai_conversations",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull().default("Nova conversa"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("idx_ai_conversations_owner").on(t.campaignId, t.userId, t.updatedAt)],
);

export const aiMessages = pgTable(
  "ai_messages",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => aiConversations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 16 }).notNull(), // user | assistant
    content: text("content").notNull(),
    grounded: boolean("grounded").notNull().default(false),
    sourceCount: integer("source_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [index("idx_ai_messages_conversation").on(t.conversationId, t.createdAt)],
);

// V8 — no FK to rpg_systems (plain UUID column), matches the Java entity exactly.
export const powerExplanations = pgTable(
  "power_explanations",
  {
    systemId: uuid("system_id").notNull(),
    powerNorm: text("power_norm").notNull(),
    power: text("power").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  },
  (t) => [primaryKey({ columns: [t.systemId, t.powerNorm] })],
);
