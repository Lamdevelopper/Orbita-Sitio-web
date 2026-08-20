import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { ARTICLE_DEFAULTS, articleStatuses, homepageSlots } from "../lib/editorial-contract";

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
  externalUrl: text("external_url"),
  coverAlt: text("cover_alt"),
  isCurrent: integer("is_current", { mode: "boolean" }).notNull().default(false),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("editions_slug_uidx").on(table.slug), uniqueIndex("editions_number_uidx").on(table.number)]);

export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  dek: text("dek").notNull().default(""),
  body: text("body").notNull(),
  images: text("images", { mode: "json" }).$type<Array<{ref: string; url: string; caption?: string}>>().notNull().default([]),
  category: text("category").notNull(),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
  heroUrl: text("hero_url"),
  heroCaption: text("hero_caption"),
  homepageSlot: text("homepage_slot", { enum: homepageSlots }).notNull().default(ARTICLE_DEFAULTS.homepageSlot),
  homepageRank: integer("homepage_rank").notNull().default(0),
  authorId: integer("author_id").references(() => authors.id, { onDelete: "restrict" }).notNull(),
  editionId: integer("edition_id").references(() => editions.id, { onDelete: "set null" }),
  status: text("status", { enum: articleStatuses }).notNull().default(ARTICLE_DEFAULTS.status),
  readingMinutes: integer("reading_minutes").notNull().default(ARTICLE_DEFAULTS.readingMinutes),
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

/** Short-lived D1 lease used to serialize homepage placement across isolates. */
export const editorialLocks = sqliteTable("editorial_locks", {
  scope: text("scope").primaryKey(),
  owner: text("owner").notNull(),
  leaseExpiresAt: integer("lease_expires_at").notNull(),
});

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
  // Encrypted fields are nullable only for legacy rows awaiting app-level backfill.
  emailCiphertext: text("email_ciphertext"),
  emailNonce: text("email_nonce"),
  emailBlindIndex: text("email_blind_index"),
  emailMasked: text("email_masked"),
  keyVersion: integer("key_version").notNull().default(1),
  status: text("status", { enum: ["pending", "active", "unsubscribed", "bounced", "needs_reconfirmation"] }).notNull().default("pending"),
  source: text("source").notNull().default("website"),
  consent: integer("consent", { mode: "boolean" }).notNull().default(false),
  consentAt: integer("consent_at", { mode: "timestamp_ms" }),
  confirmedAt: integer("confirmed_at", { mode: "timestamp_ms" }),
  unsubscribedAt: integer("unsubscribed_at", { mode: "timestamp_ms" }),
  bouncedAt: integer("bounced_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  uniqueIndex("subscribers_email_blind_index_uidx").on(table.emailBlindIndex),
  index("subscribers_status_idx").on(table.status),
]);

export const subscriberTokens = sqliteTable("subscriber_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  subscriberId: integer("subscriber_id").references(() => subscribers.id, { onDelete: "cascade" }).notNull(),
  tokenHash: text("token_hash").notNull(),
  purpose: text("purpose", { enum: ["confirm", "unsubscribe"] }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  uniqueIndex("subscriber_tokens_hash_uidx").on(table.tokenHash),
  index("subscriber_tokens_subscriber_idx").on(table.subscriberId, table.purpose),
]);

export const newsletterCampaigns = sqliteTable("newsletter_campaigns", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  publicId: text("public_id").notNull(),
  subject: text("subject").notNull(),
  preheader: text("preheader").notNull().default(""),
  content: text("content", { mode: "json" }).$type<unknown>().notNull().default({ blocks: [] }),
  contentHtml: text("content_html"),
  contentText: text("content_text"),
  status: text("status", { enum: ["draft", "queued", "sending", "sent", "failed", "cancelled"] }).notNull().default("draft"),
  revision: integer("revision").notNull().default(1),
  testedRevision: integer("tested_revision"),
  testSentAt: integer("test_sent_at", { mode: "timestamp_ms" }),
  authorHash: text("author_hash"),
  idempotencyKey: text("idempotency_key"),
  recipientCount: integer("recipient_count").notNull().default(0),
  sentCount: integer("sent_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  queuedAt: integer("queued_at", { mode: "timestamp_ms" }),
  sentAt: integer("sent_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  uniqueIndex("newsletter_campaigns_public_id_uidx").on(table.publicId),
  uniqueIndex("newsletter_campaigns_idempotency_uidx").on(table.idempotencyKey),
  index("newsletter_campaigns_status_idx").on(table.status, table.updatedAt),
]);

export const newsletterDeliveries = sqliteTable("newsletter_deliveries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").references(() => newsletterCampaigns.id, { onDelete: "cascade" }).notNull(),
  subscriberId: integer("subscriber_id").references(() => subscribers.id, { onDelete: "cascade" }).notNull(),
  status: text("status", { enum: ["queued", "sending", "sent", "failed", "bounced", "skipped"] }).notNull().default("queued"),
  providerMessageId: text("provider_message_id"),
  unsubscribeTokenHash: text("unsubscribe_token_hash"),
  attempts: integer("attempts").notNull().default(0),
  nextAttemptAt: integer("next_attempt_at", { mode: "timestamp_ms" }),
  leaseOwner: text("lease_owner"),
  leaseExpiresAt: integer("lease_expires_at", { mode: "timestamp_ms" }),
  providerId: text("provider_id"),
  idempotencyKey: text("idempotency_key"),
  lastError: text("last_error"),
  lastErrorCode: text("last_error_code"),
  sentAt: integer("sent_at", { mode: "timestamp_ms" }),
  deliveredAt: integer("delivered_at", { mode: "timestamp_ms" }),
  openedAt: integer("opened_at", { mode: "timestamp_ms" }),
  clickedAt: integer("clicked_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  uniqueIndex("newsletter_deliveries_campaign_subscriber_uidx").on(table.campaignId, table.subscriberId),
  index("newsletter_deliveries_status_idx").on(table.status, table.nextAttemptAt, table.leaseExpiresAt),
]);

export const newsletterSettings = sqliteTable("newsletter_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  settingKey: text("setting_key").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  organizationName: text("organization_name"),
  postalAddress: text("postal_address"),
  privacyUrl: text("privacy_url"),
  contactUrl: text("contact_url"),
  publicBaseUrl: text("public_base_url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [uniqueIndex("newsletter_settings_key_uidx").on(table.settingKey)]);

export const newsletterAuditEvents = sqliteTable("newsletter_audit_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  actorHash: text("actor_hash"),
  metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>().notNull().default({}),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  index("newsletter_audit_entity_idx").on(table.entityType, table.entityId, table.createdAt),
  index("newsletter_audit_action_idx").on(table.action, table.createdAt),
]);

export const newsletterRateLimits = sqliteTable("newsletter_rate_limits", {
  keyHash: text("key_hash").primaryKey(),
  requestCount: integer("request_count").notNull().default(0),
  windowStartedAt: integer("window_started_at", { mode: "timestamp_ms" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [index("newsletter_rate_limits_expiry_idx").on(table.expiresAt)]);
