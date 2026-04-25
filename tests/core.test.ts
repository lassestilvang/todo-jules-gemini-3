import { describe, test, expect, beforeAll } from "bun:test";
import { mock } from "bun:test";

mock.module("next/headers", () => {
  return {
    headers: async () => new Map([["x-forwarded-for", "127.0.0.1"]]),
  };
});

import { tasks, activityLogs, taskLabels, labels } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { addDays, format } from 'date-fns';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

// Create a test DB instance
const sqlite = new Database(':memory:');
const testDb = drizzle(sqlite);

// Mock the app's db module to return our testDb
mock.module('@/lib/db', () => {
    return { db: testDb };
});

// Mock next/cache
mock.module('next/cache', () => {
    return {
        revalidatePath: () => {},
    };
});

// Mock next/headers
mock.module('next/headers', () => {
    return {
        headers: async () => new Map([['x-forwarded-for', '127.0.0.1']])
    };
});

// Import the action AFTER mocking
import { toggleTaskCompletion } from '@/actions/recurrence';
import { updateTask } from '@/actions/tasks';

describe('Core Logic', () => {
    beforeAll(async () => {
        // Run migrations manually to avoid DROP INDEX errors in bun test
        try {
            await migrate(testDb, { migrationsFolder: './drizzle' });
        } catch {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const fs = require('fs');
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const path = require('path');
            const migrationFiles = fs.readdirSync('./drizzle').filter((f: string) => f.endsWith('.sql')).sort();
            for (const file of migrationFiles) {
                const queries = fs.readFileSync(path.join('./drizzle', file), 'utf8').split('--> statement-breakpoint');
                for (const query of queries) {
                    const stmt = query.trim();
                    if (stmt) {
                        try {
                            testDb.run(sql.raw(stmt));
                        } catch {
                            // ignore errors like 'index already exists' or 'drop index failed'
                        }
                    }
                }
            }
        }


        // MANUALLY APPLY THE MISSING RECURRENCE ID COLUMN
        // It seems the migration might not be applying correctly in the test environment
        // or the test environment's migration runner is behaving differently.
        try {
            testDb.run(sql`ALTER TABLE tasks ADD COLUMN recurrence_id integer REFERENCES tasks(id)`);
        } catch {
            // Ignore if it already exists (though the error suggests it doesn't)
        }

        // Push the schema to the database correctly
        // Since test environments may struggle with some explicit index drops/creates.
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

    describe('Recurrence Logic', () => {
        test('should generate next occurrence for daily task', async () => {
            const today = format(new Date(), 'yyyy-MM-dd');
            const result = testDb.insert(tasks).values({
                name: 'Test Daily ' + Date.now(),
                recurrenceInterval: 'DAILY',
                date: today
            }).returning().get();

            expect(result).toBeDefined();

            // Call the action (which uses the mocked db)
            await toggleTaskCompletion(result.id, true);

            const allTasks = testDb.select().from(tasks).where(eq(tasks.name, result.name)).all();
            expect(allTasks.length).toBe(2);

            const nextTask = allTasks.find(t => t.id !== result.id);
            expect(nextTask).toBeDefined();

            const expectedDate = format(addDays(new Date(today), 1), 'yyyy-MM-dd');
            expect(nextTask!.date).toBe(expectedDate);
        });

        test('should not generate recurrence for normal tasks', async () => {
            const result = testDb.insert(tasks).values({
                name: 'Test Normal ' + Date.now(),
                priority: 'high'
            }).returning().get();

            await toggleTaskCompletion(result.id, true);

            const allTasks = testDb.select().from(tasks).where(eq(tasks.name, result.name)).all();
            expect(allTasks.length).toBe(1);
            expect(allTasks[0].isCompleted).toBe(true);
        });

        test('should link recurrence instances correctly', async () => {
            const today = format(new Date(), 'yyyy-MM-dd');
            // 1. Create a recurring task (Instance 1)
            const instance1 = testDb.insert(tasks).values({
                name: 'Recurrence Link Test ' + Date.now(),
                recurrenceInterval: 'DAILY',
                date: today
            }).returning().get();

            // 2. Complete Instance 1 -> Creates Instance 2
            await toggleTaskCompletion(instance1.id, true);

            const allTasks = testDb.select().from(tasks).where(eq(tasks.name, instance1.name)).all();
            const instance2 = allTasks.find(t => t.id !== instance1.id);
            expect(instance2!).toBeDefined();

            // Instance 2 should have recurrenceId pointing to Instance 1
            expect(instance2!.recurrenceId).toBe(instance1.id);

            // 3. Complete Instance 2 -> Creates Instance 3
            await toggleTaskCompletion(instance2!.id, true);

            const allTasks3 = testDb.select().from(tasks).where(eq(tasks.name, instance1.name)).all();
            expect(allTasks3.length).toBe(3);

            const instance3 = allTasks3.find(t => t.id !== instance1.id && t.id !== instance2!.id);
            expect(instance3!).toBeDefined();

            // Instance 3 should ALSO have recurrenceId pointing to Instance 1
            expect(instance3!.recurrenceId).toBe(instance1.id);
        });

        test('should copy fields, labels, and subtasks to new recurrence instance', async () => {
            const today = format(new Date(), 'yyyy-MM-dd');

            // Create a label
            const label = testDb.insert(labels).values({ name: 'Test Label ' + Date.now() }).returning().get();

            // Create recurring task
            const task = testDb.insert(tasks).values({
                name: 'Rich Recurrence Test ' + Date.now(),
                recurrenceInterval: 'DAILY',
                date: today,
                estimate: 60,
                reminders: '["10m"]'
            }).returning().get();

            // Link label
            testDb.insert(taskLabels).values({ taskId: task.id, labelId: label.id }).run();

            // Create subtask
            testDb.insert(tasks).values({
                name: 'Subtask for Recurrence',
                parentId: task.id,
                estimate: 30
            }).run();

            // Complete task to trigger recurrence
            await toggleTaskCompletion(task.id, true);

            // Fetch new instance
            const allTasks = testDb.select().from(tasks).where(eq(tasks.name, task.name)).all();
            const newTask = allTasks.find(t => t.id !== task.id);
            expect(newTask).toBeDefined();

            // Verify copied fields
            expect(newTask!.estimate).toBe(60);
            expect(newTask!.reminders).toBe('["10m"]');

            // Verify labels
            const newLabels = testDb.select().from(taskLabels).where(eq(taskLabels.taskId, newTask!.id)).all();
            expect(newLabels.length).toBe(1);
            expect(newLabels[0].labelId).toBe(label.id);

            // Verify subtasks
            const newSubtasks = testDb.select().from(tasks).where(eq(tasks.parentId, newTask!.id)).all();
            expect(newSubtasks.length).toBe(1);
            expect(newSubtasks[0].name).toBe('Subtask for Recurrence');
            expect(newSubtasks[0].estimate).toBe(30);
        });
    });

    describe('Task Logic', () => {
        test('should create multiple activity logs in a single update', async () => {
            // 1. Create a task
            const task = testDb.insert(tasks).values({
                name: 'Test Task for Logging ' + Date.now(),
                priority: 'low',
                description: 'Initial description'
            }).returning().get();

            // 2. Update the task with multiple changes
            const updates = {
                name: 'Updated Task Name',
                priority: 'high' as const,
                description: 'Updated description'
            };
            await updateTask(task.id, updates);

            // 3. Verify the logs
            const logs = testDb.select().from(activityLogs).where(eq(activityLogs.taskId, task.id)).all();

            // Should be 3 log entries for 3 updated fields
            expect(logs.length).toBe(3);

            // Check each log entry
            // Note: The order of logs is not guaranteed, so find by field
            const nameLog = logs.find(log => log.field === 'name');
            expect(nameLog).toBeDefined();
            // Cast to string for comparison as DB might return different types or strict equality
            expect(String(nameLog?.oldValue)).toBe(String(task.name));
            expect(String(nameLog?.newValue)).toBe(String(updates.name));

            const priorityLog = logs.find(log => log.field === 'priority');
            expect(priorityLog).toBeDefined();
            expect(String(priorityLog?.oldValue)).toBe(String(task.priority));
            expect(String(priorityLog?.newValue)).toBe(String(updates.priority));

            const descriptionLog = logs.find(log => log.field === 'description');
            expect(descriptionLog).toBeDefined();
            expect(String(descriptionLog?.oldValue)).toBe(String(task.description));
            expect(String(descriptionLog?.newValue)).toBe(String(updates.description));
        });
    });
});
