CREATE TABLE `meeting_copilot_profile_deliveries` (
	`delivery_key` text PRIMARY KEY NOT NULL,
	`owner_hash` text NOT NULL,
	`profile_id` text NOT NULL,
	`profile_revision` integer NOT NULL,
	`event_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`message_id` text,
	`failure_code` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`sent_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `meeting_copilot_profile_deliveries_owner_profile_revision_unique` ON `meeting_copilot_profile_deliveries` (`owner_hash`,`profile_id`,`profile_revision`);--> statement-breakpoint
CREATE INDEX `meeting_copilot_profile_deliveries_owner_created_idx` ON `meeting_copilot_profile_deliveries` (`owner_hash`,`created_at`);