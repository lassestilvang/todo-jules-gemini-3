import { db } from './src/lib/db';
import { tasks } from './src/lib/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const startOld = performance.now();
  const all = await db.select().from(tasks).all();
  const filtered = all.filter(t => !t.isCompleted);
  const endOld = performance.now();

  const startNew = performance.now();
  const direct = await db.select().from(tasks).where(eq(tasks.isCompleted, false)).all();
  const endNew = performance.now();

  console.log('Old (fetch all + filter):', (endOld - startOld).toFixed(3), 'ms');
  console.log('New (db filter):', (endNew - startNew).toFixed(3), 'ms');
  console.log('Items found (old):', filtered.length);
  console.log('Items found (new):', direct.length);
}

run();
