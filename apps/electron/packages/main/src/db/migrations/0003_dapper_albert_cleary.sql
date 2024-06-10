ALTER TABLE `workflows_history` ADD `runner_id` text NOT NULL;--> statement-breakpoint
ALTER TABLE `extension_errors` DROP COLUMN `updated_at`;