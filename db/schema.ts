import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const authors = sqliteTable("authors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  bio: text("bio").notNull().default(""),
  area: text("area").notNull().default(""),
  avatarUrl: text("avatar_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("authors_slug_uidx").on(table.slug)]);

export const editions = sqliteTable("editions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  number: integer("number").notNull(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  summary: text("summary").notNull().default(""),
  coverUrl: text("cover_url"),
  pdfUrl: text("pdf_url"),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("editions_slug_uidx").on(table.slug), uniqueIndex("editions_number_uidx").on(table.number)]);

export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  dek: text("dek").notNull().default(""),
  body: text("body").notNull(),
  category: text("category").notNull(),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
  heroUrl: text("hero_url"),
  authorId: integer("author_id").references(() => authors.id, { onDelete: "restrict" }).notNull(),
  editionId: integer("edition_id").references(() => editions.id, { onDelete: "set null" }),
  status: text("status", { enum: ["draft", "review", "scheduled", "published", "archived"] }).notNull().default("draft"),
  readingMinutes: integer("reading_minutes").notNull().default(5),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  uniqueIndex("articles_slug_uidx").on(table.slug),
  index("articles_status_published_idx").on(table.status, table.publishedAt),
  index("articles_category_idx").on(table.category),
  index("articles_author_idx").on(table.authorId),
  index("articles_edition_idx").on(table.editionId),
]);

export const audienceEvents = sqliteTable("audience_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  anonymousId: text("anonymous_id").notNull(),
  sessionId: text("session_id").notNull(),
  eventName: text("event_name").notNull(),
  articleSlug: text("article_slug"),
  path: text("path").notNull(),
  referrerHost: text("referrer_host"),
  properties: text("properties", { mode: "json" }).$type<Record<string, unknown>>().notNull().default({}),
  occurredAt: integer("occurred_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  index("events_name_time_idx").on(table.eventName, table.occurredAt),
  index("events_article_time_idx").on(table.articleSlug, table.occurredAt),
  index("events_session_idx").on(table.sessionId),
]);

export const subscribers = sqliteTable("subscribers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull(),
  status: text("status", { enum: ["active", "unsubscribed"] }).notNull().default("active"),
  source: text("source").notNull().default("website"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("subscribers_email_uidx").on(table.email)]);
