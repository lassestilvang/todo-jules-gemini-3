'use client';

import * as React from 'react';
import { TaskItem } from './task-item';
import { AnimatePresence } from 'framer-motion';
import { TaskDetailSheet } from './task-detail-sheet';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createTask } from '@/actions/tasks';
import { Plus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Task } from '@/lib/types';

interface TaskListProps {
  tasks: Task[];
  title?: string;
}

export function TaskList({ tasks, title }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTaskName.trim()) return;
      await createTask({ name: newTaskName });
      setNewTaskName('');
  };

  const filteredTasks = tasks.filter(task => showCompleted || !task.isCompleted);

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
            <Label htmlFor="show-completed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Show Completed
            </Label>
          </div>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
          <Input
            placeholder="Add a new task..."
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon">
              <Plus className="h-4 w-4" />
          </Button>
      </form>

      <div className="space-y-1">
        <AnimatePresence>
          {filteredTasks.map((task) => (
            <TaskItem
                key={task.id}
                task={task}
                onClick={setSelectedTask}
            />
          ))}
        </AnimatePresence>
        {filteredTasks.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
                {tasks.length > 0 ? "No open tasks. Nice work!" : "No tasks found."}
            </div>
        )}
      </div>

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
    </div>
  );
}
