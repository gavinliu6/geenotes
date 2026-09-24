CREATE TABLE `note` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text DEFAULT '' NOT NULL,
	`markdown` text DEFAULT '' NOT NULL,
	`deleted_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `note_userId_createdAt_idx` ON `note` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `note_userId_updatedAt_idx` ON `note` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE INDEX `note_userId_deletedAt_idx` ON `note` (`user_id`,`deleted_at`);