'use server';

import { db } from '@/lib/db';
import { labels } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getLabels() {
  return db.select().from(labels).all();
}

export async function createLabel(data: { name: string; color?: string }) {
  db.insert(labels).values(data).run();
  try { revalidatePath('/'); } catch (e) {}
}

export async function deleteLabel(id: number) {
  db.delete(labels).where(eq(labels.id, id)).run();
  try { revalidatePath('/'); } catch (e) {}
}
