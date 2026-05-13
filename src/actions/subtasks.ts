'use server';

import { db } from '@/lib/db';
import { tasks, activityLogs, taskLabels, attachments } from '@/lib/schema';
import { eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

export async function createSubtask(parentId: number, name: string) {
  // SECURE: Rate limit subtask creation to prevent DoS/spam
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',').pop()?.trim() || '127.0.0.1';
  if (!rateLimit(`createSubtask:${ip}`, 20, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  if (name && name.length > 255) {
    throw new Error('Subtask name must be 255 characters or less.');
  }

  const result = db.insert(tasks).values({
      name,
      parentId,
      listId: undefined // Subtasks might not belong to a list directly, or inherit?
  }).returning().get();
  try { revalidatePath('/'); } catch { /* empty */ }
  return result;
}

// ⚡ Bolt: Wrapped in React cache() to deduplicate database queries across Server Components in a single render pass
export const getSubtasks = cache(function getSubtasks(parentId: number) {
    return db.select().from(tasks).where(eq(tasks.parentId, parentId)).all();
});

export async function deleteSubtask(id: number) {
    // SECURE: Rate limit subtask deletion to prevent DoS
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',').pop()?.trim() || '127.0.0.1';
    if (!rateLimit(`deleteSubtask:${ip}`, 30, 60 * 1000)) {
        throw new Error('Too many requests. Please try again later.');
    }

    const taskIds = [id];
    const taskAttachments = db.select().from(attachments).where(inArray(attachments.taskId, taskIds)).all();

    db.transaction((tx: typeof db) => {
        tx.delete(taskLabels).where(inArray(taskLabels.taskId, taskIds)).run();
        tx.delete(activityLogs).where(inArray(activityLogs.taskId, taskIds)).run();
        tx.delete(attachments).where(inArray(attachments.taskId, taskIds)).run();
        tx.delete(tasks).where(inArray(tasks.id, taskIds)).run();
    });

    const { unlink } = await import('fs/promises');
    const { join } = await import('path');

    // ⚡ Bolt: Parallelize independent IO-bound file system operations to prevent O(N) latency,
    // contrasting with synchronous better-sqlite3 queries which do not benefit from Promise.all
    await Promise.all(taskAttachments.map(async (att) => {
        try {
            const fileName = att.filePath.split('/').pop() || '';
            if (fileName) await unlink(join(process.cwd(), 'public', 'uploads', fileName));
        } catch { /* ignore missing file errors */ }
    }));

    try { revalidatePath('/'); } catch { /* empty */ }
}
