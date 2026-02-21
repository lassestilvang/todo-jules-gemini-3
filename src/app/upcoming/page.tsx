import { getTasksAfterDate } from '@/actions/tasks';
import { TaskList } from '@/components/tasks/task-list';
import { format } from 'date-fns';

export default async function UpcomingPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const tasks = await getTasksAfterDate(today);
  return <TaskList tasks={tasks} title="Upcoming" />;
}
