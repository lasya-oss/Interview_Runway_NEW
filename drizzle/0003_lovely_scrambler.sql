CREATE TABLE `second_seat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`mock_id` text NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`answers` text DEFAULT '[]' NOT NULL,
	`evaluation` text,
	`started_at` text NOT NULL,
	`completed_at` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `second_seat_sessions_user_updated_idx` ON `second_seat_sessions` (`user_email`,`updated_at`);--> statement-breakpoint
CREATE INDEX `second_seat_sessions_user_status_idx` ON `second_seat_sessions` (`user_email`,`status`);