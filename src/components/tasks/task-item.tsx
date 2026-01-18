'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { AlertCircle, Calendar, Repeat } from 'lucide-react';
import { toggleTaskCompletion } from '@/actions/recurrence';

interface TaskItemProps {
  task: any;
  onToggle?: (id: number, checked: boolean) => void;
  onClick: (task: any) => void;
}

export function TaskItem({ task, onToggle, onClick }: TaskItemProps) {
  const isOverdue = task.date && new Date(task.date) < new Date() && !task.isCompleted;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center space-x-4 p-4 border rounded-lg mb-2 bg-card hover:bg-accent/50 transition-colors cursor-pointer group",
        task.isCompleted && "opacity-50"
      )}
      onClick={() => onClick(task)}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={task.isCompleted}
          onCheckedChange={async (checked) => {
             if (onToggle) onToggle(task.id, checked as boolean);
             else await toggleTaskCompletion(task.id, checked as boolean);
          }}
        />
      </div>

      <div className="flex-1 space-y-1">
        <div className={cn("font-medium", task.isCompleted && "line-through decoration-muted-foreground")}>
          {task.name}
        </div>
        <div className="text-xs text-muted-foreground flex items-center space-x-2">
            {task.priority !== 'none' && (
                <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px] px-1 py-0 h-5">
                    {task.priority}
                </Badge>
            )}
            {task.date && (
                <span className={cn("flex items-center", isOverdue && "text-destructive font-bold")}>
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(new Date(task.date), 'MMM d')}
                </span>
            )}
            {task.recurrenceInterval && (
                <span className="flex items-center text-blue-500">
                    <Repeat className="w-3 h-3 mr-1" />
                    {task.recurrenceInterval}
                </span>
            )}
        </div>
      </div>
    </motion.div>
  );
}
