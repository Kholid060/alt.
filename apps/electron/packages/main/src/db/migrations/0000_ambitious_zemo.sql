CREATE TABLE `commands` (
	`id` text PRIMARY KEY NOT NULL,
	`shortcut` text,
	`icon` text,
	`type` text NOT NULL,
	`subtitle` text,
	`description` text,
	`title` text NOT NULL,
	`name` text NOT NULL,
	`path` text,
	`context` text,
	`config` text,
	`arguments` text,
	`is_disabled` integer NOT NULL,
	`extension_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`extension_id` text NOT NULL,
	`config_id` text NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `extensions` (
	`id` text PRIMARY KEY NOT NULL,
	`icon` text NOT NULL,
	`name` text NOT NULL,
	`path` text NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`version` text NOT NULL,
	`error_message` text,
	`description` text NOT NULL,
	`permissions` text,
	`config` text,
	`is_error` integer NOT NULL,
	`is_disabled` integer NOT NULL,
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
CREATE TABLE `workflows` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`description` text,
	`nodes` text DEFAULT (json_array()) NOT NULL,
	`viewport` text,
	`edges` text DEFAULT (json_array()) NOT NULL,
	`triggers` text DEFAULT (json_array()) NOT NULL,
	`is_disabled` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`variables` text DEFAULT (json_array()) NOT NULL,
	`execute_count` integer DEFAULT 0 NOT NULL,
	`settings` text
);
--> statement-breakpoint
CREATE TABLE `workflows_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text,
	`duration` integer,
	`error_message` text,
	`error_location` text,
	`workflow_id` text NOT NULL,
	`status` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `commands_shortcut_unique` ON `commands` (`shortcut`);--> statement-breakpoint
CREATE UNIQUE INDEX `configs_config_id_unique` ON `configs` (`config_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `config_id_idx` ON `configs` (`config_id`);