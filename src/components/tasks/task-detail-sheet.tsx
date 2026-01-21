'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { updateTask, getTaskLabels, toggleTaskLabel } from '@/actions/tasks';
import { getLabels } from '@/actions/labels';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Repeat, Plus, Check } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SubtasksList } from './subtasks-list';
import { AttachmentsList } from './attachments-list';
import { ActivityLog } from './activity-log';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useState, useEffect } from 'react';
import { Task, Label as LabelType } from '@/lib/types';

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailSheet({ task, open, onOpenChange }: TaskDetailSheetProps) {
  const [labels, setLabels] = useState<LabelType[]>([]);
  const [assignedLabels, setAssignedLabels] = useState<LabelType[]>([]);

  useEffect(() => {
    if (open && task) {
        getLabels().then(setLabels);
        getTaskLabels(task.id).then(setAssignedLabels);
    }
  }, [open, task]);

  if (!task) return null;

  const handleUpdate = async (data: Partial<Task>) => {
      await updateTask(task.id, data);
  };

  const handleToggleLabel = async (labelId: number) => {
    const isAssigned = assignedLabels.some(l => l.id === labelId);
    await toggleTaskLabel(task.id, labelId, !isAssigned);
    if (isAssigned) {
        setAssignedLabels(prev => prev.filter(l => l.id !== labelId));
    } else {
        const label = labels.find(l => l.id === labelId);
        if (label) setAssignedLabels(prev => [...prev, label]);
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
                                                const isAssigned = assignedLabels.some(l => l.id === label.id);
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
                    <SubtasksList taskId={task.id} />
                </div>

                <div className="grid gap-2">
                    <AttachmentsList taskId={task.id} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Priority</Label>
                        <Select defaultValue={task.priority || 'none'} onValueChange={(val) => handleUpdate({ priority: val as Task['priority'] })}>
                            <SelectTrigger>
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
                        <Label>Recurrence</Label>
                        <Select defaultValue={task.recurrenceInterval || 'none'} onValueChange={(val) => handleUpdate({ recurrenceInterval: val === 'none' ? null : val })}>
                            <SelectTrigger>
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

                </div>
            </TabsContent>

            <TabsContent value="history">
                <ActivityLog taskId={task.id} />
            </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
