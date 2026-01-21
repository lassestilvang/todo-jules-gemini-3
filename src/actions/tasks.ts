'use server';

import { db } from '@/lib/db';
import { tasks, activityLogs, taskLabels, labels } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

export async function getTasks() {
  return db.select().from(tasks).all();
}

export async function createTask(data: {
  name: string;
  description?: string;
  listId?: number;
  date?: string;
  priority?: 'high' | 'medium' | 'low' | 'none';
  recurrenceInterval?: string;
}) {
  const result = db.insert(tasks).values({
    ...data,
    priority: data.priority || 'none',
  }).returning({ id: tasks.id }).get();

  try { revalidatePath('/'); } catch { /* empty */ }
  return result;
}

export async function updateTask(id: number, data: Partial<typeof tasks.$inferInsert>) {
  // Get current task state for logging
  const current = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!current) throw new Error("Task not found");

  db.transaction((tx) => {
    // Log changes
    for (const [key, newValue] of Object.entries(data)) {
      if (key === 'updatedAt') continue;

      const oldValue = (current as Record<string, unknown>)[key];
      // Simple equality check
      if (oldValue != newValue) {
        tx.insert(activityLogs).values({
          taskId: id,
          field: key,
          oldValue: String(oldValue),
          newValue: String(newValue),
        }).run();
      }
    }

    tx.update(tasks).set({ ...data, updatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss') }).where(eq(tasks.id, id)).run();
  });

  try { revalidatePath('/'); } catch { /* empty */ }
}

export async function deleteTask(id: number) {
  db.delete(tasks).where(eq(tasks.id, id)).run();
  try { revalidatePath('/'); } catch { /* empty */ }
}

export async function getActivityLogs(taskId: number) {
    return db.select().from(activityLogs).where(eq(activityLogs.taskId, taskId)).all();
}

export async function getTaskLabels(taskId: number) {
    return db.select({
        id: labels.id,
        name: labels.name,
        color: labels.color
    })
    .from(labels)
    .innerJoin(taskLabels, eq(labels.id, taskLabels.labelId))
    .where(eq(taskLabels.taskId, taskId))
    .all();
}

export async function toggleTaskLabel(taskId: number, labelId: number, selected: boolean) {
    if (selected) {
        const exists = db.select().from(taskLabels).where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId))).get();
        if (!exists) {
            db.insert(taskLabels).values({ taskId, labelId }).run();
        }
    } else {
        db.delete(taskLabels).where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId))).run();
    }
    try { revalidatePath('/'); } catch { /* empty */ }
}
