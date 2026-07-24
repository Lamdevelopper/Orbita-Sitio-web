ALTER TABLE `articles` ADD COLUMN `hero_caption` text;
--> statement-breakpoint
ALTER TABLE `articles` ADD COLUMN `homepage_slot` text DEFAULT 'feed' NOT NULL;
--> statement-breakpoint
ALTER TABLE `articles` ADD COLUMN `homepage_rank` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `editions` ADD COLUMN `external_url` text;
--> statement-breakpoint
ALTER TABLE `editions` ADD COLUMN `cover_alt` text;
--> statement-breakpoint
ALTER TABLE `editions` ADD COLUMN `is_current` integer DEFAULT false NOT NULL;
