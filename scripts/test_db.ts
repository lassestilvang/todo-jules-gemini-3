import { db } from '../src/lib/db';
import { tasks } from '../src/lib/schema';

async function main() {
  try {
    const allTasks = db.select().from(tasks).all();
    console.log(`Found ${allTasks.length} tasks`);
  } catch (e) {
    console.error(e);
  }
}
main();
