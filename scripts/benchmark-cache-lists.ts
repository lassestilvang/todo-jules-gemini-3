import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { cache } from 'react';

// Define schema for benchmark to avoid import issues
const lists = sqliteTable('lists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
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

  // Seed data
  const NUM_LISTS = 1000;

  console.log(`Seeding ${NUM_LISTS} lists...`);

  const listValues = Array.from({ length: NUM_LISTS }).map((_, i) => ({
    name: `List ${i}`,
  }));

  // Batch insert lists
  for (const list of listValues) {
      db.insert(lists).values(list).run();
  }

  const getListsUncached = async () => {
    return db.select().from(lists).all();
  };

  const getListsCached = cache(async function getLists() {
    return db.select().from(lists).all();
  });

  console.log('Benchmarking...');

  const iterations = 1000;

  // Measure Old Approach
  const startOld = performance.now();
  for (let i = 0; i < iterations; i++) {
      await getListsUncached();
  }
  const endOld = performance.now();
  const timeOld = (endOld - startOld) / iterations;

  // Measure New Approach
  const startNew = performance.now();
  for (let i = 0; i < iterations; i++) {
      await getListsCached();
  }
  const endNew = performance.now();
  const timeNew = (endNew - startNew) / iterations;

  console.log('Results (average per iteration):');
  console.log(`Uncached approach: ${timeOld.toFixed(4)}ms`);
  console.log(`Cached approach: ${timeNew.toFixed(4)}ms`);

  if (timeOld > timeNew) {
      console.log(`Improvement: ${(timeOld / timeNew).toFixed(2)}x faster`);
  } else {
      console.log(`Improvement: ${(timeNew / timeOld).toFixed(2)}x slower`);
  }
};

main();
