'use server';

import { db } from '@/lib/db';
import { labels, taskLabels } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

export const getLabels = cache(function getLabels() {
  return db.select().from(labels).all();
});

export async function createLabel(data: { name: string; color?: string }) {
  // SECURE: Rate limit label creation to prevent DoS/spam
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')?.pop()?.trim() || '127.0.0.1';
  if (!rateLimit(`createLabel:${ip}`, 10, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  // SECURE: Prevent mass assignment
  const { name, color } = data;

  if (name && name.length > 255) {
    throw new Error('Label name must be 255 characters or less.');
  }
  if (color && color.length > 255) {
    throw new Error('Label color must be 255 characters or less.');
  }
  db.insert(labels).values({ name, color }).run();
  try { revalidatePath('/'); } catch { /* empty */ }
}

export async function deleteLabel(id: number) {
  // SECURE: Rate limit label deletion to prevent DoS
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',').pop()?.trim() || '127.0.0.1';
  if (!rateLimit(`deleteLabel:${ip}`, 30, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  db.transaction((tx: typeof db) => {
    tx.delete(taskLabels).where(eq(taskLabels.labelId, id)).run();
    tx.delete(labels).where(eq(labels.id, id)).run();
  });
  try { revalidatePath('/'); } catch { /* empty */ }
}
