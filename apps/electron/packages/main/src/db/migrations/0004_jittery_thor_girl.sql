CREATE TABLE `credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`value` blob NOT NULL,
	`type` text DEFAULT 'oauth2' NOT NULL
);
--> statement-breakpoint
ALTER TABLE extensions ADD `credentials` text;