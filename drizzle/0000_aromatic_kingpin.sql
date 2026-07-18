CREATE TABLE `checkout_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`offer` text NOT NULL,
	`expected_amount_minor` integer NOT NULL,
	`expected_currency` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`paddle_transaction_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`last_event_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `checkout_sessions_paddle_transaction_unique` ON `checkout_sessions` (`paddle_transaction_id`);--> statement-breakpoint
CREATE INDEX `checkout_sessions_user_created_idx` ON `checkout_sessions` (`user_email`,`created_at`);--> statement-breakpoint
CREATE TABLE `entitlements` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`offer` text NOT NULL,
	`status` text NOT NULL,
	`paddle_transaction_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`last_event_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entitlements_user_offer_unique` ON `entitlements` (`user_email`,`offer`);--> statement-breakpoint
CREATE UNIQUE INDEX `entitlements_paddle_transaction_unique` ON `entitlements` (`paddle_transaction_id`);--> statement-breakpoint
CREATE TABLE `paddle_events` (
	`event_id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`occurred_at` text NOT NULL,
	`processed_at` text NOT NULL
);
