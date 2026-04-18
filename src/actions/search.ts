'use server';

import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { like, or } from 'drizzle-orm';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

export async function searchTasks(query: string) {
  // SECURE: Rate limit search queries to 30 per minute per IP to prevent DoS via expensive LIKE queries
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
  if (!rateLimit(`searchTasks:${ip}`, 30, 60 * 1000)) {
    throw new Error('Too many search requests. Please try again later.');
  }

  if (!query) return [];
  const searchPattern = `%${query}%`;
  return db.select().from(tasks).where(
    or(
        like(tasks.name, searchPattern),
        like(tasks.description, searchPattern)
    )
  ).limit(10).all();
}
