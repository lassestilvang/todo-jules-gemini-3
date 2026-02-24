import { getUpcomingTasks } from '@/actions/tasks';
import { TaskList } from '@/components/tasks/task-list';
import { getTasks } from '@/actions/tasks';
import { Task } from '@/lib/types';

export default async function UpcomingPage() {
  const allTasks = await getTasks();
  const tasks = allTasks.filter((t: Task) => t.date && new Date(t.date) > new Date());
  return <TaskList tasks={tasks} title="Upcoming" />;
}
