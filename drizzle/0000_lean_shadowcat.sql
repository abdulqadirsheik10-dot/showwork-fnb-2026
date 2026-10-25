CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`task` text NOT NULL,
	`response` text NOT NULL,
	`feedback` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`created` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shares` (
	`token` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`task` text NOT NULL,
	`created` integer NOT NULL,
	`revoked` integer DEFAULT 0 NOT NULL
);
