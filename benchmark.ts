import { getLists, createList } from './src/actions/lists';
import { getLabels, createLabel } from './src/actions/labels';
import { db } from './src/lib/db';
import { lists, labels } from './src/lib/schema';
import { sql } from 'drizzle-orm';

async function seed() {
  console.log('Seeding database...');
  // Create 100 lists and 100 labels to simulate a realistic scenario
  for (let i = 0; i < 100; i++) {
    await createList(`List ${i}`);
    await createLabel({ name: `Label ${i}` });
  }
}

async function cleanup() {
  console.log('Cleaning up database...');
  await db.delete(lists).run();
  await db.delete(labels).run();
}

async function benchmark() {
  await cleanup();
  await seed();

  const iterations = 50;

  console.log('Starting benchmark...');

  // Warmup
  await getLists();
  await getLabels();

  // Sequential
  const startSeq = performance.now();
  for (let i = 0; i < iterations; i++) {
    await getLists();
    await getLabels();
  }
  const endSeq = performance.now();
  const avgSeq = (endSeq - startSeq) / iterations;
  console.log(`Sequential Average: ${avgSeq.toFixed(2)} ms`);

  // Parallel
  const startPar = performance.now();
  for (let i = 0; i < iterations; i++) {
    await Promise.all([getLists(), getLabels()]);
  }
  const endPar = performance.now();
  const avgPar = (endPar - startPar) / iterations;
  console.log(`Parallel Average: ${avgPar.toFixed(2)} ms`);

  const improvement = ((avgSeq - avgPar) / avgSeq) * 100;
  console.log(`Improvement: ${improvement.toFixed(2)}%`);

  await cleanup();
}

benchmark().catch(console.error);
