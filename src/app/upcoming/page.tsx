import { getTasks } from '@/actions/tasks';
import { TaskList } from '@/components/tasks/task-list';

export default async function UpcomingPage() {
  const allTasks = await getTasks();
  const tasks = allTasks.filter(t => t.date && new Date(t.date) > new Date());
  return <TaskList tasks={tasks} title="Upcoming" />;
}
