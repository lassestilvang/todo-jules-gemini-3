'use client';

import * as React from 'react';
import { getLogs } from '@/actions/logs';
import { format } from 'date-fns';
import { ActivityLogEntry } from '@/lib/types';
import { History } from 'lucide-react';

interface ActivityLogProps {
  taskId: number;
  initialLogs?: ActivityLogEntry[] | null;
}

export function ActivityLog({ taskId, initialLogs = null }: ActivityLogProps) {
  const [logs, setLogs] = React.useState<ActivityLogEntry[]>(initialLogs || []);
  const [loading, setLoading] = React.useState(!initialLogs);

  React.useEffect(() => {
    if (initialLogs !== null) {
        setLogs(initialLogs);
        setLoading(false);
    } else {
        setLoading(true);
        getLogs(taskId).then((data) => {
            setLogs(data);
            setLoading(false);
        });
    }
  }, [taskId, initialLogs]);

  if (loading) {
      return <div className="text-sm text-muted-foreground mt-4 animate-pulse">Loading activity...</div>;
  }

  return (
    <div className="space-y-4 mt-4">
      {logs.length === 0 && (
        <div className="flex flex-col items-center justify-center p-4 bg-muted/30 border border-dashed rounded-md text-center space-y-2">
          <History className="w-6 h-6 text-muted-foreground opacity-50" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No activity recorded yet.<br/><span className="text-xs">Changes to this task will appear here.</span></p>
        </div>
      )}
      {logs.map((log) => (
        <div key={log.id} className="text-sm border-b pb-2">
            <div className="font-medium capitalize">{log.field} changed</div>
            <div className="text-muted-foreground text-xs flex justify-between">
                <span>
                    <span className="line-through">{log.oldValue}</span> <span>→</span> <span className="text-foreground">{log.newValue}</span>
                </span>
                <span>{log.timestamp ? format(new Date(log.timestamp), 'MMM d, HH:mm') : ''}</span>
            </div>
        </div>
      ))}
    </div>
  );
}
