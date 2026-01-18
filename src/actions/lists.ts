'use server';

import { db } from '@/lib/db';
import { lists } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function getLists() {
  return db.select().from(lists).all();
}

export async function createList(data: { name: string; color?: string; icon?: string }) {
  db.insert(lists).values(data).run();
  try { revalidatePath('/'); } catch (e) {}
}

export async function deleteList(id: number) {
  db.delete(lists).where(eq(lists.id, id)).run();
  try { revalidatePath('/'); } catch (e) {}
}
