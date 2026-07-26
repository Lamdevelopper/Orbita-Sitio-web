import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { newsletterCampaigns, newsletterDeliveries, subscriberTokens, subscribers } from "../db/schema";
import { EmailFlareError, sendEmailFlare } from "../lib/emailflare";
import { decryptEmail, hashToken, hmacValue } from "../lib/newsletter-crypto";
import { UNSUBSCRIBE_PLACEHOLDER } from "../lib/newsletter-render";
import { providerOutcome } from "../lib/newsletter-retry";
import { NEWSLETTER_SENDER_CONFIG, type NewsletterSenderEnv } from "./newsletter-config";

function normalizedError(error: unknown, attempt: number) {
  if (error instanceof EmailFlareError) {
    return providerOutcome(error.status, error.message.includes("timeout"), attempt, NEWSLETTER_SENDER_CONFIG.maxAttempts);
  }
  return {
    success: false,
    retry: attempt < NEWSLETTER_SENDER_CONFIG.maxAttempts,
    code: "delivery_error",
    delayMs: Math.min(NEWSLETTER_SENDER_CONFIG.retryMaxMs, NEWSLETTER_SENDER_CONFIG.retryBaseMs * 2 ** Math.max(0, attempt - 1)),
  };
}

function encryptionKey(env: NewsletterSenderEnv, version: number): string {
  if (env.NEWSLETTER_ENCRYPTION_KEYS) {
    const keys = JSON.parse(env.NEWSLETTER_ENCRYPTION_KEYS) as Record<string, unknown>;
    const key = keys[String(version)];
    if (typeof key === "string" && key) return key;
  }
  return env.NEWSLETTER_ENCRYPTION_KEY;
}

export async function sendNewsletterBatch(env: NewsletterSenderEnv) {
  if (env.NEWSLETTER_ENABLED !== "true") return { claimed: 0, paused: true };
  const db = drizzle(env.DB);
  const now = new Date();
  const claimable = and(
    or(
      eq(newsletterDeliveries.status, "queued"),
      and(eq(newsletterDeliveries.status, "sending"), lte(newsletterDeliveries.leaseExpiresAt, now)),
    ),
    or(isNull(newsletterDeliveries.nextAttemptAt), lte(newsletterDeliveries.nextAttemptAt, now)),
  );
  const candidates = await db.select().from(newsletterDeliveries).where(claimable).limit(NEWSLETTER_SENDER_CONFIG.batchSize);
  const touchedCampaigns = new Set<number>();

  const processDelivery = async (delivery: (typeof candidates)[number]) => {
    const leaseOwner = crypto.randomUUID();
    const leaseExpiresAt = new Date(Date.now() + NEWSLETTER_SENDER_CONFIG.leaseMs);
    const attempts = delivery.attempts + 1;
    const [claimed] = await db.update(newsletterDeliveries).set({ status: "sending", leaseOwner, leaseExpiresAt, attempts, updatedAt: new Date() }).where(and(eq(newsletterDeliveries.id, delivery.id), claimable)).returning();
    if (!claimed) return;
    touchedCampaigns.add(delivery.campaignId);

    try {
      const [subscriber] = await db.select().from(subscribers).where(eq(subscribers.id, delivery.subscriberId)).limit(1);
      const [campaign] = await db.select().from(newsletterCampaigns).where(eq(newsletterCampaigns.id, delivery.campaignId)).limit(1);
      if (!subscriber || subscriber.status !== "active" || !subscriber.emailCiphertext || !subscriber.emailNonce || !campaign?.contentHtml || !campaign.contentText) {
        await db.update(newsletterDeliveries).set({ status: "skipped", lastErrorCode: "recipient_unavailable", lastError: "Recipient unavailable", leaseOwner: null, leaseExpiresAt: null, updatedAt: new Date() }).where(eq(newsletterDeliveries.id, delivery.id));
        return;
      }

      const unsubscribeToken = await hmacValue(`unsubscribe:${delivery.id}:${subscriber.id}`, env.NEWSLETTER_TOKEN_KEY);
      const unsubscribeTokenHash = await hashToken(unsubscribeToken);
      await db.insert(subscriberTokens).values({
        subscriberId: subscriber.id,
        purpose: "unsubscribe",
        tokenHash: unsubscribeTokenHash,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      }).onConflictDoNothing();
      const unsubscribeUrl = `${env.NEWSLETTER_PUBLIC_BASE_URL.replace(/\/$/, "")}/api/subscribers/unsubscribe/${encodeURIComponent(unsubscribeToken)}`;
      const html = campaign.contentHtml.replaceAll(UNSUBSCRIBE_PLACEHOLDER, unsubscribeUrl);
      const text = campaign.contentText.replaceAll(UNSUBSCRIBE_PLACEHOLDER, unsubscribeUrl);
      const recipient = await decryptEmail({ ciphertext: subscriber.emailCiphertext, nonce: subscriber.emailNonce, keyVersion: subscriber.keyVersion }, encryptionKey(env, subscriber.keyVersion));
      const sent = await sendEmailFlare({
        to: recipient,
        subject: campaign.subject,
        html,
        text,
        unsubscribeUrl,
        idempotencyKey: delivery.idempotencyKey ?? `${campaign.id}:${delivery.id}`,
      }, env as unknown as Record<string, unknown>);
      await db.update(newsletterDeliveries).set({ status: "sent", providerId: sent.providerId, unsubscribeTokenHash, sentAt: new Date(), lastError: null, lastErrorCode: null, leaseOwner: null, leaseExpiresAt: null, updatedAt: new Date() }).where(eq(newsletterDeliveries.id, delivery.id));
    } catch (error) {
      const normalized = normalizedError(error, attempts);
      await db.update(newsletterDeliveries).set({
        status: normalized.retry ? "queued" : "failed",
        nextAttemptAt: normalized.retry ? new Date(Date.now() + normalized.delayMs) : null,
        lastError: normalized.code,
        lastErrorCode: normalized.code,
        leaseOwner: null,
        leaseExpiresAt: null,
        updatedAt: new Date(),
      }).where(eq(newsletterDeliveries.id, delivery.id));
    }
  };
  for (let offset = 0; offset < candidates.length; offset += 10) {
    await Promise.all(candidates.slice(offset, offset + 10).map(processDelivery));
  }

  for (const campaignId of touchedCampaigns) {
    const counts = await db.select({ status: newsletterDeliveries.status, count: sql<number>`count(*)` }).from(newsletterDeliveries).where(eq(newsletterDeliveries.campaignId, campaignId)).groupBy(newsletterDeliveries.status);
    const count = (status: string) => Number(counts.find((item) => item.status === status)?.count ?? 0);
    const pending = count("queued") + count("sending");
    const sent = count("sent");
    const failed = count("failed") + count("bounced") + count("skipped");
    await db.update(newsletterCampaigns).set({
      status: pending ? "sending" : sent ? "sent" : "failed",
      sentCount: sent,
      failedCount: failed,
      sentAt: pending ? null : new Date(),
      updatedAt: new Date(),
    }).where(eq(newsletterCampaigns.id, campaignId));
  }
  return { claimed: candidates.length, paused: false };
}

const newsletterSender = {
  scheduled(_controller: ScheduledController, env: NewsletterSenderEnv, context: ExecutionContext) {
    context.waitUntil(sendNewsletterBatch(env));
  },
};

export default newsletterSender;
