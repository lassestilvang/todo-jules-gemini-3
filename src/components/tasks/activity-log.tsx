'use client';

import * as React from 'react';
import { getLogs } from '@/actions/logs';
import { format } from 'date-fns';
import { ActivityLogEntry } from '@/lib/types';

interface ActivityLogProps {
  taskId: number;
}

export function ActivityLog({ taskId }: ActivityLogProps) {
  const [logs, setLogs] = React.useState<ActivityLogEntry[]>([]);

  React.useEffect(() => {
    getLogs(taskId).then(setLogs);
  }, [taskId]);

  return (
    <div className="space-y-4 mt-4">
      {logs.length === 0 && <p className="text-sm text-muted-foreground">No activity recorded.</p>}
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
