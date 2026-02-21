import { db } from '../src/lib/db';
import { tasks, lists } from '../src/lib/schema';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: 'drizzle' });

  // Ensure a list exists
  let list = await db.select().from(lists).limit(1).get();
  if (!list) {
      const res = await db.insert(lists).values({ name: 'Benchmark List' }).returning().get();
      list = res;
  }

  console.log('Seeding data...');
  const totalTasks = 10000;
  const batchSize = 1000;
  const today = new Date();

  // Create tasks with dates from -15 to +15 days from today
  for (let i = 0; i < totalTasks; i += batchSize) {
    const batch = [];
    for (let j = 0; j < batchSize; j++) {
      const date = new Date(today);
      date.setDate(today.getDate() + Math.floor(Math.random() * 30) - 15);
      batch.push({
        name: `Task ${i + j}`,
        date: date.toISOString().split('T')[0],
        listId: list.id,
      });
    }
    // Check if db.insert accepts array. Yes in drizzle.
    await db.insert(tasks).values(batch);
  }
  console.log(`Seeded ${totalTasks} tasks.`);

  const todayStr = today.toISOString().split('T')[0];

  console.log('--- Benchmark: "Today" Tasks ---');

  // Measure "Fetch All + Memory Filter" (Bad)
  const startBadToday = performance.now();
  const allTasks = await db.select().from(tasks).all();
  const badTodayTasks = allTasks.filter(t => t.date === todayStr);
  const endBadToday = performance.now();
  console.log(`Bad (Memory Filter): ${(endBadToday - startBadToday).toFixed(2)}ms, found ${badTodayTasks.length} tasks`);

  // Measure "DB Filter" (Good)
  const startGoodToday = performance.now();
  const goodTodayTasks = await db.select().from(tasks).where(sql`${tasks.date} = ${todayStr}`).all();
  const endGoodToday = performance.now();
  console.log(`Good (DB Filter): ${(endGoodToday - startGoodToday).toFixed(2)}ms, found ${goodTodayTasks.length} tasks`);


  console.log('--- Benchmark: "Upcoming" Tasks (> Today) ---');

  // Measure "Fetch All + Memory Filter" (Bad)
  const startBadUpcoming = performance.now();
  const allTasks2 = await db.select().from(tasks).all(); // fetch again to be fair/uncached potentially
  const badUpcomingTasks = allTasks2.filter(t => t.date && t.date > todayStr);
  const endBadUpcoming = performance.now();
  console.log(`Bad (Memory Filter): ${(endBadUpcoming - startBadUpcoming).toFixed(2)}ms, found ${badUpcomingTasks.length} tasks`);

  // Measure "DB Filter" (Good)
  const startGoodUpcoming = performance.now();
  const goodUpcomingTasks = await db.select().from(tasks).where(sql`${tasks.date} > ${todayStr}`).all();
  const endGoodUpcoming = performance.now();
  console.log(`Good (DB Filter): ${(endGoodUpcoming - startGoodUpcoming).toFixed(2)}ms, found ${goodUpcomingTasks.length} tasks`);
}

main().catch(console.error);
