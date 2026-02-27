import { getTasksByDateRange } from '@/actions/tasks';
import { getLabels } from '@/actions/labels';
import { TaskList } from '@/components/tasks/task-list';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function TodayPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [tasks, labels] = await Promise.all([getTasksByDateRange(today, today), getLabels()]);

  return <TaskList tasks={tasks} title="Today" labels={labels} />;
}
