ALTER TABLE `extension_commands` ADD `is_internal` integer DEFAULT false;--> statement-breakpoint
CREATE INDEX `workflow_runner_id_idx` ON `workflows_history` (`runner_id`);