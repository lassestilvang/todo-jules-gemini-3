import { db } from '../src/lib/db';
import { tasks } from '../src/lib/schema';
import { performance } from 'perf_hooks';
import { eq } from 'drizzle-orm';

async function getTaskLabelsSync() {
  // simulate
  return db.select().from(tasks).limit(10).all();
}

async function getTaskLabelsAsync() {
  return Promise.resolve(db.select().from(tasks).limit(10).all());
}

async function test() {
  const taskId = 1;
  console.log("Benchmarking Promise.all vs Sequential...");

  const runs = 10000;

  const startPromiseAll = performance.now();
  for (let i = 0; i < runs; i++) {
    const [assignedLabels, subtasks, attachmentsList, logs] = await Promise.all([
      getTaskLabelsAsync(),
      db.select().from(tasks).where(eq(tasks.parentId, taskId)).all(),
      db.select().from(tasks).where(eq(tasks.id, taskId)).all(),
      db.select().from(tasks).where(eq(tasks.listId, taskId)).all()
    ]);
  }
  const timePromiseAll = performance.now() - startPromiseAll;

  const startSequential = performance.now();
  for (let i = 0; i < runs; i++) {
    const assignedLabels = await getTaskLabelsAsync();
    const subtasks = db.select().from(tasks).where(eq(tasks.parentId, taskId)).all();
    const attachmentsList = db.select().from(tasks).where(eq(tasks.id, taskId)).all();
    const logs = db.select().from(tasks).where(eq(tasks.listId, taskId)).all();
  }
  const timeSequential = performance.now() - startSequential;

  console.log("Promise.all:", timePromiseAll.toFixed(2), "ms");
  console.log("Sequential:", timeSequential.toFixed(2), "ms");
}

test().catch(console.error);
