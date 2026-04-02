import { db } from '../src/lib/db';
import { tasks } from '../src/lib/schema';
import { performance } from 'perf_hooks';
import { eq } from 'drizzle-orm';

async function test() {
  const count = db.select().from(tasks).all().length;
  console.log("Total tasks:", count);

  console.log("Benchmarking .all() vs await ... with single query");

  // warmup
  for (let i = 0; i < 100; i++) {
    db.select().from(tasks).all();
    await db.select().from(tasks);
  }

  const query = db.select().from(tasks);

  const startAll = performance.now();
  for (let i = 0; i < 5000; i++) {
    const res = query.all();
  }
  console.log("query.all():", performance.now() - startAll, "ms");

  const startAwait = performance.now();
  for (let i = 0; i < 5000; i++) {
    const res = await query;
  }
  console.log("await query:", performance.now() - startAwait, "ms");
}

test().catch(console.error);
