import { db } from '../src/lib/db';
import { lists, tasks } from '../src/lib/schema';
import { eq } from 'drizzle-orm';

async function seed(listCount: number, tasksPerList: number) {
  console.log(`Seeding ${listCount} lists with ${tasksPerList} tasks each...`);
  db.delete(tasks).run();
  db.delete(lists).run();

  const listIds: number[] = [];

  // Batch insert lists if possible, or loop
  // improved sqlite insert for speed
  db.transaction((tx) => {
    for (let i = 0; i < listCount; i++) {
        const res = tx.insert(lists).values({ name: `List ${i}` }).returning({ id: lists.id }).get();
        listIds.push(res.id);
    }

    for (const listId of listIds) {
        for (let j = 0; j < tasksPerList; j++) {
            tx.insert(tasks).values({
                listId: listId,
                name: `Task ${j} in List ${listId}`,
                isCompleted: j % 2 === 0
            }).run();
        }
    }
  });

  return listIds;
}

async function cleanup() {
   // Optional cleanup if needed, but seed clears tables
}

async function run() {
  const listCount = 100;
  const tasksPerList = 50;

  const listIds = await seed(listCount, tasksPerList);
  const targetListId = listIds[Math.floor(listIds.length / 2)]; // Pick a middle one

  console.log(`Target List ID: ${targetListId}`);

  // Old Approach: Fetch All + Filter
  const startOld = performance.now();
  const allLists = db.select().from(lists).all();
  const listOld = allLists.find(l => l.id === targetListId);

  const allTasks = db.select().from(tasks).all();
  const tasksOld = allTasks.filter(t => t.listId === targetListId);
  const endOld = performance.now();

  console.log(`\nOld Approach (Fetch All + Filter):`);
  console.log(`Time: ${(endOld - startOld).toFixed(3)} ms`);
  console.log(`List found: ${listOld ? 'Yes' : 'No'}`);
  console.log(`Tasks found: ${tasksOld.length}`);

  // New Approach: Direct Query
  const startNew = performance.now();
  const listNew = db.select().from(lists).where(eq(lists.id, targetListId)).get();
  const tasksNew = db.select().from(tasks).where(eq(tasks.listId, targetListId)).all();
  const endNew = performance.now();

  console.log(`\nNew Approach (Direct Query):`);
  console.log(`Time: ${(endNew - startNew).toFixed(3)} ms`);
  console.log(`List found: ${listNew ? 'Yes' : 'No'}`);
  console.log(`Tasks found: ${tasksNew.length}`);

  const improvement = (endOld - startOld) / (endNew - startNew);
  console.log(`\nSpeedup: ${improvement.toFixed(1)}x`);
}

run().catch(console.error);
