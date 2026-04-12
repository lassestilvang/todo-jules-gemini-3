import { run, bench, group } from 'mitata';

const data = {
  name: 'Updated Task Name',
  description: 'Updated Description',
  priority: 'high',
  listId: 2,
};

const current = {
  name: 'Old Task Name',
  description: 'Old Description',
  priority: 'low',
  listId: 1,
};

function benchForIn(dataObj: Record<string, unknown>, currentObj: Record<string, unknown>) {
  let count = 0;
  for (const key in dataObj) {
    if (key === 'updatedAt' || !Object.hasOwn(dataObj, key)) continue;
    const newValue = dataObj[key];
    const oldValue = currentObj[key];
    if (oldValue != newValue) {
      count++;
    }
  }
  return count;
}

function benchObjectKeys(dataObj: Record<string, unknown>, currentObj: Record<string, unknown>) {
  let count = 0;
  for (const key of Object.keys(dataObj)) {
    if (key === 'updatedAt') continue;
    const newValue = dataObj[key];
    const oldValue = currentObj[key];
    if (oldValue != newValue) {
      count++;
    }
  }
  return count;
}

group('Task Update Data Loop', () => {
  bench('for...in loop (current)', () => benchForIn(data, current));
  bench('Object.keys loop (new)', () => benchObjectKeys(data, current));
});

run();
