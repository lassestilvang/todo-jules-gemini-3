import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { tasks, lists } from '@/lib/schema';
import { eq } from 'drizzle-orm';

// Setup DB
const sqlite = new Database(':memory:');
const db = drizzle(sqlite);

console.log('Running migrations...');
migrate(db, { migrationsFolder: './drizzle' });

// Seed Data
console.log('Seeding data...');
const LIST_COUNT = 10;
const TASKS_PER_LIST = 1000;
const TOTAL_TASKS = LIST_COUNT * TASKS_PER_LIST;

// Create Lists
db.insert(lists).values(
  Array.from({ length: LIST_COUNT }, (_, i) => ({ name: `List ${i + 1}` }))
).run();

// Create Tasks
const allTasks = [];
for (let i = 0; i < TOTAL_TASKS; i++) {
  const listId = (i % LIST_COUNT) + 1;
  allTasks.push({
    name: `Task ${i}`,
    listId: listId,
    description: `Description for task ${i}`,
    priority: 'none' as const,
  });
}

// Batch insert tasks
const chunkSize = 50;
for (let i = 0; i < allTasks.length; i += chunkSize) {
    const chunk = allTasks.slice(i, i + chunkSize);
    db.insert(tasks).values(chunk).run();
}

console.log(`Seeded ${TOTAL_TASKS} tasks across ${LIST_COUNT} lists.`);

// Benchmark
const TARGET_LIST_ID = 1;

// Method 1: Fetch All + JS Filter
console.log('Running Method 1: Fetch All + JS Filter...');
const start1 = performance.now();
const allTasksFetched = db.select().from(tasks).all();
const filteredTasks = allTasksFetched.filter(t => t.listId === TARGET_LIST_ID);
const end1 = performance.now();
const duration1 = end1 - start1;

console.log(`Method 1 Duration: ${duration1.toFixed(2)}ms`);
console.log(`Fetched count: ${filteredTasks.length}`);

// Method 2: SQL Filter
console.log('Running Method 2: SQL Filter...');
const start2 = performance.now();
const filteredTasksSql = db.select().from(tasks).where(eq(tasks.listId, TARGET_LIST_ID)).all();
const end2 = performance.now();
const duration2 = end2 - start2;

console.log(`Method 2 Duration: ${duration2.toFixed(2)}ms`);
console.log(`Fetched count: ${filteredTasksSql.length}`);

// Improvement
const improvement = ((duration1 - duration2) / duration1) * 100;
console.log(`Improvement: ${improvement.toFixed(2)}%`);

sqlite.close();
