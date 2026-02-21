import { getTasksByDateRange } from '@/actions/tasks';
import { TaskList } from '@/components/tasks/task-list';
import { format } from 'date-fns';

export default async function TodayPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const tasks = await getTasksByDateRange(today, today);

  return <TaskList tasks={tasks} title="Today" />;
}
