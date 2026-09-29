CREATE TABLE `mentor` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`status` text NOT NULL,
	`legal_name` text,
	`gender` text,
	`domicile` text,
	`location` text,
	`phone_number` text,
	`phone_for_verification` text,
	`bio` text,
	`last_education` text,
	`linkedin_url` text,
	`github_url` text,
	`portfolio_url` text,
	`twitter_url` text,
	`identity_document_key` text,
	`cv_key` text,
	`cv_legacy_url` text,
	`industries` text DEFAULT '[]' NOT NULL,
	`expertise` text DEFAULT '[]' NOT NULL,
	`languages` text DEFAULT '[]' NOT NULL,
	`current_company` text,
	`current_role` text,
	`years_of_experience` integer,
	`topics_of_interest` text DEFAULT '[]' NOT NULL,
	`preferred_mentee_level` text DEFAULT '[]' NOT NULL,
	`preferred_mentoring_formats` text DEFAULT '[]' NOT NULL,
	`availability_commitment` text,
	`mentoring_rate` integer,
	`review_note` text,
	`reviewed_at` integer,
	`reviewed_by` text,
	`deleted_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`reviewed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mentor_user_id_unique` ON `mentor` (`user_id`);--> statement-breakpoint
CREATE INDEX `mentor_status_idx` ON `mentor` (`status`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `mentor_created_at_idx` ON `mentor` (`created_at`);--> statement-breakpoint
CREATE TABLE `mentoring_session` (
	`id` text PRIMARY KEY NOT NULL,
	`mentor_user_id` text NOT NULL,
	`mentee_id` text NOT NULL,
	`topic` text NOT NULL,
	`description` text,
	`scheduled_at` integer NOT NULL,
	`duration_minutes` integer NOT NULL,
	`meeting_link` text,
	`session_type` text NOT NULL,
	`status` text NOT NULL,
	`feedback` text,
	`rating` integer,
	`feedback_submitted_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`mentor_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mentee_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `mentoring_session_mentor_idx` ON `mentoring_session` (`mentor_user_id`,`scheduled_at`);--> statement-breakpoint
CREATE INDEX `mentoring_session_mentee_idx` ON `mentoring_session` (`mentee_id`,`scheduled_at`);--> statement-breakpoint
CREATE INDEX `mentoring_session_status_idx` ON `mentoring_session` (`status`);