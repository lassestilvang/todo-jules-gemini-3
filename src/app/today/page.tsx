import { getTasks } from '@/actions/tasks';
import { TaskList } from '@/components/tasks/task-list';
import { format } from 'date-fns';

export default async function TodayPage() {
  const allTasks = await getTasks();
  const today = format(new Date(), 'yyyy-MM-dd');
  const tasks = allTasks.filter(t => t.date === today);

  return <TaskList tasks={tasks} title="Today" />;
}
