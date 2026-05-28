'use client';

import * as React from 'react';
import { TaskItem } from './task-item';
import { AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useState, useMemo, useOptimistic, startTransition } from 'react';
import { toggleTaskCompletion } from '@/actions/recurrence';
import { Input } from '@/components/ui/input';

const TaskDetailSheet = dynamic(() => import('./task-detail-sheet').then(mod => mod.TaskDetailSheet), {
  ssr: false,
});
import { Button } from '@/components/ui/button';
import { createTask } from '@/actions/tasks';
import { Plus, Loader2, CheckCircle2, ListTodo } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label as LabelUI } from '@/components/ui/label';
import { Task, Label } from '@/lib/types';
import { toast } from 'sonner';

interface TaskListProps {
  tasks: Task[];
  title?: string;
  labels: Label[];
}

// ⚡ Bolt: Extracted CreateTaskForm to isolate state and prevent the entire TaskList from re-rendering on every keystroke
function CreateTaskForm() {
  const [newTaskName, setNewTaskName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTaskName.trim() || isSubmitting) return;

      setIsSubmitting(true);
      try {
        await createTask({ name: newTaskName });
        setNewTaskName('');
        toast.success("Task created successfully");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create task");
      } finally {
        setIsSubmitting(false);
      }
  };

  return (
    <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <Input
          placeholder="Add a new task... (Press Enter to save)"
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          className="flex-1"
          aria-label="New task name"
          disabled={isSubmitting}
        />
        <Button type="submit" size="icon" disabled={!newTaskName.trim() || isSubmitting} aria-label="Add task">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
        </Button>
    </form>
  );
}

export function TaskList({ tasks, title, labels }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    tasks,
    (state: Task[], { id, isCompleted }: { id: number, isCompleted: boolean }) =>
      state.map(task => task.id === id ? { ...task, isCompleted } : task)
  );

  const filteredTasks = useMemo(
    () => optimisticTasks.filter(task => showCompleted || !task.isCompleted),
    [optimisticTasks, showCompleted]
  );

  const handleToggle = React.useCallback((id: number, checked: boolean) => {
    startTransition(async () => {
        setOptimisticTasks({ id, isCompleted: checked });
        try {
            await toggleTaskCompletion(id, checked);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to update task status");
        }
    });
  }, [setOptimisticTasks]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
          {title && <h1 className="text-3xl font-bold">{title}</h1>}
          <div className="flex items-center space-x-2">
            <Checkbox
                id="show-completed"
                checked={showCompleted}
                onCheckedChange={(checked) => setShowCompleted(checked as boolean)}
            />
            <LabelUI htmlFor="show-completed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Show Completed
            </LabelUI>
          </div>
      </div>

      <CreateTaskForm />

      <div className="space-y-1">
        <AnimatePresence>
          {filteredTasks.map((task) => (
            <TaskItem
                key={task.id}
                task={task}
                onToggle={handleToggle}
                onClick={setSelectedTask}
            />
          ))}
        </AnimatePresence>
        {filteredTasks.length === 0 && (
            <div className="text-center py-16 px-4 border-2 border-dashed rounded-lg bg-muted/30">
                {tasks.length > 0 ? (
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <CheckCircle2 className="w-8 h-8 text-primary" aria-hidden="true" />
                        </div>
                        <h2 className="font-semibold text-lg">You&apos;re all caught up!</h2>
                        <p className="text-sm text-muted-foreground max-w-sm">No open tasks remaining. Enjoy your free time or add a new task above.</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="bg-muted p-3 rounded-full">
                            <ListTodo className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
                        </div>
                        <h2 className="font-semibold text-lg">Nothing to do yet</h2>
                        <p className="text-sm text-muted-foreground max-w-sm">Create your first task using the input above to get started.</p>
                    </div>
                )}
            </div>
        )}
      </div>

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        labels={labels}
      />
    </div>
  );
}
