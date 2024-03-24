CREATE TABLE `configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`extension_id` text NOT NULL,
	`config_id` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `extensions` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`title` text NOT NULL,
	`version` text NOT NULL,
	`description` text NOT NULL,
	`is_local` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `storages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`extension_id` text NOT NULL,
	`key` text NOT NULL,
	`value` blob NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `configs_config_id_unique` ON `configs` (`config_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `config_id_idx` ON `configs` (`config_id`);