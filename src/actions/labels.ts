'use server';

import { db } from '@/lib/db';
import { labels } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';

export const getLabels = cache(async function getLabels() {
  return db.select().from(labels).all();
});

export async function createLabel(data: { name: string; color?: string }) {
  // SECURE: Prevent mass assignment
  const { name, color } = data;
  db.insert(labels).values({ name, color }).run();
  try { revalidatePath('/'); } catch { /* empty */ }
}

export async function deleteLabel(id: number) {
  db.delete(labels).where(eq(labels.id, id)).run();
  try { revalidatePath('/'); } catch { /* empty */ }
}
