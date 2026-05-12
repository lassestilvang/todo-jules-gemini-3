'use server';

import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { or, sql } from 'drizzle-orm';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

export async function searchTasks(query: string) {
  if (!query || !query.trim()) return [];

  if (query.length > 255) {
    throw new Error('Search query must be 255 characters or less.');
  }

  // SECURE: Rate limit search queries to 30 per minute per IP to prevent DoS via expensive LIKE queries
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',').pop()?.trim() || '127.0.0.1';
  if (!rateLimit('searchTasks:' + ip, 30, 60 * 1000)) {
    throw new Error('Too many search requests. Please try again later.');
  }

  // SECURE: Escape wildcard characters to prevent ReDoS/database exhaustion via massive wildcard expansion
  const escapedQuery = query.replace(/[\\%_]/g, '\\$&');
  const searchPattern = `%${escapedQuery}%`;
  return db.select().from(tasks).where(
    or(
        sql`${tasks.name} LIKE ${searchPattern} ESCAPE '\\'`,
        sql`${tasks.description} LIKE ${searchPattern} ESCAPE '\\'`
    )
  ).limit(10).all();
}
