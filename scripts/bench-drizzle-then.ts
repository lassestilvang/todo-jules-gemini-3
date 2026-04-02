import { db } from '../src/lib/db';
import { tasks } from '../src/lib/schema';
import { performance } from 'perf_hooks';

async function test() {
  console.log("Warming up...");
  for (let i = 0; i < 1000; i++) {
    db.select().from(tasks).all();
  }

  const runs = 5000;

  const startAll = performance.now();
  for (let i = 0; i < runs; i++) {
    const res = db.select().from(tasks).all();
  }
  const timeAll = performance.now() - startAll;

  console.log("sync .all():", timeAll.toFixed(2), "ms");

  const startThen = performance.now();
  for (let i = 0; i < runs; i++) {
    const res = await db.select().from(tasks);
  }
  const timeThen = performance.now() - startThen;

  console.log("await (thenable):", timeThen.toFixed(2), "ms");
}

test().catch(console.error);
