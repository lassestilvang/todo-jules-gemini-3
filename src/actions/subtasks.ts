'use server';

import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getSubtasks(parentId: number) {
  return db.select().from(tasks).where(eq(tasks.parentId, parentId)).all();
}

export async function createSubtask(parentId: number, name: string) {
  const result = db.insert(tasks).values({
    name,
    parentId,
    priority: 'none'
  }).returning().get();

  try { revalidatePath('/'); } catch (e) {}
  return result;
}
