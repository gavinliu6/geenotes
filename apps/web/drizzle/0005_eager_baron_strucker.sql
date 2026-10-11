CREATE TABLE `folder` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `folder_userId_name_unique` ON `folder` (`user_id`,`name`);--> statement-breakpoint
ALTER TABLE `note` ADD `folder_id` text REFERENCES `folder`(`id`) ON UPDATE no action ON DELETE set null;--> statement-breakpoint
CREATE INDEX `note_folderId_userId_deletedAt_updatedAt_id_idx` ON `note` (`folder_id`,`user_id`,`deleted_at`,`updated_at`,`id`);