'use server';

import { db } from '@/lib/db';
import { tasks, taskLabels } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';
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
            const newTask = tx.insert(tasks).values({
                name: task.name,
                description: task.description,
                listId: task.listId,
                date: nextDateStr,
                priority: task.priority,
                recurrenceInterval: task.recurrenceInterval,
                recurrenceConfig: task.recurrenceConfig,
                recurrenceId: recurrenceId,
                estimate: task.estimate,
                reminders: task.reminders,
            }).returning().get();

            if (newTask) {
                // Copy labels
                tx.run(sql`INSERT INTO ${taskLabels} (${taskLabels.taskId}, ${taskLabels.labelId}) SELECT ${newTask.id}, ${taskLabels.labelId} FROM ${taskLabels} WHERE ${taskLabels.taskId} = ${task.id}`);

                // Copy subtasks completely to avoid data loss
                tx.run(sql`
                    INSERT INTO tasks (
                        list_id, parent_id, name, description,
                        date, deadline, is_completed, completed_at,
                        estimate, actual_time, reminders, priority,
                        recurrence_interval, recurrence_config, recurrence_id
                    )
                    SELECT
                        list_id, ${newTask.id}, name, description,
                        date, deadline, false, null,
                        estimate, null, reminders, priority,
                        recurrence_interval, recurrence_config, recurrence_id
                    FROM tasks
                    WHERE parent_id = ${task.id}
                `);
            }
        }
    }
  });

  try { revalidatePath('/'); } catch { /* empty */ }
}
