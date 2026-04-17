'use client';

import * as React from 'react';
import { getSubtasks, createSubtask } from '@/actions/subtasks';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { updateTask } from '@/actions/tasks';
import { cn } from '@/lib/utils';
import { Task } from '@/lib/types';

interface SubtasksListProps {
  taskId: number;
  initialSubtasks?: Task[] | null;
}

export function SubtasksList({ taskId, initialSubtasks = null }: SubtasksListProps) {
  const [subtasks, setSubtasks] = React.useState<Task[]>(initialSubtasks || []);
  const [newSubtaskName, setNewSubtaskName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const loadSubtasks = React.useCallback(async () => {
    const data = await getSubtasks(taskId);
    setSubtasks(data);
  }, [taskId]);

  React.useEffect(() => {
    if (initialSubtasks !== null) {
        setSubtasks(initialSubtasks);
    } else {
        loadSubtasks();
    }
  }, [taskId, initialSubtasks, loadSubtasks]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createSubtask(taskId, newSubtaskName);
      setNewSubtaskName('');
      loadSubtasks();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: number, checked: boolean) => {
    const task = subtasks.find(t => t.id === id);
    if (task) {
        await updateTask(id, { isCompleted: checked }, { isCompleted: task.isCompleted });
    } else {
        await updateTask(id, { isCompleted: checked });
    }
    setSubtasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: checked } : t));
  };

  return (
    <div className="space-y-2 mt-4">
      <h3 className="text-sm font-medium mb-2">Subtasks</h3>
      <div className="space-y-2">
        {subtasks.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No subtasks yet.</p>
        )}
        {subtasks.map(t => (
          <div key={t.id} className="flex items-center space-x-2 group">
            <Checkbox
              id={`subtask-${t.id}`}
              aria-label={`Mark subtask "${t.name}" as ${t.isCompleted ? 'incomplete' : 'complete'}`}
              checked={!!t.isCompleted}
              onCheckedChange={(c) => handleToggle(t.id, c as boolean)}
            />
            <label htmlFor={`subtask-${t.id}`} className={cn("text-sm flex-1 cursor-pointer", t.isCompleted && "line-through text-muted-foreground")}>
              {t.name}
            </label>
          </div>
        ))}
      </div>

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
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
