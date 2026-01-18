'use server';

import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { like, or } from 'drizzle-orm';

export async function searchTasks(query: string) {
  if (!query) return [];
  const searchPattern = `%${query}%`;
  return db.select().from(tasks).where(
    or(
        like(tasks.name, searchPattern),
        like(tasks.description, searchPattern)
    )
  ).limit(10).all();
}
