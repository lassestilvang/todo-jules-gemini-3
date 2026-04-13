CREATE INDEX IF NOT EXISTS `activity_logs_task_id_idx` ON `activity_logs` (`task_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `attachments_task_id_idx` ON `attachments` (`task_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `task_labels_task_id_idx` ON `task_labels` (`task_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `parent_id_idx` ON `tasks` (`parent_id`);