CREATE TABLE `note_view` (
	`user_id` text NOT NULL,
	`note_id` text NOT NULL,
	`viewed_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`user_id`, `note_id`),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`note_id`) REFERENCES `note`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `note_view_userId_viewedAt_idx` ON `note_view` (`user_id`,`viewed_at`);