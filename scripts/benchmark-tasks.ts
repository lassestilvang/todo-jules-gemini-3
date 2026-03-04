import { db } from '../src/lib/db';
import { tasks, lists } from '../src/lib/schema';
import { eq } from 'drizzle-orm';
import { performance } from 'perf_hooks';

async function setupData() {
  console.log('Setting up test data...');
  // Insert a dummy list
  const listId = 1;
  const listExists = db.select().from(lists).where(eq(lists.id, listId)).get();
  if (!listExists) {
    db.insert(lists).values({ id: listId, name: 'Test List' }).run();
  }

  const count = (db.select({ count: tasks.id }).from(tasks).all()).length;
  if (count < 1000) {
    console.log(`Inserting ${1000 - count} tasks...`);
    db.transaction((tx) => {
      for (let i = 0; i < 1000 - count; i++) {
        tx.insert(tasks).values({
          name: `Task ${i}`,
          isCompleted: i % 2 === 0,
          listId: i % 4 === 0 ? listId : null,
          date: new Date().toISOString()
        }).run();
      }
    });
  }
}

async function benchmarkInbox() {
  console.log('\n--- Benchmarking Inbox (Incomplete Tasks) ---');

  // Baseline: Memory filtering
  const startMemory = performance.now();
  for(let i=0; i<100; i++) {
      const allTasks = db.select().from(tasks).all();
      const filtered = allTasks.filter(t => !t.isCompleted);
  }
  const endMemory = performance.now();
  console.log(`Memory Filtering (100 runs): ${(endMemory - startMemory).toFixed(2)}ms`);

  // Optimized: Database filtering
  const startDb = performance.now();
  for(let i=0; i<100; i++) {
      const incompleteTasks = db.select().from(tasks).where(eq(tasks.isCompleted, false)).all();
  }
  const endDb = performance.now();
  console.log(`Database Filtering (100 runs): ${(endDb - startDb).toFixed(2)}ms`);
}

async function benchmarkList() {
  console.log('\n--- Benchmarking List Page (listId = 1) ---');

  const listId = 1;

  // Baseline: Memory filtering
  const startMemory = performance.now();
  for(let i=0; i<100; i++) {
      const allTasks = db.select().from(tasks).all();
      const filtered = allTasks.filter(t => t.listId === listId);
  }
  const endMemory = performance.now();
  console.log(`Memory Filtering (100 runs): ${(endMemory - startMemory).toFixed(2)}ms`);

  // Optimized: Database filtering
  const startDb = performance.now();
  for(let i=0; i<100; i++) {
      const listTasks = db.select().from(tasks).where(eq(tasks.listId, listId)).all();
  }
  const endDb = performance.now();
  console.log(`Database Filtering (100 runs): ${(endDb - startDb).toFixed(2)}ms`);
}

async function run() {
  await setupData();
  await benchmarkInbox();
  await benchmarkList();
}

run().catch(console.error);
