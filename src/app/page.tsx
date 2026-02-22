import { getTasks } from '@/actions/tasks';
import { Task } from '@/lib/types';
import { TaskList } from '@/components/tasks/task-list';

export default async function HomePage() {
  const tasks = await getTasks();
  const inboxTasks = tasks.filter((t: Task) => !t.isCompleted);

  return <TaskList tasks={inboxTasks} title="Inbox" />;
}
