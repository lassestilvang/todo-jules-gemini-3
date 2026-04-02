import { db } from '../src/lib/db';
import { tasks, attachments, activityLogs } from '../src/lib/schema';
import { performance } from 'perf_hooks';
import { eq, desc } from 'drizzle-orm';
import { getTaskLabels } from '../src/actions/tasks';

async function test() {
  const taskId = 9999;

  // Warmup
  for (let i = 0; i < 100; i++) {
    await Promise.all([
        getTaskLabels(taskId),
        db.select().from(tasks).where(eq(tasks.parentId, taskId)).all(),
        db.select().from(attachments).where(eq(attachments.taskId, taskId)).all(),
        db.select().from(activityLogs).where(eq(activityLogs.taskId, taskId)).orderBy(desc(activityLogs.timestamp)).all()
    ]);
  }

  const runs = 2000;

  const startPromiseAllSync = performance.now();
  for (let i = 0; i < runs; i++) {
    const [assignedLabels, subtasks, attachmentsList, logs] = await Promise.all([
      getTaskLabels(taskId), // This already returns a promise from the original source file because it's marked as async
      Promise.resolve(db.select().from(tasks).where(eq(tasks.parentId, taskId)).all()),
      Promise.resolve(db.select().from(attachments).where(eq(attachments.taskId, taskId)).all()),
      Promise.resolve(db.select().from(activityLogs).where(eq(activityLogs.taskId, taskId)).orderBy(desc(activityLogs.timestamp)).all())
    ]);
  }
  const timePromiseAllSync = performance.now() - startPromiseAllSync;

  const startPromiseAllThen = performance.now();
  for (let i = 0; i < runs; i++) {
    const [assignedLabels, subtasks, attachmentsList, logs] = await Promise.all([
      getTaskLabels(taskId),
      db.select().from(tasks).where(eq(tasks.parentId, taskId)),
      db.select().from(attachments).where(eq(attachments.taskId, taskId)),
      db.select().from(activityLogs).where(eq(activityLogs.taskId, taskId)).orderBy(desc(activityLogs.timestamp))
    ]);
  }
  const timePromiseAllThen = performance.now() - startPromiseAllThen;

  console.log("Promise.all(.all()):", timePromiseAllSync.toFixed(2), "ms");
  console.log("Promise.all(thenable):", timePromiseAllThen.toFixed(2), "ms");
}

test().catch(console.error);
