CREATE TABLE `hackathon_invitation` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`inviter_id` text NOT NULL,
	`invitee_email` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `hackathon_team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`inviter_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hackathon_invitation_pending_unique` ON `hackathon_invitation` (`team_id`,`invitee_email`) WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX `hackathon_invitation_email_idx` ON `hackathon_invitation` (`invitee_email`,`status`);--> statement-breakpoint
CREATE TABLE `hackathon_join_request` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`user_id` text NOT NULL,
	`message` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `hackathon_team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hackathon_join_request_pending_unique` ON `hackathon_join_request` (`team_id`,`user_id`) WHERE status = 'pending';--> statement-breakpoint
CREATE INDEX `hackathon_join_request_user_idx` ON `hackathon_join_request` (`user_id`,`status`);--> statement-breakpoint
CREATE TABLE `hackathon_message` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`user_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `hackathon_team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `hackathon_message_team_created_idx` ON `hackathon_message` (`team_id`,`created_at`,`id`);--> statement-breakpoint
CREATE TABLE `hackathon_participant` (
	`user_id` text PRIMARY KEY NOT NULL,
	`phone_number` text,
	`location` text,
	`bio` text,
	`skills` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `hackathon_submission` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`project_name` text NOT NULL,
	`description` text NOT NULL,
	`repository_url` text NOT NULL,
	`demo_url` text,
	`presentation_url` text,
	`video_url` text,
	`screenshot_keys` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`submitted_at` integer,
	`created_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `hackathon_team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hackathon_submission_team_id_unique` ON `hackathon_submission` (`team_id`);--> statement-breakpoint
CREATE TABLE `hackathon_team` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`city` text NOT NULL,
	`visibility` text NOT NULL,
	`logo_key` text,
	`banner_key` text,
	`leader_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`leader_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `hackathon_team_visibility_created_idx` ON `hackathon_team` (`visibility`,`created_at`);--> statement-breakpoint
CREATE INDEX `hackathon_team_leader_idx` ON `hackathon_team` (`leader_id`);--> statement-breakpoint
CREATE TABLE `hackathon_team_member` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`joined_at` integer NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `hackathon_team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hackathon_team_member_user_unique` ON `hackathon_team_member` (`user_id`);--> statement-breakpoint
CREATE INDEX `hackathon_team_member_team_idx` ON `hackathon_team_member` (`team_id`);--> statement-breakpoint
CREATE TABLE `hackathon_winner` (
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`rank` integer NOT NULL,
	`prize` text,
	`announced_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `hackathon_team`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hackathon_winner_team_id_unique` ON `hackathon_winner` (`team_id`);