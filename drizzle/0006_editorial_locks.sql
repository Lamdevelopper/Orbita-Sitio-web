CREATE TABLE `editorial_locks` (
	`scope` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`lease_expires_at` integer NOT NULL
);
