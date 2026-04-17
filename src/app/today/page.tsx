import { getTasksForDate } from '@/actions/tasks';
import { getLabels } from '@/actions/labels';
import { TaskList } from '@/components/tasks/task-list';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function TodayPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const tasks = await getTasksForDate(today);
  const labels = await getLabels();

  return <TaskList tasks={tasks} title="Today" labels={labels} />;
}
