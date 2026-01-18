'use server';

import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';

export async function toggleTaskCompletion(id: number, isCompleted: boolean) {
  const task = db.select().from(tasks).where(eq(tasks.id, id)).get();
  if (!task) throw new Error("Task not found");

  if (isCompleted && task.recurrenceInterval) {
    let nextDate: Date | null = task.date ? new Date(task.date) : new Date();

    switch (task.recurrenceInterval) {
      case 'DAILY':
        nextDate = addDays(nextDate, 1);
        break;
      case 'WEEKLY':
        nextDate = addWeeks(nextDate, 1);
        break;
      case 'MONTHLY':
        nextDate = addMonths(nextDate, 1);
        break;
      case 'YEARLY':
        nextDate = addYears(nextDate, 1);
        break;
      default:
        nextDate = null;
    }

    if (nextDate) {
      const nextDateStr = format(nextDate, 'yyyy-MM-dd');
      db.insert(tasks).values({
        name: task.name,
        description: task.description,
        listId: task.listId,
        priority: task.priority,
        recurrenceInterval: task.recurrenceInterval,
        recurrenceConfig: task.recurrenceConfig,
        date: nextDateStr,
        parentId: task.parentId
      }).run();
    }
  }

  db.update(tasks).set({
    isCompleted,
    completedAt: isCompleted ? format(new Date(), 'yyyy-MM-dd HH:mm:ss') : null
  }).where(eq(tasks.id, id)).run();

  try { revalidatePath('/'); } catch (e) {}
}
