'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { updateTask, toggleTaskLabel, getTaskDetailedInfo, deleteTask } from '@/actions/tasks';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Repeat, Plus, Check, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SubtasksList } from './subtasks-list';
import { AttachmentsList } from './attachments-list';
import { ActivityLog } from './activity-log';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useState, useEffect, useMemo } from 'react';
import { Task, Label as LabelType, Attachment, ActivityLogEntry, ALLOWED_TASK_KEYS } from '@/lib/types';
import { toast } from 'sonner';

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: LabelType[];
}

export function TaskDetailSheet({ task, open, onOpenChange, labels }: TaskDetailSheetProps) {
  const [assignedLabels, setAssignedLabels] = useState<LabelType[]>([]);
  const [subtasks, setSubtasks] = useState<Task[] | null>(null);
  const [attachments, setAttachments] = useState<Attachment[] | null>(null);
  const [logs, setLogs] = useState<ActivityLogEntry[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const labelsMap = useMemo(() => new Map(labels.map(l => [l.id, l])), [labels]);
  const assignedLabelIds = useMemo(() => new Set(assignedLabels.map(l => l.id)), [assignedLabels]);

  useEffect(() => {
    if (task) {
        // Reset state for new task to avoid ghosting
        setAssignedLabels([]);
        setSubtasks(null);
        setAttachments(null);
        setLogs(null);

        getTaskDetailedInfo(task.id).then(data => {
            setAssignedLabels(data.assignedLabels);
            setSubtasks(data.subtasks);
            setAttachments(data.attachments);
            setLogs(data.logs);
        });
    }
  }, [task]);

  if (!task) return null;

  const handleUpdate = async (data: Partial<Task>) => {
      let hasChanges = false;
      const previousState: Partial<Task> = {};

      // ⚡ Bolt: Iterate over fixed array of keys instead of Object.keys() to reduce array allocations and improve speed
      for (const key of ALLOWED_TASK_KEYS) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((data as any)[key] !== undefined) {
              const currentValue = task[key as keyof Task];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const newValue = (data as any)[key];

              if (currentValue !== newValue) {
                  hasChanges = true;
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (previousState as any)[key] = currentValue;
          }
      }

      // ⚡ Bolt: Early return to prevent unnecessary Server Action calls, DB updates, and cache invalidations
      if (!hasChanges) return;

      await updateTask(task.id, data, previousState);
  };

  const handleToggleLabel = async (labelId: number) => {
    const isAssigned = assignedLabelIds.has(labelId);
    await toggleTaskLabel(task.id, labelId, !isAssigned);
    if (isAssigned) {
        setAssignedLabels(prev => prev.filter(l => l.id !== labelId));
    } else {
        const label = labelsMap.get(labelId);
        if (label) setAssignedLabels(prev => [...prev, label]);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
        setIsDeleting(true);
        try {
            await deleteTask(task.id);
            onOpenChange(false);
            toast.success("Task deleted successfully");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to delete task");
        } finally {
            setIsDeleting(false);
        }
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Task Details</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="details" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
                <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Task Name</Label>
                    <Input
                        id="name"
                        defaultValue={task.name}
                        onBlur={(e) => handleUpdate({ name: e.target.value })}
                    />
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        defaultValue={task.description || ''}
                        onBlur={(e) => handleUpdate({ description: e.target.value })}
                        className="min-h-[100px]"
                    />
                </div>

                <div className="grid gap-2">
                    <Label>Labels</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {assignedLabels.map(label => (
                            <Badge key={label.id} variant="outline" style={{ borderColor: label.color || undefined, color: label.color || undefined }}>
                                {label.name}
                            </Badge>
                        ))}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-6 border-dashed">
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add Label
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-[200px]" align="start">
                                <Command>
                                    <CommandInput placeholder="Search label..." />
                                    <CommandList>
                                        <CommandEmpty>No label found.</CommandEmpty>
                                        <CommandGroup>
                                            {labels.map(label => {
                                                const isAssigned = assignedLabelIds.has(label.id);
                                                return (
                                                    <CommandItem key={label.id} onSelect={() => handleToggleLabel(label.id)}>
                                                        <div className="flex items-center gap-2 w-full cursor-pointer">
                                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color || '#000' }} />
                                                            <span>{label.name}</span>
                                                            {isAssigned && <Check className="ml-auto w-4 h-4" />}
                                                        </div>
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                <div className="grid gap-2">
                    <SubtasksList taskId={task.id} initialSubtasks={subtasks} />
                </div>

                <div className="grid gap-2">
                    <AttachmentsList taskId={task.id} initialAttachments={attachments} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor={`priority-${task.id}`}>Priority</Label>
                        <Select defaultValue={task.priority || 'none'} onValueChange={(val) => handleUpdate({ priority: val as Task['priority'] })}>
                            <SelectTrigger id={`priority-${task.id}`}>
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`recurrence-${task.id}`}>Recurrence</Label>
                        <Select defaultValue={task.recurrenceInterval || 'none'} onValueChange={(val) => handleUpdate({ recurrenceInterval: val === 'none' ? null : val })}>
                            <SelectTrigger id={`recurrence-${task.id}`}>
                                <Repeat className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Repeat" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Never</SelectItem>
                                <SelectItem value="DAILY">Daily</SelectItem>
                                <SelectItem value="WEEKLY">Weekly</SelectItem>
                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                                <SelectItem value="YEARLY">Yearly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="grid gap-2">
                        <Label>Due Date</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !task.date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {task.date ? format(new Date(task.date), "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={task.date ? new Date(task.date) : undefined}
                                    onSelect={(date) => handleUpdate({ date: date ? format(date, 'yyyy-MM-dd') : null })}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid gap-2">
                        <Label>Deadline</Label>
                        <Input
                            type="datetime-local"
                            defaultValue={task.deadline ? task.deadline : ''}
                            onBlur={(e) => handleUpdate({ deadline: e.target.value || null })}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="estimate">Estimate (min)</Label>
                        <Input
                            id="estimate"
                            type="number"
                            defaultValue={task.estimate || undefined}
                            onBlur={(e) => handleUpdate({ estimate: parseInt(e.target.value) || null })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="actualTime">Actual (min)</Label>
                        <Input
                            id="actualTime"
                            type="number"
                            defaultValue={task.actualTime || undefined}
                            onBlur={(e) => handleUpdate({ actualTime: parseInt(e.target.value) || null })}
                        />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="reminders">Reminders</Label>
                    <Input
                        id="reminders"
                        placeholder="e.g. 10m before"
                        defaultValue={task.reminders || ''}
                        onBlur={(e) => handleUpdate({ reminders: e.target.value })}
                    />
                </div>

                <div className="pt-4 mt-4 border-t">
                    <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="w-full sm:w-auto">
                        {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete Task
                    </Button>
                </div>

                </div>
            </TabsContent>

            <TabsContent value="history">
                <ActivityLog taskId={task.id} initialLogs={logs} />
            </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
