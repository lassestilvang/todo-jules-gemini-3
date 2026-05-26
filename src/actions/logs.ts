'use server';

import { db } from '@/lib/db';
import { activityLogs } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

export async function getLogs(taskId: number) {
  // SECURE: Rate limit log retrieval to prevent DoS via database exhaustion
  const headersList = await headers();
  const ip = headersList.get('x-real-ip') || headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  if (!rateLimit(`getLogs:${ip}`, 60, 60 * 1000)) {
    throw new Error('Too many requests. Please try again later.');
  }

  return db.select().from(activityLogs).where(eq(activityLogs.taskId, taskId)).orderBy(desc(activityLogs.timestamp)).all();
}
