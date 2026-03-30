import { db } from '../src/lib/db';
import { tasks } from '../src/lib/schema';
import { eq } from 'drizzle-orm';

async function test() {
  const result2 = await db.select().from(tasks);
  console.log("Async result is array:", Array.isArray(result2));
}

test().catch(console.error);
