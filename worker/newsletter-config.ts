export const NEWSLETTER_SENDER_CONFIG = {
  batchSize: 50,
  maxAttempts: 5,
  leaseMs: 5 * 60 * 1000,
  retryBaseMs: 60 * 1000,
  retryMaxMs: 24 * 60 * 60 * 1000,
} as const;

export type NewsletterSenderEnv = {
  DB: D1Database;
  EMAILFLARE_BASE_URL: string;
  EMAILFLARE_API_KEY: string;
  NEWSLETTER_ENCRYPTION_KEY: string;
  NEWSLETTER_ENCRYPTION_KEYS?: string;
  NEWSLETTER_TOKEN_KEY: string;
  NEWSLETTER_PUBLIC_BASE_URL: string;
  NEWSLETTER_FROM_EMAIL: string;
  NEWSLETTER_FROM_NAME: string;
  NEWSLETTER_REPLY_TO: string;
  NEWSLETTER_ENABLED: string;
};
