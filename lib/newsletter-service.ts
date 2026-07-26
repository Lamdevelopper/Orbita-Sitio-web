import { and, desc, eq, gte, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { env } from "cloudflare:workers";
import { getDb } from "../db";
import {
  newsletterAuditEvents,
  newsletterCampaigns,
  newsletterRateLimits,
  newsletterSettings,
  subscriberTokens,
  subscribers,
} from "../db/schema";
import { isEditor } from "./api";
import { blindIndex, encryptEmail, generateToken, hashToken, hmacValue, maskEmail, normalizeEmail } from "./newsletter-crypto";
import { isSubscriberStatus, sanitizeAuditMetadata, toMaskedSubscriberDto, validateNewsletterContent, type MaskedSubscriberDto } from "./newsletter-model";

type NewsletterRuntime = {
  NEWSLETTER_ENCRYPTION_KEY?: string;
  NEWSLETTER_ENCRYPTION_KEYS?: string;
  NEWSLETTER_INDEX_KEY?: string;
  NEWSLETTER_KEY_VERSION?: string;
  NEWSLETTER_ENABLED?: string;
  NEWSLETTER_FROM_EMAIL?: string;
  NEWSLETTER_FROM_NAME?: string;
  NEWSLETTER_REPLY_TO?: string;
  NEWSLETTER_FROM_VERIFIED?: string;
  EMAILFLARE_BASE_URL?: string;
  EMAILFLARE_API_KEY?: string;
};

export type NewsletterSettingsInput = {
  enabled: boolean;
  organizationName: string;
  postalAddress: string;
  privacyUrl: string;
  contactUrl: string;
  publicBaseUrl: string;
};

export type NewsletterSettingsDto = NewsletterSettingsInput & {
  fromEmail: string;
  fromName: string;
  replyTo: string;
  fromVerified: boolean;
  readyToSend: boolean;
  missingConfiguration: string[];
};

function runtime(): NewsletterRuntime {
  return env as unknown as NewsletterRuntime;
}

function requiredSecret(name: keyof NewsletterRuntime): string {
  const value = runtime()[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function currentKeyVersion(): number {
  const value = Number(runtime().NEWSLETTER_KEY_VERSION ?? 1);
  return Number.isSafeInteger(value) && value > 0 ? value : 1;
}

function currentEncryptionKey(): string {
  const rt = runtime();
  if (rt.NEWSLETTER_ENCRYPTION_KEYS) {
    try {
      const keys = JSON.parse(rt.NEWSLETTER_ENCRYPTION_KEYS) as Record<string, unknown>;
      const value = keys[String(currentKeyVersion())];
      if (typeof value === "string" && value) return value;
    } catch { throw new Error("NEWSLETTER_ENCRYPTION_KEYS is invalid"); }
  }
  return requiredSecret("NEWSLETTER_ENCRYPTION_KEY");
}

export function newPublicId(): string {
  return `${Date.now().toString(36)}-${generateToken(9)}`;
}

export function adminGuard(request: Request): Response | null {
  if (!isEditor(request)) return Response.json({ error: "No autorizado" }, { status: 401 });
  const origin = request.headers.get("origin");
  if (!origin) return null;
  try {
    if (new URL(origin).origin !== new URL(request.url).origin) {
      return Response.json({ error: "Origen no permitido" }, { status: 403 });
    }
  } catch {
    return Response.json({ error: "Origen no permitido" }, { status: 403 });
  }
  return null;
}

export function editorEmail(request: Request): string | null {
  const value = request.headers.get("oai-authenticated-user-email");
  if (!value) return null;
  try { return normalizeSubscriberEmail(value); } catch { return null; }
}

export function normalizeSubscriberEmail(value: unknown): string {
  const email = normalizeEmail(typeof value === "string" ? value : "");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Correo invalido");
  return email;
}

export async function issueSubscriberToken(
  subscriberId: number,
  purpose: "confirm" | "unsubscribe",
  expiresInMs = 86_400_000,
): Promise<string> {
  const token = generateToken();
  await getDb().update(subscriberTokens).set({ usedAt: new Date() }).where(and(
    eq(subscriberTokens.subscriberId, subscriberId),
    eq(subscriberTokens.purpose, purpose),
    isNull(subscriberTokens.usedAt),
  ));
  await getDb().insert(subscriberTokens).values({
    subscriberId,
    purpose,
    tokenHash: await hashToken(token),
    expiresAt: new Date(Date.now() + expiresInMs),
    usedAt: null,
    createdAt: new Date(),
  });
  return token;
}

export async function upsertPendingSubscriber(
  emailInput: unknown,
  source = "website",
): Promise<{ subscriberId: number; token: string | null; recipient: string }> {
  const email = normalizeSubscriberEmail(emailInput);
  const index = await blindIndex(email, requiredSecret("NEWSLETTER_INDEX_KEY"));
  const db = getDb();
  const [existing] = await db.select().from(subscribers).where(eq(subscribers.emailBlindIndex, index)).limit(1);
  if (existing?.status === "active") return { subscriberId: existing.id, token: null, recipient: email };

  const encrypted = await encryptEmail(email, currentEncryptionKey(), currentKeyVersion());
  const now = new Date();
  let subscriberId: number;
  if (existing) {
    subscriberId = existing.id;
    await db.update(subscribers).set({
      emailCiphertext: encrypted.ciphertext,
      emailNonce: encrypted.nonce,
      emailMasked: maskEmail(email),
      keyVersion: encrypted.keyVersion,
      status: "pending",
      source: source.slice(0, 80),
      consent: true,
      consentAt: now,
      unsubscribedAt: null,
      bouncedAt: null,
      updatedAt: now,
    }).where(eq(subscribers.id, subscriberId));
  } else {
    const [created] = await db.insert(subscribers).values({
      emailCiphertext: encrypted.ciphertext,
      emailNonce: encrypted.nonce,
      emailBlindIndex: index,
      emailMasked: maskEmail(email),
      keyVersion: encrypted.keyVersion,
      status: "pending",
      source: source.slice(0, 80),
      consent: true,
      consentAt: now,
      createdAt: now,
      updatedAt: now,
    }).returning({ id: subscribers.id });
    subscriberId = created.id;
  }
  return { subscriberId, token: await issueSubscriberToken(subscriberId, "confirm"), recipient: email };
}

async function consumeToken(token: string, purpose: "confirm" | "unsubscribe"): Promise<{ subscriberId: number; alreadyUsed: boolean } | null> {
  const tokenHash = await hashToken(token);
  const db = getDb();
  const [consumed] = await db.update(subscriberTokens).set({ usedAt: new Date() }).where(and(
    eq(subscriberTokens.tokenHash, tokenHash),
    eq(subscriberTokens.purpose, purpose),
    isNull(subscriberTokens.usedAt),
    gte(subscriberTokens.expiresAt, new Date()),
  )).returning({ subscriberId: subscriberTokens.subscriberId });
  if (consumed) return { subscriberId: consumed.subscriberId, alreadyUsed: false };

  const [known] = await db.select({ subscriberId: subscriberTokens.subscriberId }).from(subscriberTokens).where(and(
    eq(subscriberTokens.tokenHash, tokenHash),
    eq(subscriberTokens.purpose, purpose),
    isNotNull(subscriberTokens.usedAt),
  )).limit(1);
  return known ? { subscriberId: known.subscriberId, alreadyUsed: true } : null;
}

export async function confirmSubscriber(token: string): Promise<boolean> {
  const consumed = await consumeToken(token, "confirm");
  if (!consumed) return false;
  if (!consumed.alreadyUsed) {
    const now = new Date();
    await getDb().update(subscribers).set({ status: "active", confirmedAt: now, updatedAt: now }).where(eq(subscribers.id, consumed.subscriberId));
  }
  return true;
}

export async function unsubscribeSubscriber(token: string): Promise<boolean> {
  const consumed = await consumeToken(token, "unsubscribe");
  if (!consumed) return false;
  const now = new Date();
  await getDb().update(subscribers).set({ status: "unsubscribed", unsubscribedAt: now, updatedAt: now }).where(eq(subscribers.id, consumed.subscriberId));
  return true;
}

const maskedSelection = {
  id: subscribers.id,
  emailMasked: subscribers.emailMasked,
  status: subscribers.status,
  source: subscribers.source,
  consent: subscribers.consent,
  consentAt: subscribers.consentAt,
  confirmedAt: subscribers.confirmedAt,
  unsubscribedAt: subscribers.unsubscribedAt,
  bouncedAt: subscribers.bouncedAt,
  createdAt: subscribers.createdAt,
  updatedAt: subscribers.updatedAt,
};

export async function listMaskedSubscribers(options: { status?: string; exactEmail?: string; limit?: number } = {}): Promise<MaskedSubscriberDto[]> {
  const limit = Math.max(1, Math.min(200, options.limit ?? 100));
  const db = getDb();
  if (options.exactEmail) {
    const index = await blindIndex(normalizeSubscriberEmail(options.exactEmail), requiredSecret("NEWSLETTER_INDEX_KEY"));
    return (await db.select(maskedSelection).from(subscribers).where(eq(subscribers.emailBlindIndex, index)).limit(1)).map(toMaskedSubscriberDto);
  }
  if (options.status && isSubscriberStatus(options.status)) {
    return (await db.select(maskedSelection).from(subscribers).where(eq(subscribers.status, options.status)).orderBy(desc(subscribers.createdAt)).limit(limit)).map(toMaskedSubscriberDto);
  }
  return (await db.select(maskedSelection).from(subscribers).orderBy(desc(subscribers.createdAt)).limit(limit)).map(toMaskedSubscriberDto);
}

export async function suppressSubscriber(id: number): Promise<MaskedSubscriberDto | null> {
  const now = new Date();
  const [row] = await getDb().update(subscribers).set({ status: "unsubscribed", unsubscribedAt: now, updatedAt: now }).where(eq(subscribers.id, id)).returning(maskedSelection);
  return row ? toMaskedSubscriberDto(row) : null;
}

export async function subscriberMetrics(): Promise<Record<string, number>> {
  const rows = await getDb().select({ status: subscribers.status, count: sql<number>`count(*)` }).from(subscribers).groupBy(subscribers.status);
  const metrics = { total: 0, pending: 0, active: 0, unsubscribed: 0, bounced: 0, needs_reconfirmation: 0 };
  for (const row of rows) {
    const count = Number(row.count);
    metrics.total += count;
    metrics[row.status] = count;
  }
  return metrics;
}

export async function getCampaign(publicId: string) {
  return (await getDb().select().from(newsletterCampaigns).where(eq(newsletterCampaigns.publicId, publicId)).limit(1))[0] ?? null;
}

export function parseCampaignContent(value: unknown) {
  if (typeof value !== "string") return validateNewsletterContent(value);
  return validateNewsletterContent(JSON.parse(value));
}

export function campaignDto(campaign: typeof newsletterCampaigns.$inferSelect, includeContent = true) {
  return {
    publicId: campaign.publicId,
    subject: campaign.subject,
    preheader: campaign.preheader,
    ...(includeContent ? { content: campaign.content, html: campaign.contentHtml, text: campaign.contentText } : {}),
    status: campaign.status,
    revision: campaign.revision,
    testedRevision: campaign.testedRevision,
    testSentAt: campaign.testSentAt,
    recipientCount: campaign.recipientCount,
    sentCount: campaign.sentCount,
    failedCount: campaign.failedCount,
    queuedAt: campaign.queuedAt,
    sentAt: campaign.sentAt,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  };
}

export async function getNewsletterSettings(): Promise<NewsletterSettingsDto> {
  const [stored] = await getDb().select().from(newsletterSettings).where(eq(newsletterSettings.settingKey, "default")).limit(1);
  const rt = runtime();
  const base: NewsletterSettingsInput = {
    enabled: stored?.enabled ?? false,
    organizationName: stored?.organizationName ?? "",
    postalAddress: stored?.postalAddress ?? "",
    privacyUrl: stored?.privacyUrl ?? "",
    contactUrl: stored?.contactUrl ?? "",
    publicBaseUrl: stored?.publicBaseUrl ?? "",
  };
  const fromEmail = rt.NEWSLETTER_FROM_EMAIL ?? "";
  const fromName = rt.NEWSLETTER_FROM_NAME ?? "Orbita";
  const replyTo = rt.NEWSLETTER_REPLY_TO ?? "";
  const fromVerified = rt.NEWSLETTER_FROM_VERIFIED === "true";
  const missingConfiguration = [
    !base.organizationName && "organizationName",
    !base.postalAddress && "postalAddress",
    !base.privacyUrl && "privacyUrl",
    !base.contactUrl && "contactUrl",
    !base.publicBaseUrl && "publicBaseUrl",
    !fromEmail && "fromEmail",
    !replyTo && "replyTo",
    !fromVerified && "fromVerified",
    !rt.EMAILFLARE_BASE_URL && "emailFlareBaseUrl",
    !rt.EMAILFLARE_API_KEY && "emailFlareApiKey",
    rt.NEWSLETTER_ENABLED !== "true" && "featureFlag",
  ].filter((value): value is string => Boolean(value));
  return { ...base, fromEmail, fromName, replyTo, fromVerified, readyToSend: base.enabled && missingConfiguration.length === 0, missingConfiguration };
}

export async function saveNewsletterSettings(input: Partial<NewsletterSettingsInput>): Promise<NewsletterSettingsDto> {
  const [current] = await getDb().select().from(newsletterSettings).where(eq(newsletterSettings.settingKey, "default")).limit(1);
  const now = new Date();
  const cleanUrl = (value: unknown) => {
    if (typeof value !== "string" || !value.trim()) return "";
    const parsed = new URL(value.trim());
    if (parsed.protocol !== "https:") throw new Error("Las URLs de newsletter deben usar HTTPS");
    return parsed.toString();
  };
  const values = {
    enabled: typeof input.enabled === "boolean" ? input.enabled : current?.enabled ?? false,
    organizationName: typeof input.organizationName === "string" ? input.organizationName.trim().slice(0, 160) : current?.organizationName ?? "",
    postalAddress: typeof input.postalAddress === "string" ? input.postalAddress.trim().slice(0, 500) : current?.postalAddress ?? "",
    privacyUrl: input.privacyUrl === undefined ? current?.privacyUrl ?? "" : cleanUrl(input.privacyUrl),
    contactUrl: input.contactUrl === undefined ? current?.contactUrl ?? "" : cleanUrl(input.contactUrl),
    publicBaseUrl: input.publicBaseUrl === undefined ? current?.publicBaseUrl ?? "" : cleanUrl(input.publicBaseUrl).replace(/\/$/, ""),
    updatedAt: now,
  };
  if (current) await getDb().update(newsletterSettings).set(values).where(eq(newsletterSettings.id, current.id));
  else await getDb().insert(newsletterSettings).values({ settingKey: "default", ...values, createdAt: now });
  return getNewsletterSettings();
}

export async function writeAudit(action: string, entityType: string, entityId: number | null, actor: string | null, metadata: Record<string, unknown> = {}) {
  const actorHash = await hashActor(actor);
  await getDb().insert(newsletterAuditEvents).values({ action, entityType, entityId, actorHash, metadata: sanitizeAuditMetadata(metadata), createdAt: new Date() });
}

export async function hashActor(actor: string | null): Promise<string | null> {
  return actor ? hmacValue(`actor:${normalizeEmail(actor)}`, requiredSecret("NEWSLETTER_INDEX_KEY")) : null;
}

export async function checkSubscriberRateLimit(ip: string): Promise<{ allowed: boolean; retryAfter: number }> {
  const keyHash = await hmacValue(`subscribe-ip:${ip}`, requiredSecret("NEWSLETTER_INDEX_KEY"));
  const db = getDb();
  const now = new Date();
  const windowMs = 15 * 60 * 1000;
  const expiresAt = new Date(now.getTime() + windowMs);
  const expired = sql`${newsletterRateLimits.expiresAt} <= ${now.getTime()}`;
  const [row] = await db.insert(newsletterRateLimits).values({ keyHash, requestCount: 1, windowStartedAt: now, expiresAt }).onConflictDoUpdate({
    target: newsletterRateLimits.keyHash,
    set: {
      requestCount: sql`CASE WHEN ${expired} THEN 1 ELSE ${newsletterRateLimits.requestCount} + 1 END`,
      windowStartedAt: sql`CASE WHEN ${expired} THEN ${now.getTime()} ELSE ${newsletterRateLimits.windowStartedAt} END`,
      expiresAt: sql`CASE WHEN ${expired} THEN ${expiresAt.getTime()} ELSE ${newsletterRateLimits.expiresAt} END`,
    },
  }).returning();
  await db.delete(newsletterRateLimits).where(lt(newsletterRateLimits.expiresAt, new Date(now.getTime() - 24 * 60 * 60 * 1000)));
  return row.requestCount <= 3
    ? { allowed: true, retryAfter: 0 }
    : { allowed: false, retryAfter: Math.max(1, Math.ceil((row.expiresAt.getTime() - now.getTime()) / 1000)) };
}

export function publicCampaignPayload(campaign: typeof newsletterCampaigns.$inferSelect) {
  return campaign.status === "sent" ? {
    publicId: campaign.publicId,
    subject: campaign.subject,
    preheader: campaign.preheader,
    html: campaign.contentHtml,
    text: campaign.contentText,
    sentAt: campaign.sentAt,
  } : null;
}
