import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Lists Table
export const lists = sqliteTable('lists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color').default('#000000'),
  icon: text('icon').default('list'),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

// Labels Table
export const labels = sqliteTable('labels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  color: text('color').default('#000000'),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

// Tasks Table
export const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  listId: integer('list_id').references(() => lists.id),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parentId: integer('parent_id').references((): any => tasks.id), // Self-referencing for subtasks
  name: text('name').notNull(),
  description: text('description'),
  date: text('date'), // Stored as ISO string YYYY-MM-DD
  deadline: text('deadline'), // ISO string
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
  completedAt: text('completed_at'),
  estimate: integer('estimate'), // In minutes
  actualTime: integer('actual_time'), // In minutes
  reminders: text('reminders'), // JSON string for reminders
  priority: text('priority').default('none'), // high, medium, low, none
  recurrenceInterval: text('recurrence_interval'), // DAILY, WEEKLY, MONTHLY, YEARLY, CUSTOM
  recurrenceConfig: text('recurrence_config'), // JSON string for custom rules
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').default(sql`(CURRENT_TIMESTAMP)`),
});

// Task Labels (Many-to-Many)
export const taskLabels = sqliteTable('task_labels', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').references(() => tasks.id).notNull(),
  labelId: integer('label_id').references(() => labels.id).notNull(),
});

// Attachments
export const attachments = sqliteTable('attachments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').references(() => tasks.id).notNull(),
  filePath: text('file_path').notNull(),
  fileName: text('file_name').notNull(),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

// Activity Logs
export const activityLogs = sqliteTable('activity_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  taskId: integer('task_id').references(() => tasks.id).notNull(),
  field: text('field').notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  timestamp: text('timestamp').default(sql`(CURRENT_TIMESTAMP)`),
});
