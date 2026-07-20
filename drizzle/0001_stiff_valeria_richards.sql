CREATE TABLE `qualification_applications` (
	`id` text PRIMARY KEY NOT NULL,
	`account_email` text NOT NULL,
	`phase_one_status` text NOT NULL,
	`phase_two_status` text NOT NULL,
	`whatsapp_support_person` text NOT NULL,
	`target_role` text NOT NULL,
	`visible_gap` text NOT NULL,
	`additional_context` text,
	`consent` integer NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`notification_status` text DEFAULT 'pending' NOT NULL,
	`notification_attempts` integer DEFAULT 0 NOT NULL,
	`notification_last_error` text,
	`notified_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `qualification_applications_email_created_idx` ON `qualification_applications` (`account_email`,`created_at`);--> statement-breakpoint
CREATE INDEX `qualification_applications_notification_created_idx` ON `qualification_applications` (`notification_status`,`created_at`);