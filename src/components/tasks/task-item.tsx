'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Calendar, Repeat } from 'lucide-react';
import { toggleTaskCompletion } from '@/actions/recurrence';
import { Task } from '@/lib/types';

interface TaskItemProps {
  task: Task;
  onToggle?: (id: number, checked: boolean) => void;
  onClick: (task: Task) => void;
}

// ⚡ Bolt: Memoize TaskItem to prevent unnecessary re-renders of list items during parent state updates (e.g. typing in the "Add a new task" input)
export const TaskItem = React.memo(function TaskItem({ task, onToggle, onClick }: TaskItemProps) {
  // ⚡ Bolt: Precompute date parsing and formatting to prevent redundant inline evaluations on every render
  const { isOverdue, formattedDate } = React.useMemo(() => {
    if (!task.date) return { isOverdue: false, formattedDate: '' };

    const parsedDate = new Date(task.date);
    const isValidDate = !isNaN(parsedDate.getTime());

    if (!isValidDate) return { isOverdue: false, formattedDate: '' };

    return {
      isOverdue: parsedDate < new Date() && !task.isCompleted,
      formattedDate: format(parsedDate, 'MMM d')
    };
  }, [task.date, task.isCompleted]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center space-x-4 p-4 border rounded-lg mb-2 bg-card hover:bg-accent/50 transition-colors cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        task.isCompleted && "opacity-50"
      )}
      onClick={() => onClick(task)}
      role="button"
      tabIndex={0}
      aria-label={`Open details for task: ${task.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(task);
        }
      }}
    >
      <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
        <Checkbox
          aria-label={`Mark task "${task.name}" as ${task.isCompleted ? 'incomplete' : 'complete'}`}
          checked={!!task.isCompleted}
          onCheckedChange={async (checked) => {
             if (onToggle) {
                 onToggle(task.id, checked as boolean);
             } else {
                 await toggleTaskCompletion(task.id, checked as boolean);
             }
          }}
        />
      </div>

      <div className="flex-1 space-y-1">
        <div className={cn("font-medium", task.isCompleted && "line-through decoration-muted-foreground")}>
          {task.name}
        </div>
        <div className="text-xs text-muted-foreground flex items-center space-x-2">
            {task.priority !== 'none' && (
                <Badge variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'secondary' : 'outline'} className="text-[10px] px-1 py-0 h-5 capitalize" title={`Priority: ${task.priority}`}>
                    <span className="sr-only">Priority: </span>{task.priority}
                </Badge>
            )}
            {formattedDate && (
                <span className={cn("flex items-center", isOverdue && "text-destructive font-bold")} title={isOverdue ? `Overdue: ${formattedDate}` : `Due date: ${formattedDate}`}>
                    <Calendar className="w-3 h-3 mr-1" aria-hidden="true" />
                    <span className="sr-only">Due date: </span>
                    {isOverdue && <span className="sr-only">Overdue: </span>}
                    {formattedDate}
                </span>
            )}
            {task.recurrenceInterval && task.recurrenceInterval !== 'none' && (
                <span className="flex items-center text-blue-500" title={`Repeats: ${task.recurrenceInterval}`}>
                    <Repeat className="w-3 h-3 mr-1" aria-hidden="true" />
                    <span className="sr-only">Repeats: </span>{task.recurrenceInterval}
                </span>
            )}
        </div>
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  // ⚡ Bolt: Implement custom shallow equality comparator.
  // Data fetched from Next.js Server Components (like database queries) creates new object
  // references on every revalidation. We must shallow compare the fields to avoid O(N) re-renders.
  if (prevProps.onToggle !== nextProps.onToggle) return false;
  if (prevProps.onClick !== nextProps.onClick) return false;

  const prevTask = prevProps.task;
  const nextTask = nextProps.task;

  // Since tasks have many fields, checking a few key fields that drive the UI in the list is sufficient.
  // If we need to be strictly correct, we could check all fields or the ones used in render:
  return (
    prevTask.id === nextTask.id &&
    prevTask.name === nextTask.name &&
    prevTask.isCompleted === nextTask.isCompleted &&
    prevTask.date === nextTask.date &&
    prevTask.priority === nextTask.priority &&
    prevTask.recurrenceInterval === nextTask.recurrenceInterval
  );
});
