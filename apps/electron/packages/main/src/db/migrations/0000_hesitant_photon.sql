CREATE TABLE `extension_commands` (
	`id` text PRIMARY KEY NOT NULL,
	`shortcut` text,
	`icon` text,
	`type` text NOT NULL,
	`subtitle` text,
	`custom_subtitle` text,
	`description` text,
	`title` text NOT NULL,
	`name` text NOT NULL,
	`path` text,
	`context` text,
	`config` text,
	`arguments` text,
	`is_disabled` integer NOT NULL,
	`is_fallback` integer,
	`alias` text,
	`extension_id` text NOT NULL,
	`dismiss_alert` integer,
	FOREIGN KEY (`extension_id`) REFERENCES `extensions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `extension_configs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`extension_id` text NOT NULL,
	`config_id` text NOT NULL,
	`encrypted_value` blob,
	`value` text NOT NULL,
	FOREIGN KEY (`extension_id`) REFERENCES `extensions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `extension_credential_oauth_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`credential_id` text NOT NULL,
	`expires_timestamp` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`scope` text,
	`token_type` text,
	`refresh_token` blob,
	`access_token` blob NOT NULL,
	FOREIGN KEY (`credential_id`) REFERENCES `extension_credentials`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `extension_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`extension_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`provider_id` text NOT NULL,
	`value` blob NOT NULL,
	`type` text DEFAULT 'oauth2' NOT NULL,
	FOREIGN KEY (`extension_id`) REFERENCES `extensions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `extension_errors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text,
	`extension_id` text NOT NULL,
	`message` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`extension_id`) REFERENCES `extensions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `extension_oauth_tokens` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`client_id` text NOT NULL,
	`expires_timestamp` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`provider_name` text NOT NULL,
	`provider_icon` text NOT NULL,
	`scope` text,
	`key` text NOT NULL,
	`token_type` text,
	`extension_id` text NOT NULL,
	`refresh_token` blob,
	`access_token` blob NOT NULL,
	FOREIGN KEY (`extension_id`) REFERENCES `extensions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `extension_storages` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`extension_id` text NOT NULL,
	`key` text NOT NULL,
	`value` blob NOT NULL,
	FOREIGN KEY (`extension_id`) REFERENCES `extensions`(`id`) ON UPDATE no action ON DELETE cascade
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
	`credentials` text,
	`is_error` integer NOT NULL,
	`is_disabled` integer NOT NULL,
	`is_local` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workflows` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL,
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
	`dismiss_alert` integer,
	`is_pinned` integer DEFAULT false,
	`settings` text
);
--> statement-breakpoint
CREATE TABLE `workflows_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text,
	`duration` integer,
	`error_message` text,
	`runner_id` text NOT NULL,
	`error_location` text,
	`workflow_id` text NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `extension_commands_shortcut_unique` ON `extension_commands` (`shortcut`);--> statement-breakpoint
CREATE UNIQUE INDEX `extension_configs_config_id_unique` ON `extension_configs` (`config_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `config_id_idx` ON `extension_configs` (`config_id`);--> statement-breakpoint
CREATE INDEX `extension_oauth_credential_idx` ON `extension_credential_oauth_tokens` (`credential_id`);--> statement-breakpoint
CREATE INDEX `oauth_key_idx` ON `extension_oauth_tokens` (`key`);--> statement-breakpoint
CREATE INDEX `oauth_client_id_idx` ON `extension_oauth_tokens` (`client_id`);--> statement-breakpoint
CREATE INDEX `oauth_ext_id_idx` ON `extension_oauth_tokens` (`extension_id`);--> statement-breakpoint
CREATE INDEX `storage_key_idx` ON `extension_storages` (`key`);--> statement-breakpoint
CREATE INDEX `storage_extension_id_idx` ON `extension_storages` (`extension_id`);