import { getTasks } from '@/actions/tasks';
import { TaskList } from '@/components/tasks/task-list';

export default async function HomePage() {
  const tasks = await getTasks();
  const inboxTasks = tasks.filter(t => !t.isCompleted);

  return <TaskList tasks={inboxTasks} title="Inbox" />;
}
