CREATE TABLE `login_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `account_catalog` (
	`username` text NOT NULL,
	`id` text NOT NULL,
	`record` text NOT NULL,
	PRIMARY KEY(`username`, `id`)
);
--> statement-breakpoint
CREATE TABLE `demo_sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `session_expiry` ON `demo_sessions` (`expires`);