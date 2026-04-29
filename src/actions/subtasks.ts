'use server';

import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

export async function createSubtask(parentId: number, name: string) {
  // SECURE: Rate limit subtask creation to prevent DoS/spam
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  if (!rateLimit(`createSubtask:${ip}`, 20, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  if (name && name.length > 255) {
    throw new Error('Subtask name must be 255 characters or less.');
  }

  db.insert(tasks).values({
      name,
      parentId,
      listId: undefined // Subtasks might not belong to a list directly, or inherit?
  }).run();
  try { revalidatePath('/'); } catch { /* empty */ }
}

// ⚡ Bolt: Wrapped in React cache() to deduplicate database queries across Server Components in a single render pass
export const getSubtasks = cache(async function getSubtasks(parentId: number) {
    return db.select().from(tasks).where(eq(tasks.parentId, parentId)).all();
});

export async function deleteSubtask(id: number) {
    // SECURE: Rate limit subtask deletion to prevent DoS
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    if (!rateLimit(`deleteSubtask:${ip}`, 30, 60 * 1000)) {
        throw new Error('Too many requests. Please try again later.');
    }

    db.delete(tasks).where(eq(tasks.id, id)).run();
    try { revalidatePath('/'); } catch { /* empty */ }
}
