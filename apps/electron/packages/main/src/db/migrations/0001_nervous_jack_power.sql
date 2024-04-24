ALTER TABLE workflows ADD `is_disabled` integer NOT NULL;--> statement-breakpoint
ALTER TABLE workflows ADD `created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE workflows ADD `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL;