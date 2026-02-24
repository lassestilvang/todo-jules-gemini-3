import { describe, test, beforeAll, expect } from "bun:test";
import { mock } from "bun:test";
import { tasks } from '@/lib/schema';

import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';

// Setup Mock DB
const sqlite = new Database(':memory:');
const testDb = drizzle(sqlite);

mock.module('@/lib/db', () => ({ db: testDb }));
mock.module('next/cache', () => ({ revalidatePath: () => {} }));

// Import actions
import { getTasks, getIncompleteTasks } from '@/actions/tasks';

describe('Performance Benchmark', () => {
    beforeAll(async () => {
        // Ensure migrations folder is correct relative to test execution
        await migrate(testDb, { migrationsFolder: './drizzle' });

        // Seed Data
        console.log('Seeding database...');
        const items = [];
        for (let i = 0; i < 10000; i++) {
            items.push({
                name: `Task ${i}`,
                isCompleted: i % 2 === 0, // 50% completed
                priority: 'medium',
            });
        }

        const chunkSize = 500;
        for (let i = 0; i < items.length; i += chunkSize) {
            testDb.insert(tasks).values(items.slice(i, i + chunkSize)).run();
        }
        console.log('Seeding complete.');
    });

    test('Benchmark: Filter in Memory vs DB', async () => {
        // 1. Measure Memory Filter (Old implementation simulation)
        const startMem = performance.now();
        const allTasks = await getTasks();
        const inboxTasks = allTasks.filter(t => !t.isCompleted);
        const endMem = performance.now();
        const timeMem = endMem - startMem;

        console.log(`Memory Filter Time: ${timeMem.toFixed(4)}ms`);
        console.log(`Memory Items: ${inboxTasks.length}`);

        // 2. Measure DB Filter (Optimized implementation)
        const startDb = performance.now();
        const dbTasks = await getIncompleteTasks();
        const endDb = performance.now();
        const timeDb = endDb - startDb;

        console.log(`DB Filter Time: ${timeDb.toFixed(4)}ms`);
        console.log(`DB Items: ${dbTasks.length}`);

        expect(dbTasks.length).toBe(inboxTasks.length);
        // We expect DB filter to be faster
        // Note: In small datasets or specific mock environments, this might fluctuate,
        // but for 10k items it should be consistently faster.
    });
});
