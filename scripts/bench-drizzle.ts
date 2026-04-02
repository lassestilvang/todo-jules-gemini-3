import { db } from '../src/lib/db';
import { tasks } from '../src/lib/schema';
import { performance } from 'perf_hooks';

async function test() {
  const query = db.select().from(tasks);

  // warmup
  for (let i = 0; i < 1000; i++) {
    query.all();
  }

  const startAll = performance.now();
  for (let i = 0; i < 10000; i++) {
    const res = query.all();
  }
  const timeAll = performance.now() - startAll;

  // warmup
  for (let i = 0; i < 1000; i++) {
    await query;
  }

  const startAwait = performance.now();
  for (let i = 0; i < 10000; i++) {
    const res = await query;
  }
  const timeAwait = performance.now() - startAwait;

  console.log(".all():", timeAll.toFixed(2), "ms");
  console.log("await:", timeAwait.toFixed(2), "ms");
}

test().catch(console.error);
