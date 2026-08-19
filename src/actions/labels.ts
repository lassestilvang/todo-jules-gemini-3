'use server';

import { db } from '@/lib/db';
import { labels, taskLabels } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { cache } from 'react';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

export const getLabels = cache(async function getLabels() {
  // SECURE: Rate limit label retrieval to prevent DoS via database connection exhaustion
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!rateLimit(`getLabels:${ip}`, 60, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  return db.select().from(labels).all();
});

export async function createLabel(data: { name: string; color?: string }) {
  // SECURE: Rate limit label creation to prevent DoS/spam
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
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
  if (color && !/^#([0-9a-fA-F]{3}){1,2}$/.test(color)) {
    throw new Error('Invalid color format. Expected hex code.');
  }
  db.insert(labels).values({ name, color }).run();
  try { revalidatePath('/'); } catch { /* empty */ }
}

export async function deleteLabel(id: number) {
  // SECURE: Rate limit label deletion to prevent DoS
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!rateLimit(`deleteLabel:${ip}`, 30, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  // ⚡ Bolt: Rely on native SQLite ON DELETE CASCADE to handle dependent records
  // (taskLabels) instead of issuing multiple redundant DELETE queries
  db.delete(labels).where(eq(labels.id, id)).run();
  try { revalidatePath('/'); } catch { /* empty */ }
}
