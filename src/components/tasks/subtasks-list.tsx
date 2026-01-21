'use client';

import * as React from 'react';
import { getSubtasks, createSubtask } from '@/actions/subtasks';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { updateTask } from '@/actions/tasks';
import { cn } from '@/lib/utils';
import { Task } from '@/lib/types';

interface SubtasksListProps {
  taskId: number;
}

export function SubtasksList({ taskId }: SubtasksListProps) {
  const [subtasks, setSubtasks] = React.useState<Task[]>([]);
  const [newSubtaskName, setNewSubtaskName] = React.useState('');

  const loadSubtasks = React.useCallback(async () => {
    const data = await getSubtasks(taskId);
    setSubtasks(data);
  }, [taskId]);

  React.useEffect(() => {
    loadSubtasks();
  }, [loadSubtasks]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskName.trim()) return;
    await createSubtask(taskId, newSubtaskName);
    setNewSubtaskName('');
    loadSubtasks();
  };

  const handleToggle = async (id: number, checked: boolean) => {
    await updateTask(id, { isCompleted: checked });
    setSubtasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: checked } : t));
  };

  return (
    <div className="space-y-2 mt-4">
      <h3 className="text-sm font-medium mb-2">Subtasks</h3>
      <div className="space-y-2">
        {subtasks.map(t => (
          <div key={t.id} className="flex items-center space-x-2 group">
            <Checkbox
              checked={!!t.isCompleted}
              onCheckedChange={(c) => handleToggle(t.id, c as boolean)}
            />
            <span className={cn("text-sm flex-1", t.isCompleted && "line-through text-muted-foreground")}>
              {t.name}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex items-center space-x-2 mt-2">
        <Input
          className="h-8 text-sm"
          placeholder="Add subtask..."
          value={newSubtaskName}
          onChange={(e) => setNewSubtaskName(e.target.value)}
        />
        <Button size="sm" variant="ghost" type="submit" disabled={!newSubtaskName}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
