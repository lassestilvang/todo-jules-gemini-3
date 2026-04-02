import { db } from '../src/lib/db';
import { tasks } from '../src/lib/schema';
import { eq } from 'drizzle-orm';

async function test() {
  const result1 = db.select().from(tasks).all();
  console.log("Sync result is array:", Array.isArray(result1));

  const result2 = await db.select().from(tasks);
  console.log("Async result is array:", Array.isArray(result2));
}

test().catch(console.error);
