import { describe, test, expect, beforeAll } from "bun:test";
import { mock } from "bun:test";
import { tasks, taskLabels, labels } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { addDays, format } from 'date-fns';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

const sqlite = new Database(':memory:');
const testDb = drizzle(sqlite);

mock.module('@/lib/db', () => ({ db: testDb }));
mock.module('next/cache', () => ({ revalidatePath: () => {} }));

import { toggleTaskCompletion } from '@/actions/recurrence';

describe('Recurrence Logic - Copy fields', () => {
    beforeAll(async () => {
        try {
            await migrate(testDb, { migrationsFolder: './drizzle' });
        } catch (e) {
            // Ignore migration errors during test setup
        }
        try { testDb.run(sql`ALTER TABLE tasks ADD COLUMN recurrence_id integer REFERENCES tasks(id)`); } catch (e) {}

        const stmts = [
          `CREATE TABLE IF NOT EXISTS lists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, color TEXT DEFAULT '#000000', icon TEXT DEFAULT 'list', is_default INTEGER DEFAULT false, created_at TEXT DEFAULT (CURRENT_TIMESTAMP))`,
          `CREATE TABLE IF NOT EXISTS labels (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, color TEXT DEFAULT '#000000', created_at TEXT DEFAULT (CURRENT_TIMESTAMP))`,
          `CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, list_id INTEGER REFERENCES lists(id), parent_id INTEGER REFERENCES tasks(id), name TEXT NOT NULL, description TEXT, date TEXT, deadline TEXT, is_completed INTEGER DEFAULT false, completed_at TEXT, estimate INTEGER, actual_time INTEGER, reminders TEXT, priority TEXT DEFAULT 'none', recurrence_interval TEXT, recurrence_config TEXT, recurrence_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL, created_at TEXT DEFAULT (CURRENT_TIMESTAMP), updated_at TEXT DEFAULT (CURRENT_TIMESTAMP))`,
          `CREATE INDEX IF NOT EXISTS date_idx ON tasks(date)`,
          `CREATE INDEX IF NOT EXISTS parent_id_idx ON tasks(parent_id)`,
          `CREATE INDEX IF NOT EXISTS tasks_list_id_idx ON tasks(list_id)`,
          `CREATE INDEX IF NOT EXISTS tasks_recurrence_id_idx ON tasks(recurrence_id)`,
          `CREATE INDEX IF NOT EXISTS tasks_is_completed_idx ON tasks(is_completed) WHERE is_completed = 0`,
          `CREATE TABLE IF NOT EXISTS task_labels (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id), label_id INTEGER NOT NULL REFERENCES labels(id))`,
          `CREATE INDEX IF NOT EXISTS task_labels_task_id_idx ON task_labels(task_id)`,
          `CREATE TABLE IF NOT EXISTS attachments (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id), file_path TEXT NOT NULL, file_name TEXT NOT NULL, created_at TEXT DEFAULT (CURRENT_TIMESTAMP))`,
          `CREATE INDEX IF NOT EXISTS attachments_task_id_idx ON attachments(task_id)`,
          `CREATE TABLE IF NOT EXISTS activity_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, task_id INTEGER NOT NULL REFERENCES tasks(id), field TEXT NOT NULL, old_value TEXT, new_value TEXT, timestamp TEXT DEFAULT (CURRENT_TIMESTAMP))`,
          `CREATE INDEX IF NOT EXISTS activity_logs_task_id_idx ON activity_logs(task_id)`
        ];

        for (const stmt of stmts) {
            try {
                testDb.run(sql.raw(stmt));
            } catch (e) {
                // Ignore
            }
        }
    });

    test('should copy estimate, reminders, labels, and subtasks when creating next occurrence', async () => {
        const today = format(new Date(), 'yyyy-MM-dd');

        // Setup initial task
        const parent = testDb.insert(tasks).values({
            name: 'Complex Recurrence Task',
            recurrenceInterval: 'DAILY',
            date: today,
            estimate: 60,
            reminders: JSON.stringify(['10m']),
        }).returning().get();

        // Setup a label
        const label = testDb.insert(labels).values({ name: 'Important' }).returning().get();
        testDb.insert(taskLabels).values({ taskId: parent.id, labelId: label.id }).run();

        // Setup a subtask
        testDb.insert(tasks).values({
            name: 'Subtask 1',
            parentId: parent.id,
            estimate: 30,
            isCompleted: true,
            actualTime: 15,
            completedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        }).run();

        // Toggle parent completion
        await toggleTaskCompletion(parent.id, true);

        // Fetch the new occurrence
        const allTasks = testDb.select().from(tasks).where(eq(tasks.name, 'Complex Recurrence Task')).all();
        const nextOccurrence = allTasks.find(t => t.id !== parent.id);
        expect(nextOccurrence).toBeDefined();

        // Verify copied fields
        expect(nextOccurrence!.estimate).toBe(60);
        expect(nextOccurrence!.reminders).toBe(JSON.stringify(['10m']));

        // Verify copied labels
        const nextLabels = testDb.select().from(taskLabels).where(eq(taskLabels.taskId, nextOccurrence!.id)).all();
        expect(nextLabels.length).toBe(1);
        expect(nextLabels[0].labelId).toBe(label.id);

        // Verify copied subtasks
        const nextSubtasks = testDb.select().from(tasks).where(eq(tasks.parentId, nextOccurrence!.id)).all();
        expect(nextSubtasks.length).toBe(1);
        expect(nextSubtasks[0].name).toBe('Subtask 1');
        expect(nextSubtasks[0].estimate).toBe(30);
    });
});
