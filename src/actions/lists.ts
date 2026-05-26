'use server';

import { db } from '@/lib/db';
import { lists, tasks } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

export const getLists = cache(function getLists() {
  // Optimized: Cache the lists query to prevent redundant database calls in a single render pass
  return db.select().from(lists).all();
});

export const getListById = cache(function getListById(id: number) {
  return db.select().from(lists).where(eq(lists.id, id)).get();
});

export async function createList(name: string, color: string = '#000000') {
  if (name && name.length > 255) {
    throw new Error('List name must be 255 characters or less.');
  }
  if (color && color.length > 255) {
    throw new Error('List color must be 255 characters or less.');
  }

  // SECURE: Rate limit list creation to prevent DoS/spam
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!rateLimit(`createList:${ip}`, 10, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  db.insert(lists).values({ name, color }).run();
  try { revalidatePath('/'); } catch { /* empty */ }
}

export async function deleteList(id: number) {
  // SECURE: Rate limit list deletion to prevent DoS
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!rateLimit(`deleteList:${ip}`, 30, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  db.transaction((tx: typeof db) => {
    tx.update(tasks).set({ listId: null }).where(eq(tasks.listId, id)).run();
    tx.delete(lists).where(eq(lists.id, id)).run();
  });
  try { revalidatePath('/'); } catch { /* empty */ }
}
