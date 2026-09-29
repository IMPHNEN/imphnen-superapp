CREATE TABLE `gacha_claim` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`source` text NOT NULL,
	`status` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`fulfilled_at` integer,
	`fulfilled_by` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `gacha_item`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`fulfilled_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "gacha_claim_quantity_check" CHECK("gacha_claim"."quantity" >= 1)
);
--> statement-breakpoint
CREATE INDEX `gacha_claim_user_id_idx` ON `gacha_claim` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `gacha_claim_item_id_idx` ON `gacha_claim` (`item_id`);--> statement-breakpoint
CREATE INDEX `gacha_claim_status_idx` ON `gacha_claim` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `gacha_credit` (
	`user_id` text PRIMARY KEY NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "gacha_credit_balance_check" CHECK("gacha_credit"."balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE `gacha_item` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`rarity` text NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`value` integer DEFAULT 0 NOT NULL,
	`weight` real NOT NULL,
	`stock` integer NOT NULL,
	`is_limited` integer DEFAULT false NOT NULL,
	`metadata` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "gacha_item_stock_check" CHECK("gacha_item"."stock" >= 0),
	CONSTRAINT "gacha_item_weight_check" CHECK("gacha_item"."weight" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `gacha_item_code_unique` ON `gacha_item` (`code`);--> statement-breakpoint
CREATE INDEX `gacha_item_deleted_at_idx` ON `gacha_item` (`deleted_at`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`role` text DEFAULT 'user' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user`("id", "name", "email", "email_verified", "image", "role", "created_at", "updated_at") SELECT "id", "name", "email", "email_verified", "image", "role", "created_at", "updated_at" FROM `user`;--> statement-breakpoint
DROP TABLE `user`;--> statement-breakpoint
ALTER TABLE `__new_user` RENAME TO `user`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);