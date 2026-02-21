import { getUpcomingTasks } from '@/actions/tasks';
import { TaskList } from '@/components/tasks/task-list';

export default async function UpcomingPage() {
  const tasks = await getUpcomingTasks();
  return <TaskList tasks={tasks} title="Upcoming" />;
}
