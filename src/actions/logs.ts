'use server';

import { db } from '@/lib/db';
import { activityLogs } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function getLogs(taskId: number) {
  return db.select().from(activityLogs).where(eq(activityLogs.taskId, taskId)).orderBy(desc(activityLogs.timestamp)).all();
}
