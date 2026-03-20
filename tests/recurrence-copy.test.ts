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
        await migrate(testDb, { migrationsFolder: './drizzle' });
        try { testDb.run(sql`ALTER TABLE tasks ADD COLUMN recurrence_id integer REFERENCES tasks(id)`); } catch (e) {}
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
