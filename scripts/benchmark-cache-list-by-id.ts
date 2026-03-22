import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { eq } from 'drizzle-orm';
import { cache } from 'react';

const lists = sqliteTable('lists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

const main = async () => {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite);

  console.log('Setting up benchmark database...');

  sqlite.run(`
    CREATE TABLE lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );
  `);

  const NUM_LISTS = 1000;
  console.log(`Seeding ${NUM_LISTS} lists...`);

  const listValues = Array.from({ length: NUM_LISTS }).map((_, i) => ({
    name: `List ${i}`,
  }));

  for (const list of listValues) {
      db.insert(lists).values(list).run();
  }

  const getListByIdUncached = async (id: number) => {
    return db.select().from(lists).where(eq(lists.id, id)).get();
  };

  const getListByIdCached = cache(async function getListById(id: number) {
    return db.select().from(lists).where(eq(lists.id, id)).get();
  });

  console.log('Benchmarking...');

  const iterations = 10000;
  const targetId = 500;

  // Old Approach
  const startOld = performance.now();
  for (let i = 0; i < iterations; i++) {
      await getListByIdUncached(targetId);
  }
  const endOld = performance.now();
  const timeOld = (endOld - startOld) / iterations;

  // New Approach
  const startNew = performance.now();
  for (let i = 0; i < iterations; i++) {
      await getListByIdCached(targetId);
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
