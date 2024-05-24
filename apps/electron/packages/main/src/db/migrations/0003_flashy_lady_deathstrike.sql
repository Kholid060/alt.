ALTER TABLE `commands` RENAME TO `extension_commands`;--> statement-breakpoint
ALTER TABLE `configs` RENAME TO `extension_configs`;--> statement-breakpoint
ALTER TABLE `storages` RENAME TO `extension_storages`;--> statement-breakpoint
DROP INDEX IF EXISTS `commands_shortcut_unique`;--> statement-breakpoint
DROP INDEX IF EXISTS `configs_config_id_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `extension_commands_shortcut_unique` ON `extension_commands` (`shortcut`);--> statement-breakpoint
CREATE UNIQUE INDEX `extension_configs_config_id_unique` ON `extension_configs` (`config_id`);