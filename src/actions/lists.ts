'use server';

import { db } from '@/lib/db';
import { lists } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';

export const getLists = cache(async function getLists() {
  return db.select().from(lists).all();
});

export async function getListById(id: number) {
  return db.select().from(lists).where(eq(lists.id, id)).get();
}

export async function createList(name: string, color: string = '#000000') {
  db.insert(lists).values({ name, color }).run();
  try { revalidatePath('/'); } catch { /* empty */ }
}

export async function deleteList(id: number) {
  db.delete(lists).where(eq(lists.id, id)).run();
  try { revalidatePath('/'); } catch { /* empty */ }
}
