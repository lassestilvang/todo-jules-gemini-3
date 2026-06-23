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

// ⚡ Bolt: Prevent over-fetching by filtering out subtasks (where parentId IS NOT NULL) on root-level lists
export const getTasksInternal = cache(function getTasksInternal() {
  return db.select().from(tasks).where(sql`\${tasks.parentId} IS NULL`).all();
});

export const getTasks = async function getTasks() {
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!rateLimit(`getTasks:${ip}`, 60, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }
  return getTasksInternal();
};

// ⚡ Bolt: Prevent over-fetching by filtering out subtasks (where parentId IS NOT NULL) on root-level lists
export const getIncompleteTasks = cache(async function getIncompleteTasks() {
  // SECURE: Rate limit task retrieval to prevent DoS via database connection exhaustion
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!rateLimit(`getIncompleteTasks:${ip}`, 60, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  return db.select().from(tasks).where(and(eq(tasks.isCompleted, false), sql`${tasks.parentId} IS NULL`)).all();
});

// ⚡ Bolt: Prevent over-fetching by filtering out subtasks (where parentId IS NOT NULL) on root-level lists
export const getUpcomingTasks = cache(async function getUpcomingTasks() {
  // SECURE: Rate limit task retrieval to prevent DoS via database connection exhaustion
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!rateLimit(`getUpcomingTasks:${ip}`, 60, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  const today = format(new Date(), "yyyy-MM-dd");
  return db.select().from(tasks)
    .where(and(sql`${tasks.date} > ${today}`, sql`${tasks.parentId} IS NULL`)).all();
});

// ⚡ Bolt: Prevent over-fetching by filtering out subtasks (where parentId IS NOT NULL) on root-level lists
export const getTasksByListId = cache(async function getTasksByListId(listId: number) {
  // SECURE: Rate limit task retrieval to prevent DoS via database connection exhaustion
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!rateLimit(`getTasksByListId:${ip}`, 60, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  return db.select().from(tasks).where(and(eq(tasks.listId, listId), sql`${tasks.parentId} IS NULL`)).all();
});

// ⚡ Bolt: Prevent over-fetching by filtering out subtasks (where parentId IS NOT NULL) on root-level lists
export const getTasksByDateRange = cache(async function getTasksByDateRange(startDate: string, endDate: string) {
  // SECURE: Rate limit task retrieval to prevent DoS via database connection exhaustion
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!rateLimit(`getTasksByDateRange:${ip}`, 60, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  return db.select().from(tasks)
    .where(
      and(
        sql`${tasks.date} >= ${startDate}`,
        sql`${tasks.date} <= ${endDate}`,
        sql`${tasks.parentId} IS NULL`
      )
    ).all();
});

// ⚡ Bolt: Wrapped in React cache() to deduplicate database queries across Server Components in a single render pass
export const getTaskDetailedInfo = cache(async function getTaskDetailedInfo(taskId: number) {
  // SECURE: Rate limit task retrieval to prevent DoS via database connection exhaustion
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!rateLimit(`getTaskDetailedInfo:${ip}`, 60, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }
  const assignedLabels = await getTaskLabels(taskId);
  const subtasks = db.select().from(tasks).where(eq(tasks.parentId, taskId)).all();
  const attachmentsList = db.select().from(attachments).where(eq(attachments.taskId, taskId)).all();
  // ⚡ Bolt: Removed activity logs fetch from here. The ActivityLog component will now lazily load
  // its own data when mounted to prevent over-fetching large historical data on task open.

  return {
    assignedLabels,
    subtasks,
    attachments: attachmentsList
  };
});

// ⚡ Bolt: Prevent over-fetching by filtering out subtasks (where parentId IS NOT NULL) on root-level lists
export const getTasksForDate = cache(async function getTasksForDate(date: string) {
  // SECURE: Rate limit task retrieval to prevent DoS via database connection exhaustion
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!rateLimit(`getTasksForDate:${ip}`, 60, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  return db.select().from(tasks).where(and(eq(tasks.date, date), sql`${tasks.parentId} IS NULL`)).all();
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
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
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

  // SECURE: Validate priority enum to prevent unexpected behavior
  if (priority && !['high', 'medium', 'low', 'none'].includes(priority)) {
    throw new Error('Invalid priority value.');
  }

  // SECURE: Validate date format to prevent Stored DoS via invalid date parsing in UI
  if (date !== undefined && date !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD.');
    }
    if (isNaN(Date.parse(date))) {
      throw new Error('Invalid date value.');
    }
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
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
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

  // SECURE: Validate priority enum to prevent unexpected behavior
  if (data.priority !== undefined && data.priority !== null) {
    if (!['high', 'medium', 'low', 'none'].includes(data.priority)) {
      throw new Error('Invalid priority value.');
    }
  }

  // SECURE: Validate date fields to prevent Stored DoS via invalid date parsing in UI
  for (const field of ['date', 'deadline'] as const) {
    const val = data[field];
    if (val !== undefined && val !== null) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val) || isNaN(Date.parse(val))) {
        throw new Error(`Invalid ${field} format or value. Expected YYYY-MM-DD.`);
      }
    }
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

  // ⚡ Bolt: Prevent expensive full-page RSC re-renders by skipping cache invalidation for subtasks, which are filtered out of root queries
  if (hasChanges && (current.parentId === null || safeData.parentId === null)) {
    try { revalidatePath('/'); } catch { /* empty */ }
  }
}

export async function deleteTask(id: number) {
  // SECURE: Rate limit task deletion to prevent DoS
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!rateLimit(`deleteTask:${ip}`, 30, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  const subtasks = db.select({ id: tasks.id }).from(tasks).where(eq(tasks.parentId, id)).all();
  const taskIds = [id, ...subtasks.map((t: { id: number }) => t.id)];
  const taskAttachments = db.select().from(attachments).where(inArray(attachments.taskId, taskIds)).all();

  // ⚡ Bolt: Rely on native SQLite ON DELETE CASCADE to handle dependent records
  // (taskLabels, activityLogs, attachments) instead of issuing multiple redundant DELETE queries
  db.delete(tasks).where(inArray(tasks.id, taskIds)).run();

  const { unlink } = await import('fs/promises');
  const { join } = await import('path');

  // ⚡ Bolt: Parallelize independent IO-bound file system operations to prevent O(N) latency,
  // contrasting with synchronous better-sqlite3 queries which do not benefit from Promise.all
  await Promise.all(taskAttachments.map(async (att: { filePath: string }) => {
    try {
        const fileName = att.filePath.split(/[\/\\\\]/).pop() || '';
        if (fileName && fileName !== '.' && fileName !== '..') await unlink(join(process.cwd(), 'public', 'uploads', fileName));
    } catch { /* ignore missing file errors */ }
  }));

  try { revalidatePath('/'); } catch { /* empty */ }
}

// ⚡ Bolt: Wrapped in React cache() to deduplicate database queries across Server Components in a single render pass
export const getActivityLogs = cache(async function getActivityLogs(taskId: number) {
    // SECURE: Rate limit activity log retrieval to prevent DoS via database connection exhaustion
    const headersList = await headers();
    const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    if (!rateLimit(`getActivityLogs:${ip}`, 60, 60 * 1000)) {
        throw new Error('Too many requests. Please try again later.');
    }
    return db.select().from(activityLogs).where(eq(activityLogs.taskId, taskId)).all();
});

// ⚡ Bolt: Wrapped in React cache() to deduplicate database queries across Server Components in a single render pass
export const getTaskLabels = cache(async function getTaskLabels(taskId: number) {
    // SECURE: Rate limit task label retrieval to prevent DoS via database connection exhaustion
    const headersList = await headers();
    const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    if (!rateLimit(`getTaskLabels:${ip}`, 60, 60 * 1000)) {
        throw new Error('Too many requests. Please try again later.');
    }
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
    const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    if (!rateLimit(`toggleTaskLabel:${ip}`, 30, 60 * 1000)) {
      throw new Error('Too many requests. Please try again later.');
    }

    const task = db.select({ parentId: tasks.parentId }).from(tasks).where(eq(tasks.id, taskId)).get();

    let hasChanges = false;

    if (selected) {
        const exists = db.select().from(taskLabels).where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId))).get();
        if (!exists) {
            db.insert(taskLabels).values({ taskId, labelId }).run();
            hasChanges = true;
        }
    } else {
        const result = db.delete(taskLabels).where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId))).run();
        if (result.changes > 0) hasChanges = true;
    }

    // ⚡ Bolt: Prevent expensive full-page RSC re-renders by skipping cache invalidation for subtasks, which are filtered out of root queries
    if (hasChanges && (!task || task.parentId === null)) {
        try { revalidatePath('/'); } catch { /* empty */ }
    }
}

// ⚡ Bolt: Prevent over-fetching by filtering out subtasks (where parentId IS NOT NULL) on root-level lists
export const getTasksAfterDate = cache(async function getTasksAfterDate(startDate: string) {
  // SECURE: Rate limit task retrieval to prevent DoS via database connection exhaustion
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!rateLimit(`getTasksAfterDate:${ip}`, 60, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  return db.select().from(tasks)
    .where(
        and(sql`${tasks.date} > ${startDate}`, sql`${tasks.parentId} IS NULL`)
    ).all();
});
