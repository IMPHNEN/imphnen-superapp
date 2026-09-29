CREATE TABLE `rate_limit` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`count` integer NOT NULL,
	`last_request` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rate_limit_key_unique` ON `rate_limit` (`key`);--> statement-breakpoint
CREATE TABLE `user_profile` (
	`user_id` text PRIMARY KEY NOT NULL,
	`avatar_key` text,
	`phone_number` text,
	`phone_for_verification` text,
	`gender` text,
	`birthdate` text,
	`domicile` text,
	`bio` text,
	`last_education` text,
	`linkedin_url` text,
	`github_url` text,
	`cv_url` text,
	`portfolio_url` text,
	`website_url` text,
	`twitter_url` text,
	`location` text,
	`skills` text DEFAULT '[]' NOT NULL,
	`experience` text DEFAULT '[]' NOT NULL,
	`education` text DEFAULT '[]' NOT NULL,
	`career_status` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `user` ADD `is_active` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `deleted_at` integer;