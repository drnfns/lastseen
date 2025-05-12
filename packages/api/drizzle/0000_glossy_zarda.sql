CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ts` integer,
	`device` text NOT NULL,
	FOREIGN KEY (`device`) REFERENCES `devices`(`id`) ON UPDATE no action ON DELETE no action
);
