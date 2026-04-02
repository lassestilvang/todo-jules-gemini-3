import { db } from '../src/lib/db';
import { tasks } from '../src/lib/schema';

async function test() {
  const query1 = db.select().from(tasks);
  const query2 = db.select().from(tasks);

  let ticks = 0;
  const interval = setInterval(() => ticks++, 1);

  console.log("Starting Promise.all with thenables...");
  const start = Date.now();

  // Create big queries
  for(let i=0; i<5000; i++) {
    db.insert(tasks).values({name: 'test'}).run();
  }

  await Promise.all([
     query1, query2, db.select().from(tasks), db.select().from(tasks)
  ]);

  const end = Date.now();
  clearInterval(interval);
  console.log(`Time: ${end - start}ms, Ticks: ${ticks}`);
}

test().catch(console.error);
