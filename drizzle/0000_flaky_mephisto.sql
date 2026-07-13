CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`dek` text DEFAULT '' NOT NULL,
	`body` text NOT NULL,
	`category` text NOT NULL,
	`tags` text DEFAULT '[]' NOT NULL,
	`hero_url` text,
	`author_id` integer NOT NULL,
	`edition_id` integer,
	`status` text DEFAULT 'draft' NOT NULL,
	`reading_minutes` integer DEFAULT 5 NOT NULL,
	`seo_title` text,
	`seo_description` text,
	`published_at` integer,
	`updated_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`edition_id`) REFERENCES `editions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `articles_slug_uidx` ON `articles` (`slug`);--> statement-breakpoint
CREATE INDEX `articles_status_published_idx` ON `articles` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `articles_category_idx` ON `articles` (`category`);--> statement-breakpoint
CREATE INDEX `articles_author_idx` ON `articles` (`author_id`);--> statement-breakpoint
CREATE INDEX `articles_edition_idx` ON `articles` (`edition_id`);--> statement-breakpoint
CREATE TABLE `audience_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`anonymous_id` text NOT NULL,
	`session_id` text NOT NULL,
	`event_name` text NOT NULL,
	`article_slug` text,
	`path` text NOT NULL,
	`referrer_host` text,
	`properties` text DEFAULT '{}' NOT NULL,
	`occurred_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_name_time_idx` ON `audience_events` (`event_name`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `events_article_time_idx` ON `audience_events` (`article_slug`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `events_session_idx` ON `audience_events` (`session_id`);--> statement-breakpoint
CREATE TABLE `authors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`bio` text DEFAULT '' NOT NULL,
	`area` text DEFAULT '' NOT NULL,
	`avatar_url` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `authors_slug_uidx` ON `authors` (`slug`);--> statement-breakpoint
CREATE TABLE `editions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`number` integer NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text DEFAULT '' NOT NULL,
	`cover_url` text,
	`pdf_url` text,
	`published_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `editions_slug_uidx` ON `editions` (`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `editions_number_uidx` ON `editions` (`number`);--> statement-breakpoint
CREATE TABLE `subscribers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`source` text DEFAULT 'website' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `subscribers_email_uidx` ON `subscribers` (`email`);