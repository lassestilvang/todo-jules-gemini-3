
import { describe, test, expect, beforeAll } from "bun:test";
import { mock } from "bun:test";
import { tasks, activityLogs } from '@/lib/schema';
import { eq } from 'drizzle-orm';
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

// Import the action AFTER mocking
import { toggleTaskCompletion } from '@/actions/recurrence';
import { updateTask } from '@/actions/tasks';

describe('Core Logic', () => {
    beforeAll(async () => {
        // Run migrations
        await migrate(testDb, { migrationsFolder: './drizzle' });
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
            expect(nextTask.date).toBe(expectedDate);
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
            const nameLog = logs.find(log => log.field === 'name');
            expect(nameLog).toBeDefined();
            expect(nameLog?.oldValue).toBe(task.name);
            expect(nameLog?.newValue).toBe(updates.name);

            const priorityLog = logs.find(log => log.field === 'priority');
            expect(priorityLog).toBeDefined();
            expect(priorityLog?.oldValue).toBe(task.priority);
            expect(priorityLog?.newValue).toBe(updates.priority);

            const descriptionLog = logs.find(log => log.field === 'description');
            expect(descriptionLog).toBeDefined();
            expect(descriptionLog?.oldValue).toBe(task.description);
            expect(descriptionLog?.newValue).toBe(updates.description);
        });
    });
});
