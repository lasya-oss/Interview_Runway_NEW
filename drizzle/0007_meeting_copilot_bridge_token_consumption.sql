CREATE TABLE `meeting_copilot_bridge_token_consumptions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`owner_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`consumed_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `meeting_copilot_bridge_token_consumptions_expires_idx` ON `meeting_copilot_bridge_token_consumptions` (`expires_at`);