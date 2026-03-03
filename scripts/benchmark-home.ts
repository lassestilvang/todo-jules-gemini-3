import { db } from '../src/lib/db';
import { tasks, lists } from '../src/lib/schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { eq, sql } from 'drizzle-orm';

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: 'drizzle' });

  // Ensure a list exists
  let list = await db.select().from(lists).limit(1).get();
  if (!list) {
      const res = await db.insert(lists).values({ name: 'Benchmark List' }).returning().get();
      list = res;
  }

  // Count existing tasks
  const existing = await db.select({ count: tasks.id }).from(tasks).all();
  console.log(`Current task count: ${existing.length}`);

  // Create mixed workload: 80% completed, 20% incomplete (simulating realistic inbox)
  // The original problem was filtering *incomplete* tasks.
  // If most tasks are completed, fetching ALL tasks is wasteful.

  if (existing.length < 20000) {
      console.log('Seeding up to 20,000 tasks (80% completed)...');
      const needed = 20000 - existing.length;
      const batchSize = 1000;

      for (let i = 0; i < needed; i += batchSize) {
        const batch = [];
        const limit = Math.min(batchSize, needed - i);
        for (let j = 0; j < limit; j++) {
          batch.push({
            name: `Task ${i + j}`,
            isCompleted: Math.random() < 0.8, // 80% completed
            listId: list.id,
            date: new Date().toISOString().split('T')[0]
          });
        }
        await db.insert(tasks).values(batch);
      }
      console.log(`Seeded ${needed} tasks.`);
  }

  console.log('--- Benchmark: Home Page "Incomplete Tasks" ---');

  // Warmup
  await db.select().from(tasks).all();

  const iterations = 50;
  let totalBad = 0;
  let totalGood = 0;

  for (let i = 0; i < iterations; i++) {
    const startBad = performance.now();
    const allTasks = await db.select().from(tasks).all();
    const badFiltered = allTasks.filter(t => !t.isCompleted);
    const endBad = performance.now();
    totalBad += (endBad - startBad);

    const startGood = performance.now();
    const goodFiltered = await db.select().from(tasks).where(eq(tasks.isCompleted, false)).all();
    const endGood = performance.now();
    totalGood += (endGood - startGood);
  }

  const avgBad = totalBad / iterations;
  const avgGood = totalGood / iterations;

  console.log(`Current (Memory Filter) Avg: ${avgBad.toFixed(2)}ms`);
  console.log(`Proposed (DB Filter) Avg:    ${avgGood.toFixed(2)}ms`);
  console.log(`Improvement:                 ${(avgBad - avgGood).toFixed(2)}ms faster (${((avgBad - avgGood) / avgBad * 100).toFixed(1)}%)`);
}

main().catch(console.error);
