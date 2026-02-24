import { getTasksForDate } from '@/actions/tasks';
import { getTasks } from '@/actions/tasks';
import { Task } from '@/lib/types';
import { TaskList } from '@/components/tasks/task-list';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function TodayPage() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const tasks = await getTasksForDate(today);

  return <TaskList tasks={tasks} title="Today" />;
}
