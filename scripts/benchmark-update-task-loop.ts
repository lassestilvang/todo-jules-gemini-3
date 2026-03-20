import { bench, run } from "mitata";

const data = {
  name: "New Task Name",
  description: "Updated description",
  listId: 2,
  date: "2023-10-12",
  priority: "high",
  isCompleted: true,
  recurrenceInterval: "daily",
  updatedAt: "2023-10-11",
};

const current = {
  name: "Old Task Name",
  description: "Old description",
  listId: 1,
  date: "2023-10-11",
  priority: "medium",
  isCompleted: false,
  recurrenceInterval: "weekly",
  updatedAt: "2023-10-10",
  id: 1,
};

bench("Object.entries", () => {
  const logsToInsert = [];
  const id = 1;
  for (const [key, newValue] of Object.entries(data)) {
    if (key === 'updatedAt') continue;

    const oldValue = (current as Record<string, unknown>)[key];
    if (oldValue != newValue) {
      logsToInsert.push({
        taskId: id,
        field: key,
        oldValue: String(oldValue),
        newValue: String(newValue),
      });
    }
  }
  return logsToInsert;
});

bench("for...in", () => {
  const logsToInsert = [];
  const id = 1;
  for (const key in data) {
    if (key === 'updatedAt') continue;

    const newValue = (data as any)[key];
    const oldValue = (current as Record<string, unknown>)[key];
    if (oldValue != newValue) {
      logsToInsert.push({
        taskId: id,
        field: key,
        oldValue: String(oldValue),
        newValue: String(newValue),
      });
    }
  }
  return logsToInsert;
});

bench("Object.keys", () => {
  const logsToInsert = [];
  const id = 1;
  const keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key === 'updatedAt') continue;

    const newValue = (data as any)[key];
    const oldValue = (current as Record<string, unknown>)[key];
    if (oldValue != newValue) {
      logsToInsert.push({
        taskId: id,
        field: key,
        oldValue: String(oldValue),
        newValue: String(newValue),
      });
    }
  }
  return logsToInsert;
});

await run();
