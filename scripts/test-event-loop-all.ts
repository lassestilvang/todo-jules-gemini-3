import { db } from '../src/lib/db';
import { tasks } from '../src/lib/schema';

async function test() {
  const query1 = db.select().from(tasks);
  const query2 = db.select().from(tasks);

  let ticks = 0;
  const interval = setInterval(() => ticks++, 1);

  console.log("Starting Promise.all with .all()...");
  const start = Date.now();

  await Promise.all([
     Promise.resolve(query1.all()),
     Promise.resolve(query2.all()),
     Promise.resolve(db.select().from(tasks).all()),
     Promise.resolve(db.select().from(tasks).all())
  ]);

  const end = Date.now();
  clearInterval(interval);
  console.log(`Time: ${end - start}ms, Ticks: ${ticks}`);
}

test().catch(console.error);
