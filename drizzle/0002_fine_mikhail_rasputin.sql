ALTER TABLE `tasks` ADD `recurrence_id` integer REFERENCES tasks(id);
CREATE INDEX `date_idx` ON `tasks` (`date`);
