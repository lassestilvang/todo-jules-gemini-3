import { db } from '../src/lib/db';
import { tasks } from '../src/lib/schema';

async function test() {
  let ticks = 0;
  const interval = setInterval(() => ticks++, 1);

  console.log("Starting...");

  // ensure data
  try {
    for(let i=0; i<5000; i++) db.insert(tasks).values({name: 'test'}).run();
  } catch(e) {}

  const startAll = Date.now();
  const res1 = db.select().from(tasks).all();
  console.log("Sync .all() Time:", Date.now() - startAll, "Ticks:", ticks);

  ticks = 0;
  const startAwait = Date.now();
  const res2 = await db.select().from(tasks);
  console.log("Await Time:", Date.now() - startAwait, "Ticks:", ticks);

  clearInterval(interval);
}

test().catch(console.error);
