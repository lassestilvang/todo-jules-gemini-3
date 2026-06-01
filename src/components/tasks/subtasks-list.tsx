'use client';

import * as React from 'react';
import { getSubtasks, createSubtask } from '@/actions/subtasks';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, ListTodo } from 'lucide-react';
import { updateTask } from '@/actions/tasks';
import { cn } from '@/lib/utils';
import { Task } from '@/lib/types';
import { toast } from 'sonner';

interface SubtasksListProps {
  taskId: number;
  initialSubtasks?: Task[] | null;
}

// ⚡ Bolt: Extracted CreateSubtaskForm to isolate state and prevent the entire SubtasksList from re-rendering on every keystroke
function CreateSubtaskForm({ taskId, onCreated }: { taskId: number; onCreated: (task: Task) => void }) {
  const [newSubtaskName, setNewSubtaskName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newTask = await createSubtask(taskId, newSubtaskName);
      setNewSubtaskName('');
      // ⚡ Bolt: Eliminate redundant network request by passing the server response directly to state
      onCreated(newTask);
      toast.success("Subtask created successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (typeof error === 'string' ? error : "Failed to create subtask"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleAdd} className="flex items-center space-x-2 mt-2">
      <Input
        className="h-8 text-sm"
        placeholder="Add subtask..."
        value={newSubtaskName}
        onChange={(e) => setNewSubtaskName(e.target.value)}
        aria-label="New subtask name"
        disabled={isSubmitting}
      />
      <Button size="sm" variant="ghost" type="submit" disabled={!newSubtaskName.trim() || isSubmitting} aria-label="Add subtask">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
      </Button>
    </form>
  );
}

// ⚡ Bolt: Extracted and memoized SubtaskItem to prevent O(N) re-renders when toggling a single subtask
const SubtaskItem = React.memo(({ task, onToggle }: { task: Task, onToggle: (id: number, checked: boolean) => void }) => {
  return (
    <div className="flex items-center space-x-2 group">
      <Checkbox
        id={`subtask-${task.id}`}
        aria-label={`Mark subtask "${task.name}" as ${task.isCompleted ? 'incomplete' : 'complete'}`}
        checked={!!task.isCompleted}
        onCheckedChange={(c) => onToggle(task.id, c as boolean)}
      />
      <label htmlFor={`subtask-${task.id}`} className={cn("text-sm flex-1 cursor-pointer", task.isCompleted && "line-through text-muted-foreground")}>
        {task.name}
      </label>
    </div>
  );
}, (prevProps, nextProps) => {
  // ⚡ Bolt: Implement custom shallow equality comparator to prevent O(N) re-renders.
  // Data fetched from Next.js Server Components creates new object references on every revalidation.
  if (prevProps.onToggle !== nextProps.onToggle) return false;

  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.name === nextProps.task.name &&
    prevProps.task.isCompleted === nextProps.task.isCompleted
  );
});

SubtaskItem.displayName = 'SubtaskItem';

export function SubtasksList({ taskId, initialSubtasks }: SubtasksListProps) {
  const [subtasks, setSubtasks] = React.useState<Task[]>(initialSubtasks || []);

  const loadSubtasks = React.useCallback(async () => {
    const data = await getSubtasks(taskId);
    setSubtasks(data);
  }, [taskId]);

  React.useEffect(() => {
    if (initialSubtasks === undefined) {
        loadSubtasks();
    } else if (initialSubtasks !== null) {
        setSubtasks(initialSubtasks);
    }
  }, [taskId, initialSubtasks, loadSubtasks]);

  // ⚡ Bolt: Memoized handleToggle with useCallback to provide a stable reference to SubtaskItem children
  const handleToggle = React.useCallback(async (id: number, checked: boolean) => {
    // Optimistic update
    setSubtasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: checked } : t));

    // Server action
    await updateTask(id, { isCompleted: checked });
  }, []);

  return (
    <div className="space-y-2 mt-4">
      <h3 className="text-sm font-medium mb-2">Subtasks</h3>
      <div className="space-y-2">
        {subtasks.length === 0 && (
          <div className="flex flex-col items-center justify-center p-4 bg-muted/30 border border-dashed rounded-md text-center space-y-2">
            <ListTodo className="w-6 h-6 text-muted-foreground opacity-50" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No subtasks yet.<br/><span className="text-xs">Break this task down into smaller steps.</span></p>
          </div>
        )}
        {subtasks.map(t => (
          <SubtaskItem key={t.id} task={t} onToggle={handleToggle} />
        ))}
      </div>

      <CreateSubtaskForm taskId={taskId} onCreated={(newTask) => setSubtasks(prev => [...(prev || []), newTask])} />
    </div>
  );
}
