'use server';

import { db } from '@/lib/db';
import { tasks, activityLogs, taskLabels, labels, attachments } from '@/lib/schema';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';
import { cache } from 'react';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';
import { ALLOWED_TASK_KEYS } from '@/lib/types';

export const getTasks = cache(function getTasks() {
  return db.select().from(tasks).all();
});

export const getIncompleteTasks = cache(function getIncompleteTasks() {
  return db.select().from(tasks).where(eq(tasks.isCompleted, false)).all();
});
export const getUpcomingTasks = cache(function getUpcomingTasks() {
  const today = format(new Date(), "yyyy-MM-dd");
  return db.select().from(tasks)
    .where(sql`${tasks.date} > ${today}`).all();
});
export const getTasksByListId = cache(function getTasksByListId(listId: number) {
  return db.select().from(tasks).where(eq(tasks.listId, listId)).all();
});

export const getTasksByDateRange = cache(function getTasksByDateRange(startDate: string, endDate: string) {
  return db.select().from(tasks)
    .where(
      and(
        sql`${tasks.date} >= ${startDate}`,
        sql`${tasks.date} <= ${endDate}`
      )
    ).all();
});

// ⚡ Bolt: Wrapped in React cache() to deduplicate database queries across Server Components in a single render pass
export const getTaskDetailedInfo = cache(async function getTaskDetailedInfo(taskId: number) {
  const assignedLabels = getTaskLabels(taskId);
  const subtasks = db.select().from(tasks).where(eq(tasks.parentId, taskId)).all();
  const attachmentsList = db.select().from(attachments).where(eq(attachments.taskId, taskId)).all();
  const logs = db.select().from(activityLogs).where(eq(activityLogs.taskId, taskId)).orderBy(desc(activityLogs.timestamp)).all();

  return {
    assignedLabels,
    subtasks,
    attachments: attachmentsList,
    logs
  };
});

export const getTasksForDate = cache(function getTasksForDate(date: string) {
  return db.select().from(tasks).where(eq(tasks.date, date)).all();
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
  const ip = headersList.get('x-forwarded-for')?.split(',').pop()?.trim() || '127.0.0.1';
  if (!rateLimit(`createTask:${ip}`, 20, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  // SECURE: Prevent mass assignment by explicitly selecting allowed fields
  const { name, description, listId, date, priority, recurrenceInterval } = data;

  // SECURE: Enforce input length limits to prevent DoS via payload/database exhaustion
  if (name && name.length > 255) {
    throw new Error('Task name must be 255 characters or less.');
  }
  if (description && description.length > 10000) {
    throw new Error('Task description is too long.');
  }

  const result = db.insert(tasks).values({
    name, description, listId, date, recurrenceInterval,
    priority: priority || 'none',
  }).returning({ id: tasks.id }).get();

  try { revalidatePath('/'); } catch { /* empty */ }
  return result;
}

export async function updateTask(id: number, data: Partial<typeof tasks.$inferInsert>) {
  // SECURE: Rate limit task updates to prevent DoS via payload/database exhaustion (activityLogs is append-only)
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',').pop()?.trim() || '127.0.0.1';
  if (!rateLimit(`updateTask:${ip}`, 30, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  // SECURE: Prevent mass assignment vulnerabilities by omitting protected fields
  const safeData: Partial<typeof tasks.$inferInsert> = {};

  // SECURE: Enforce input length limits to prevent DoS via payload/database exhaustion
  if (data.name && data.name.length > 255) {
    throw new Error('Task name must be 255 characters or less.');
  }
  if (data.description && data.description.length > 10000) {
    throw new Error('Task description is too long.');
  }
  if (data.recurrenceInterval && data.recurrenceInterval.length > 255) {
    throw new Error('Recurrence interval is too long.');
  }
  if (data.reminders && data.reminders.length > 10000) {
    throw new Error('Reminders payload is too long.');
  }
  if (data.recurrenceConfig && data.recurrenceConfig.length > 10000) {
    throw new Error('Recurrence config is too long.');
  }

  for (const key of ALLOWED_TASK_KEYS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((data as Record<string, any>)[key] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (safeData as Record<string, any>)[key] = (data as Record<string, any>)[key];
    }
  }

  // SECURE: Always fetch current state from the database to prevent clients from spoofing audit logs
  const current = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!current) throw new Error("Task not found");

  let hasChanges = false;

  db.transaction((tx: typeof db) => {
    const logsToInsert: (typeof activityLogs.$inferInsert)[] = [];

    // ⚡ Bolt: Iterate over Object.keys() for small Partial payloads since they contain very few modified fields, which is faster than checking a large fixed array
    for (const key of Object.keys(safeData)) {
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
  // SECURE: Rate limit task deletion to prevent DoS
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',').pop()?.trim() || '127.0.0.1';
  if (!rateLimit(`deleteTask:${ip}`, 30, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  const subtasks = db.select({ id: tasks.id }).from(tasks).where(eq(tasks.parentId, id)).all();
  const taskIds = [id, ...subtasks.map((t: { id: number }) => t.id)];
  const taskAttachments = db.select().from(attachments).where(inArray(attachments.taskId, taskIds)).all();

  db.transaction((tx: typeof db) => {
    tx.delete(taskLabels).where(inArray(taskLabels.taskId, taskIds)).run();
    tx.delete(activityLogs).where(inArray(activityLogs.taskId, taskIds)).run();
    tx.delete(attachments).where(inArray(attachments.taskId, taskIds)).run();
    tx.delete(tasks).where(inArray(tasks.id, taskIds)).run();
  });

  const { unlink } = await import('fs/promises');
  const { join } = await import('path');
  for (const att of taskAttachments) {
    try {
        const fileName = att.filePath.split('/').pop() || '';
        if (fileName) await unlink(join(process.cwd(), 'public', 'uploads', fileName));
    } catch { /* ignore missing file errors */ }
  }

  try { revalidatePath('/'); } catch { /* empty */ }
}

// ⚡ Bolt: Wrapped in React cache() to deduplicate database queries across Server Components in a single render pass
export const getActivityLogs = cache(function getActivityLogs(taskId: number) {
    return db.select().from(activityLogs).where(eq(activityLogs.taskId, taskId)).all();
});

// ⚡ Bolt: Wrapped in React cache() to deduplicate database queries across Server Components in a single render pass
export const getTaskLabels = cache(function getTaskLabels(taskId: number) {
    return db.select({
        id: labels.id,
        name: labels.name, createdAt: labels.createdAt,
        color: labels.color
    })
    .from(labels)
    .innerJoin(taskLabels, eq(labels.id, taskLabels.labelId))
    .where(eq(taskLabels.taskId, taskId)).all();
});

export async function toggleTaskLabel(taskId: number, labelId: number, selected: boolean) {
    // SECURE: Rate limit task label toggling to prevent DoS
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',').pop()?.trim() || '127.0.0.1';
    if (!rateLimit(`toggleTaskLabel:${ip}`, 30, 60 * 1000)) {
      throw new Error('Too many requests. Please try again later.');
    }

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

export const getTasksAfterDate = cache(function getTasksAfterDate(startDate: string) {
  return db.select().from(tasks)
    .where(
        sql`${tasks.date} > ${startDate}`
    ).all();
});
