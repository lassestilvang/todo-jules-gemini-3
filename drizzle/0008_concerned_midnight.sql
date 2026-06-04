PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_activity_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`field` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`timestamp` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_activity_logs`("id", "task_id", "field", "old_value", "new_value", "timestamp") SELECT "id", "task_id", "field", "old_value", "new_value", "timestamp" FROM `activity_logs`;--> statement-breakpoint
DROP TABLE `activity_logs`;--> statement-breakpoint
ALTER TABLE `__new_activity_logs` RENAME TO `activity_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `activity_logs_task_id_idx` ON `activity_logs` (`task_id`);--> statement-breakpoint
CREATE TABLE `__new_attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`file_path` text NOT NULL,
	`file_name` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_attachments`("id", "task_id", "file_path", "file_name", "created_at") SELECT "id", "task_id", "file_path", "file_name", "created_at" FROM `attachments`;--> statement-breakpoint
DROP TABLE `attachments`;--> statement-breakpoint
ALTER TABLE `__new_attachments` RENAME TO `attachments`;--> statement-breakpoint
CREATE INDEX `attachments_task_id_idx` ON `attachments` (`task_id`);--> statement-breakpoint
CREATE TABLE `__new_task_labels` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`task_id` integer NOT NULL,
	`label_id` integer NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`label_id`) REFERENCES `labels`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_task_labels`("id", "task_id", "label_id") SELECT "id", "task_id", "label_id" FROM `task_labels`;--> statement-breakpoint
DROP TABLE `task_labels`;--> statement-breakpoint
ALTER TABLE `__new_task_labels` RENAME TO `task_labels`;--> statement-breakpoint
CREATE INDEX `task_labels_task_id_idx` ON `task_labels` (`task_id`);--> statement-breakpoint
CREATE TABLE `__new_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`list_id` integer,
	`parent_id` integer,
	`name` text NOT NULL,
	`description` text,
	`date` text,
	`deadline` text,
	`is_completed` integer DEFAULT false,
	`completed_at` text,
	`estimate` integer,
	`actual_time` integer,
	`reminders` text,
	`priority` text DEFAULT 'none',
	`recurrence_interval` text,
	`recurrence_config` text,
	`recurrence_id` integer,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` text DEFAULT (CURRENT_TIMESTAMP),
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`parent_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`recurrence_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_tasks`("id", "list_id", "parent_id", "name", "description", "date", "deadline", "is_completed", "completed_at", "estimate", "actual_time", "reminders", "priority", "recurrence_interval", "recurrence_config", "recurrence_id", "created_at", "updated_at") SELECT "id", "list_id", "parent_id", "name", "description", "date", "deadline", "is_completed", "completed_at", "estimate", "actual_time", "reminders", "priority", "recurrence_interval", "recurrence_config", "recurrence_id", "created_at", "updated_at" FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;--> statement-breakpoint
CREATE INDEX `date_idx` ON `tasks` (`date`);--> statement-breakpoint
CREATE INDEX `parent_id_idx` ON `tasks` (`parent_id`);--> statement-breakpoint
CREATE INDEX `tasks_list_id_idx` ON `tasks` (`list_id`);--> statement-breakpoint
CREATE INDEX `tasks_recurrence_id_idx` ON `tasks` (`recurrence_id`);--> statement-breakpoint
CREATE INDEX `tasks_is_completed_idx` ON `tasks` (`is_completed`) WHERE "tasks"."is_completed" = 0;