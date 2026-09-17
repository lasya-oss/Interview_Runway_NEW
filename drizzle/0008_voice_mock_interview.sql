CREATE TABLE `voice_candidate_profiles` (
	`user_email` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`profile_revision` integer NOT NULL,
	`profile_json` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `voice_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`interview_type` text NOT NULL CHECK (`interview_type` IN ('behavioral', 'role_specific')),
	`persona` text NOT NULL CHECK (`persona` IN ('hiring_manager', 'peer_engineer')),
	`language` text DEFAULT 'en' NOT NULL CHECK (`language` = 'en'),
	`job_description` text,
	`candidate_profile` text,
	`status` text DEFAULT 'ready' NOT NULL CHECK (`status` IN ('ready', 'in_progress', 'scoring', 'completed', 'failed')),
	`token_id` text,
	`consent_at` text,
	`audio_retention_approved` integer DEFAULT false NOT NULL CHECK (`audio_retention_approved` IN (0, 1)),
	`audio_object_prefix` text,
	`created_at` text NOT NULL,
	`started_at` text,
	`ended_at` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `voice_sessions_user_created_idx` ON `voice_sessions` (`user_email`,`created_at`);
--> statement-breakpoint
CREATE INDEX `voice_sessions_user_status_idx` ON `voice_sessions` (`user_email`,`status`);
--> statement-breakpoint
CREATE TABLE `voice_session_usage` (
	`session_id` text PRIMARY KEY NOT NULL,
	`user_email` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `voice_session_usage_user_created_idx` ON `voice_session_usage` (`user_email`,`created_at`);
--> statement-breakpoint
CREATE TRIGGER `voice_sessions_track_usage`
AFTER INSERT ON `voice_sessions`
BEGIN
	INSERT INTO `voice_session_usage` (`session_id`, `user_email`, `created_at`)
	VALUES (NEW.`id`, NEW.`user_email`, NEW.`created_at`);
END;
--> statement-breakpoint
CREATE TABLE `voice_turns` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`speaker` text NOT NULL CHECK (`speaker` IN ('candidate', 'interviewer')),
	`text` text NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text NOT NULL,
	`tool_calls` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `voice_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `voice_turns_session_started_idx` ON `voice_turns` (`session_id`,`started_at`);
--> statement-breakpoint
CREATE TABLE `voice_scores` (
	`session_id` text PRIMARY KEY NOT NULL,
	`rubric_version` text NOT NULL,
	`per_answer` text NOT NULL,
	`session_verdict` text NOT NULL,
	`strengths` text NOT NULL,
	`gaps` text NOT NULL,
	`recommended_drills` text NOT NULL,
	`provider` text NOT NULL,
	`model` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `voice_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `voice_report_deliveries` (
	`delivery_key` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL CHECK (`status` IN ('pending', 'sent', 'failed', 'indeterminate')),
	`message_id` text,
	`failure_code` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`sent_at` text,
	FOREIGN KEY (`session_id`) REFERENCES `voice_sessions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `voice_report_deliveries_session_unique` ON `voice_report_deliveries` (`session_id`);
--> statement-breakpoint
CREATE INDEX `voice_report_deliveries_status_created_idx` ON `voice_report_deliveries` (`status`,`created_at`);
