DROP INDEX `list_id_idx`;--> statement-breakpoint
DROP INDEX `recurrence_id_idx`;--> statement-breakpoint
CREATE INDEX `tasks_list_id_idx` ON `tasks` (`list_id`);--> statement-breakpoint
CREATE INDEX `tasks_recurrence_id_idx` ON `tasks` (`recurrence_id`);--> statement-breakpoint
CREATE INDEX `tasks_is_completed_idx` ON `tasks` (`is_completed`);