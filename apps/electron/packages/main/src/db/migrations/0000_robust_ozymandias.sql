CREATE TABLE `extensions-storage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`createdAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updatedAt` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`extensionId` text NOT NULL,
	`key` text NOT NULL,
	`value` blob NOT NULL
);
