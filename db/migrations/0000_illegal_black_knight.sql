CREATE TABLE `alert_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`alert_id` integer NOT NULL,
	`triggered_at` integer NOT NULL,
	`message` text NOT NULL,
	`cheapest_price` real,
	`avg_price` real,
	`trailing_avg` real,
	FOREIGN KEY (`alert_id`) REFERENCES `alert_rules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `alert_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_id` integer NOT NULL,
	`type` text NOT NULL,
	`threshold` real NOT NULL,
	`email` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `scrape_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_alert_rules_job_active` ON `alert_rules` (`job_id`,`active`);--> statement-breakpoint
CREATE TABLE `price_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`job_id` integer NOT NULL,
	`price` real NOT NULL,
	`section` text,
	`row` text,
	`seat` text,
	`quantity` integer DEFAULT 1,
	`listing_type` text,
	`scraped_at` integer NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `scrape_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_price_records_job_scraped` ON `price_records` (`job_id`,`scraped_at`);--> statement-breakpoint
CREATE TABLE `scrape_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`url` text NOT NULL,
	`event_name` text,
	`cron_expression` text DEFAULT '0 */6 * * *' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`last_scraped_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
