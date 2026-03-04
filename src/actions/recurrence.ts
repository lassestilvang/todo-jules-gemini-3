'use server';

import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { addDays, addWeeks, addMonths, addYears, format } from 'date-fns';
import { revalidatePath } from 'next/cache';

export async function toggleTaskCompletion(taskId: number, isCompleted: boolean) {
  const task = db.select().from(tasks).where(eq(tasks.id, taskId)).get();
  if (!task) throw new Error("Task not found");

  db.transaction((tx: typeof db) => {
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

        const nextDateStr = format(nextDate, 'yyyy-MM-dd');

        // Determine recurrence ID (link to original task)
        const recurrenceId = task.recurrenceId || task.id;

        // Check if next occurrence already exists (simple check to avoid duplicates if toggled multiple times quickly)
        const existingTask = tx.select()
          .from(tasks)
          .where(and(
              eq(tasks.recurrenceId, recurrenceId),
              eq(tasks.date, nextDateStr)
          ))
          .get();

        if (!existingTask) {
            // Create new task
            tx.insert(tasks).values({
                name: task.name,
                description: task.description,
                listId: task.listId,
                date: nextDateStr,
                priority: task.priority,
                recurrenceInterval: task.recurrenceInterval,
                recurrenceConfig: task.recurrenceConfig,
                recurrenceId: recurrenceId,
            }).run();
        }
    }
  });

  try { revalidatePath('/'); } catch { /* empty */ }
}
