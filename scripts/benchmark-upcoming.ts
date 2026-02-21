import Database from 'better-sqlite3';
import { performance } from 'perf_hooks';
import fs from 'fs';

const dbPath = 'benchmark.db';
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}
const db = new Database(dbPath);

// Setup Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    date TEXT,
    is_completed INTEGER DEFAULT 0
  );
`);

const stmt = db.prepare('INSERT INTO tasks (name, date, is_completed) VALUES (?, ?, ?)');
const seedCount = 10000;
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

console.log('Seeding 10,000 tasks...');
const seedStart = performance.now();

const insert = db.transaction((tasks) => {
  for (const task of tasks) stmt.run(task.name, task.date, task.isCompleted);
});

const tasksToInsert = [];
for (let i = 0; i < seedCount; i++) {
  const isFuture = i % 2 === 0;
  const date = new Date(today);
  const offset = Math.floor(Math.random() * 30) + 1; // 1 to 30 days offset
  if (isFuture) {
    date.setDate(date.getDate() + offset);
  } else {
    date.setDate(date.getDate() - offset);
  }
  tasksToInsert.push({
    name: `Task ${i}`,
    date: date.toISOString().split('T')[0],
    isCompleted: 0
  });
}

// Add some for "today" to test boundary
tasksToInsert.push({ name: 'Task Today', date: todayStr, isCompleted: 0 });

insert(tasksToInsert);

console.log(`Seeding complete in ${(performance.now() - seedStart).toFixed(2)}ms`);

// Benchmark Baseline
console.log('\n--- Baseline (Filter in JS) ---');
const baselineStart = performance.now();
const allTasks = db.prepare('SELECT * FROM tasks').all();
// Simulate original logic: new Date(t.date) > new Date()
// This usually excludes today as discussed.
const upcomingTasksBaseline = allTasks.filter((t: any) => t.date && new Date(t.date) > new Date());
const baselineTime = performance.now() - baselineStart;
console.log(`Time: ${baselineTime.toFixed(2)}ms`);
console.log(`Count: ${upcomingTasksBaseline.length}`);

// Benchmark Optimized
console.log('\n--- Optimized (Filter in SQL) ---');
const optimizedStart = performance.now();
// Using > to match exclusion of today
const upcomingTasksOptimized = db.prepare('SELECT * FROM tasks WHERE date > ?').all(todayStr);
const optimizedTime = performance.now() - optimizedStart;
console.log(`Time: ${optimizedTime.toFixed(2)}ms`);
console.log(`Count: ${upcomingTasksOptimized.length}`);

// Comparison
const improvement = ((baselineTime - optimizedTime) / baselineTime) * 100;
console.log(`\nImprovement: ${improvement.toFixed(2)}% faster`);

db.close();
fs.unlinkSync(dbPath);
