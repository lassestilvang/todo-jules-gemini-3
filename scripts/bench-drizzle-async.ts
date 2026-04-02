import { db } from '../src/lib/db';
import { tasks } from '../src/lib/schema';
import { performance } from 'perf_hooks';

async function test() {
  console.log("Warming up...");
  for (let i = 0; i < 50; i++) {
    db.select().from(tasks).all();
  }

  const runs = 500;

  const startAll = performance.now();
  for (let i = 0; i < runs; i++) {
    const res = db.select().from(tasks).all();
  }
  const timeAll = performance.now() - startAll;

  console.log("sync .all():", timeAll.toFixed(2), "ms");

  const startAwaitAll = performance.now();
  for (let i = 0; i < runs; i++) {
    const res = await db.select().from(tasks);
  }
  const timeAwaitAll = performance.now() - startAwaitAll;

  console.log("await (thenable):", timeAwaitAll.toFixed(2), "ms");
}

test().catch(console.error);
