PRAGMA foreign_keys=OFF;--> statement-breakpoint
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
	FOREIGN KEY (`list_id`) REFERENCES `lists`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`parent_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`recurrence_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_tasks`("id", "list_id", "parent_id", "name", "description", "date", "deadline", "is_completed", "completed_at", "estimate", "actual_time", "reminders", "priority", "recurrence_interval", "recurrence_config", "recurrence_id", "created_at", "updated_at") SELECT "id", "list_id", "parent_id", "name", "description", "date", "deadline", "is_completed", "completed_at", "estimate", "actual_time", "reminders", "priority", "recurrence_interval", "recurrence_config", "recurrence_id", "created_at", "updated_at" FROM `tasks`;--> statement-breakpoint
DROP TABLE `tasks`;--> statement-breakpoint
ALTER TABLE `__new_tasks` RENAME TO `tasks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `date_idx` ON `tasks` (`date`);