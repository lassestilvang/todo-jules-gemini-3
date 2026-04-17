'use server';

import { db } from '@/lib/db';
import { tasks, activityLogs, taskLabels, labels, attachments } from '@/lib/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';
import { cache } from 'react';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

export const getTasks = cache(async function getTasks() {
  return await db.select().from(tasks);
});

export const getIncompleteTasks = cache(async function getIncompleteTasks() {
  return await db.select().from(tasks).where(eq(tasks.isCompleted, false));
});
export const getUpcomingTasks = cache(async function getUpcomingTasks() {
  const today = format(new Date(), "yyyy-MM-dd");
  return await db.select().from(tasks)
    .where(sql`${tasks.date} > ${today}`);
});
export const getTasksByListId = cache(async function getTasksByListId(listId: number) {
  return await db.select().from(tasks).where(eq(tasks.listId, listId));
});

export const getTasksByDateRange = cache(async function getTasksByDateRange(startDate: string, endDate: string) {
  return await db.select().from(tasks)
    .where(
      and(
        sql`${tasks.date} >= ${startDate}`,
        sql`${tasks.date} <= ${endDate}`
      )
    );
});

// ⚡ Bolt: Wrapped in React cache() to deduplicate database queries across Server Components in a single render pass
export const getTaskDetailedInfo = cache(async function getTaskDetailedInfo(taskId: number) {
  const [assignedLabels, subtasks, attachmentsList, logs] = await Promise.all([
    getTaskLabels(taskId),
    db.select().from(tasks).where(eq(tasks.parentId, taskId)),
    db.select().from(attachments).where(eq(attachments.taskId, taskId)),
    db.select().from(activityLogs).where(eq(activityLogs.taskId, taskId)).orderBy(desc(activityLogs.timestamp))
  ]);

  return {
    assignedLabels,
    subtasks,
    attachments: attachmentsList,
    logs
  };
});

export const getTasksForDate = cache(async function getTasksForDate(date: string) {
  return await db.select().from(tasks).where(eq(tasks.date, date));
});

export async function createTask(data: {
  name: string;
  description?: string;
  listId?: number;
  date?: string;
  priority?: 'high' | 'medium' | 'low' | 'none';
  recurrenceInterval?: string;
}) {
  // SECURE: Rate limit task creation to 20 per minute per IP to prevent DoS/spam
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  if (!rateLimit(`createTask:${ip}`, 20, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  // SECURE: Prevent mass assignment by explicitly selecting allowed fields
  const { name, description, listId, date, priority, recurrenceInterval } = data;

  const result = (await db.insert(tasks).values({
    name, description, listId, date, recurrenceInterval,
    priority: priority || 'none',
  }).returning({ id: tasks.id }))[0];

  try { revalidatePath('/'); } catch { /* empty */ }
  return result;
}

const ALLOWED_TASK_KEYS = ['name', 'description', 'listId', 'parentId', 'date', 'deadline', 'isCompleted', 'completedAt', 'estimate', 'actualTime', 'reminders', 'priority', 'recurrenceInterval', 'recurrenceConfig', 'recurrenceId'] as const;

export async function updateTask(id: number, data: Partial<typeof tasks.$inferInsert>, previousState?: Partial<typeof tasks.$inferInsert>) {
  // SECURE: Prevent mass assignment vulnerabilities by omitting protected fields
  const safeData: Partial<typeof tasks.$inferInsert> = {};

  for (const key of ALLOWED_TASK_KEYS) {
    if ((data as Record<string, any>)[key] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (safeData as Record<string, any>)[key] = (data as Record<string, any>)[key];
    }
  }

  // Try to use provided state, otherwise fallback to fetching
  let current = previousState;

  if (!current) {
      current = (await db.select().from(tasks).where(eq(tasks.id, id)).limit(1))[0];
      if (!current) throw new Error("Task not found");
  }

  let hasChanges = false;

  db.transaction((tx: typeof db) => {
    const logsToInsert: (typeof activityLogs.$inferInsert)[] = [];

    // Log changes - optimized for...in
    for (const key of Object.keys(safeData)) {
      if (key === 'updatedAt' || (safeData as Record<string, unknown>)[key] === undefined) continue;

      const newValue = (safeData as Record<string, unknown>)[key];
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

    if (logsToInsert.length === 0) return; // ⚡ Bolt: Add early return to skip unnecessary DB writes and cache invalidations

    hasChanges = true;
    tx.insert(activityLogs).values(logsToInsert).run();
    tx.update(tasks).set({ ...safeData, updatedAt: sql.raw('CURRENT_TIMESTAMP') }).where(eq(tasks.id, id)).run();
  });

  if (hasChanges) {
    try { revalidatePath('/'); } catch { /* empty */ }
  }
}

export async function deleteTask(id: number) {
  await db.delete(tasks).where(eq(tasks.id, id));
  try { revalidatePath('/'); } catch { /* empty */ }
}

// ⚡ Bolt: Wrapped in React cache() to deduplicate database queries across Server Components in a single render pass
export const getActivityLogs = cache(async function getActivityLogs(taskId: number) {
    return await db.select().from(activityLogs).where(eq(activityLogs.taskId, taskId));
});

// ⚡ Bolt: Wrapped in React cache() to deduplicate database queries across Server Components in a single render pass
export const getTaskLabels = cache(async function getTaskLabels(taskId: number) {
    return await db.select({
        id: labels.id,
        name: labels.name, createdAt: labels.createdAt,
        color: labels.color
    })
    .from(labels)
    .innerJoin(taskLabels, eq(labels.id, taskLabels.labelId))
    .where(eq(taskLabels.taskId, taskId));
});

export async function toggleTaskLabel(taskId: number, labelId: number, selected: boolean) {
    if (selected) {
        const exists = (await db.select().from(taskLabels).where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId))).limit(1))[0];
        if (!exists) {
            await db.insert(taskLabels).values({ taskId, labelId });
        }
    } else {
        await db.delete(taskLabels).where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId)));
    }
    try { revalidatePath('/'); } catch { /* empty */ }
}

export const getTasksAfterDate = cache(async function getTasksAfterDate(startDate: string) {
  return await db.select().from(tasks)
    .where(
        sql`${tasks.date} > ${startDate}`
    );
});
