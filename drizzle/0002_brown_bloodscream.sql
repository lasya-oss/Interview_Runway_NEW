CREATE TABLE `learner_progress` (
	`user_email` text PRIMARY KEY NOT NULL,
	`completed_task_ids` text DEFAULT '[]' NOT NULL,
	`progress_percent` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
