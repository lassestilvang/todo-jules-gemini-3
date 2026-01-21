'use server';

import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';
import { revalidatePath } from 'next/cache';

export async function toggleTaskCompletion(taskId: number, isCompleted: boolean) {
  const task = db.select().from(tasks).where(eq(tasks.id, taskId)).get();
  if (!task) throw new Error("Task not found");

  db.transaction((tx) => {
    // Update original task
    tx.update(tasks).set({
        isCompleted,
        completedAt: isCompleted ? format(new Date(), 'yyyy-MM-dd HH:mm:ss') : null
    }).where(eq(tasks.id, taskId)).run();

    // Handle Recurrence
    if (isCompleted && task.recurrenceInterval && task.recurrenceInterval !== 'none' && task.date) {
        // Calculate next date
        let nextDate = new Date(task.date);
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
        }

        // Check if next occurrence already exists (simple check to avoid duplicates if toggled multiple times quickly)
        // Ideally we should link recurrence instances. For now, we just create a new independent task.
        const nextDateStr = format(nextDate, 'yyyy-MM-dd');

        // Create new task
        tx.insert(tasks).values({
            name: task.name,
            description: task.description,
            listId: task.listId,
            date: nextDateStr,
            priority: task.priority,
            recurrenceInterval: task.recurrenceInterval,
            recurrenceConfig: task.recurrenceConfig,
        }).run();
    }
  });

  try { revalidatePath('/'); } catch { /* empty */ }
}
