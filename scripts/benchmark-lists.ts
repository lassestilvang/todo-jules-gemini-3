import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { eq, sql } from 'drizzle-orm';

// Define schema for benchmark to avoid import issues
const lists = sqliteTable('lists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

const tasks = sqliteTable('tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  listId: integer('list_id').references(() => lists.id),
  name: text('name').notNull(),
});

const main = async () => {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite);

  console.log('Setting up benchmark database...');

  // Create tables
  sqlite.run(`
    CREATE TABLE lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
  `);
  sqlite.run(`
    CREATE TABLE tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      list_id INTEGER,
      name TEXT NOT NULL
    );
  `);

  // Seed data
  const NUM_LISTS = 100;
  const TASKS_PER_LIST = 100;

  console.log(`Seeding ${NUM_LISTS} lists and ${NUM_LISTS * TASKS_PER_LIST} tasks...`);

  const listValues = Array.from({ length: NUM_LISTS }).map((_, i) => ({
    name: `List ${i}`,
  }));

  // Batch insert lists
  for (const list of listValues) {
      db.insert(lists).values(list).run();
  }

  // Get list IDs
  const allLists = db.select().from(lists).all();

  // Batch insert tasks
  for (const list of allLists) {
      const taskValues = Array.from({ length: TASKS_PER_LIST }).map((_, i) => ({
        listId: list.id,
        name: `Task ${i} in List ${list.id}`,
      }));
       // Batch insert in chunks to avoid SQL limits if necessary, but 100 is fine
      for (const task of taskValues) {
          db.insert(tasks).values(task).run();
      }
  }

  console.log('Benchmarking...');

  const iterations = 100;
  const targetListId = allLists[Math.floor(NUM_LISTS / 2)].id;

  // Measure Old Approach
  const startOld = performance.now();
  for (let i = 0; i < iterations; i++) {
    // Simulate fetching all tasks and filtering
    const allTasks = db.select().from(tasks).all();
    const filteredTasks = allTasks.filter(t => t.listId === targetListId);

    // Simulate fetching all lists and finding
    const fetchedLists = db.select().from(lists).all();
    const foundList = fetchedLists.find(l => l.id === targetListId);
  }
  const endOld = performance.now();
  const timeOld = (endOld - startOld) / iterations;

  // Measure New Approach
  const startNew = performance.now();
  for (let i = 0; i < iterations; i++) {
    // Simulate fetching specific tasks
    const specificTasks = db.select().from(tasks).where(eq(tasks.listId, targetListId)).all();

    // Simulate fetching specific list
    const specificList = db.select().from(lists).where(eq(lists.id, targetListId)).get();
  }
  const endNew = performance.now();
  const timeNew = (endNew - startNew) / iterations;

  console.log('Results (average per iteration):');
  console.log(`Old approach: ${timeOld.toFixed(2)}ms`);
  console.log(`New approach: ${timeNew.toFixed(2)}ms`);
  console.log(`Improvement: ${(timeOld / timeNew).toFixed(2)}x faster`);
};

main();
