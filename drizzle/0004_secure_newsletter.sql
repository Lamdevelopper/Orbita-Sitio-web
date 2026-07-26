-- Newsletter privacy migration.
-- The old table is retained as an internal reconciliation source until the
-- application encrypts each address. It is intentionally not in db/schema.ts.
ALTER TABLE `subscribers` RENAME TO `subscribers_legacy_0004`;
--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email_ciphertext` text,
	`email_nonce` text,
	`email_blind_index` text,
	`email_masked` text,
	`key_version` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL CHECK (`status` IN ('pending', 'active', 'unsubscribed', 'bounced', 'needs_reconfirmation')),
	`source` text DEFAULT 'website' NOT NULL,
	`consent` integer DEFAULT 0 NOT NULL,
	`consent_at` integer,
	`confirmed_at` integer,
	`unsubscribed_at` integer,
	`bounced_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
-- No SQL cipher is available in D1. Preserve identity and timestamps while
-- leaving encrypted columns empty for an application-level backfill.
INSERT INTO `subscribers` (`id`, `status`, `source`, `consent`, `created_at`, `updated_at`)
SELECT `id`, 'needs_reconfirmation', COALESCE(`source`, 'legacy'), 0, `created_at`, `created_at`
FROM `subscribers_legacy_0004`;
--> statement-breakpoint
CREATE UNIQUE INDEX `subscribers_email_blind_index_uidx` ON `subscribers` (`email_blind_index`);
--> statement-breakpoint
CREATE INDEX `subscribers_status_idx` ON `subscribers` (`status`);
--> statement-breakpoint
CREATE TABLE `subscriber_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`subscriber_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`purpose` text NOT NULL CHECK (`purpose` IN ('confirm', 'unsubscribe')),
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`subscriber_id`) REFERENCES `subscribers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscriber_tokens_hash_uidx` ON `subscriber_tokens` (`token_hash`);
--> statement-breakpoint
CREATE INDEX `subscriber_tokens_subscriber_idx` ON `subscriber_tokens` (`subscriber_id`, `purpose`);
--> statement-breakpoint
CREATE TABLE `newsletter_campaigns` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`public_id` text NOT NULL,
	`subject` text NOT NULL,
	`preheader` text DEFAULT '' NOT NULL,
	`content` text DEFAULT '{"blocks":[]}' NOT NULL,
	`content_html` text,
	`content_text` text,
	`status` text DEFAULT 'draft' NOT NULL CHECK (`status` IN ('draft', 'queued', 'sending', 'sent', 'failed', 'cancelled')),
	`revision` integer DEFAULT 1 NOT NULL,
	`tested_revision` integer,
	`test_sent_at` integer,
	`author_hash` text,
	`idempotency_key` text,
	`recipient_count` integer DEFAULT 0 NOT NULL,
	`sent_count` integer DEFAULT 0 NOT NULL,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`queued_at` integer,
	`sent_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_campaigns_public_id_uidx` ON `newsletter_campaigns` (`public_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_campaigns_idempotency_uidx` ON `newsletter_campaigns` (`idempotency_key`);
--> statement-breakpoint
CREATE INDEX `newsletter_campaigns_status_idx` ON `newsletter_campaigns` (`status`, `updated_at`);
--> statement-breakpoint
CREATE TABLE `newsletter_deliveries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`campaign_id` integer NOT NULL,
	`subscriber_id` integer NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL CHECK (`status` IN ('queued', 'sending', 'sent', 'failed', 'bounced', 'skipped')),
	`provider_message_id` text,
	`unsubscribe_token_hash` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` integer,
	`lease_owner` text,
	`lease_expires_at` integer,
	`provider_id` text,
	`idempotency_key` text,
	`last_error` text,
	`last_error_code` text,
	`sent_at` integer,
	`delivered_at` integer,
	`opened_at` integer,
	`clicked_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`campaign_id`) REFERENCES `newsletter_campaigns`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subscriber_id`) REFERENCES `subscribers`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_deliveries_campaign_subscriber_uidx` ON `newsletter_deliveries` (`campaign_id`, `subscriber_id`);
--> statement-breakpoint
CREATE INDEX `newsletter_deliveries_status_idx` ON `newsletter_deliveries` (`status`, `next_attempt_at`, `lease_expires_at`);
--> statement-breakpoint
CREATE TABLE `newsletter_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`setting_key` text DEFAULT 'default' NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`organization_name` text,
	`postal_address` text,
	`privacy_url` text,
	`contact_url` text,
	`public_base_url` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `newsletter_settings_key_uidx` ON `newsletter_settings` (`setting_key`);
--> statement-breakpoint
CREATE TABLE `newsletter_audit_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` integer,
	`actor_hash` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `newsletter_audit_entity_idx` ON `newsletter_audit_events` (`entity_type`, `entity_id`, `created_at`);
--> statement-breakpoint
CREATE INDEX `newsletter_audit_action_idx` ON `newsletter_audit_events` (`action`, `created_at`);
--> statement-breakpoint
CREATE TABLE `newsletter_rate_limits` (
	`key_hash` text PRIMARY KEY NOT NULL,
	`request_count` integer DEFAULT 0 NOT NULL,
	`window_started_at` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `newsletter_rate_limits_expiry_idx` ON `newsletter_rate_limits` (`expires_at`);
