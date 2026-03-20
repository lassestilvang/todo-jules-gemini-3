'use server';

import { db } from '@/lib/db';
import { tasks, activityLogs, taskLabels, labels, attachments } from '@/lib/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

export async function getTasks() {
  return db.select().from(tasks).all();
}

export async function getIncompleteTasks() {
  return db.select().from(tasks).where(eq(tasks.isCompleted, false)).all();
}
export async function getUpcomingTasks() {
  const today = format(new Date(), "yyyy-MM-dd");
  return db.select().from(tasks)
    .where(sql`${tasks.date} > ${today}`)
    .all();
}
export async function getTasksByListId(listId: number) {
  return db.select().from(tasks).where(eq(tasks.listId, listId)).all();
}

export async function getTasksByDateRange(startDate: string, endDate: string) {
  return db.select().from(tasks)
    .where(
      and(
        sql`${tasks.date} >= ${startDate}`,
        sql`${tasks.date} <= ${endDate}`
      )
    )
    .all();
}

export async function getTaskDetailedInfo(taskId: number) {
  const [assignedLabels, subtasks, attachmentsList, logs] = await Promise.all([
    getTaskLabels(taskId),
    db.select().from(tasks).where(eq(tasks.parentId, taskId)).all(),
    db.select().from(attachments).where(eq(attachments.taskId, taskId)).all(),
    db.select().from(activityLogs).where(eq(activityLogs.taskId, taskId)).orderBy(desc(activityLogs.timestamp)).all()
  ]);

  return {
    assignedLabels,
    subtasks,
    attachments: attachmentsList,
    logs
  };
}

export async function getTasksForDate(date: string) {
  return db.select().from(tasks).where(eq(tasks.date, date)).all();
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

  db.transaction((tx: typeof db) => {
    const logsToInsert: (typeof activityLogs.$inferInsert)[] = [];
    // Log changes
    for (const key in data) {
      const newValue = data[key as keyof typeof data];
      if (key === 'updatedAt') continue;

      const oldValue = (current as Record<string, unknown>)[key];
      // Simple equality check
      if (oldValue != newValue) {
        logsToInsert.push({
          taskId: id,
          field: key,
          oldValue: String(oldValue),
          newValue: String(newValue),
        });
      }
    }

    if (logsToInsert.length > 0) {
      tx.insert(activityLogs).values(logsToInsert).run();
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
        name: labels.name, createdAt: labels.createdAt,
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

export async function getTasksAfterDate(startDate: string) {
  return db.select().from(tasks)
    .where(
        sql`${tasks.date} > ${startDate}`
    )
    .all();
}
