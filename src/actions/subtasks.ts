'use server';

import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';

export async function createSubtask(parentId: number, name: string) {
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
    db.delete(tasks).where(eq(tasks.id, id)).run();
    try { revalidatePath('/'); } catch { /* empty */ }
}
