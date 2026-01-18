'use client';

import * as React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { updateTask } from '@/actions/tasks';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SubtasksList } from './subtasks-list';
import { AttachmentsList } from './attachments-list';
import { ActivityLog } from './activity-log';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TaskDetailSheetProps {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailSheet({ task, open, onOpenChange }: TaskDetailSheetProps) {
  if (!task) return null;

  const handleUpdate = async (data: any) => {
      await updateTask(task.id, data);
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
                        defaultValue={task.description}
                        onBlur={(e) => handleUpdate({ description: e.target.value })}
                        className="min-h-[100px]"
                    />
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
                        <Select defaultValue={task.priority} onValueChange={(val) => handleUpdate({ priority: val })}>
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
