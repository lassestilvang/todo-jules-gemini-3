import { getIncompleteTasks } from '@/actions/tasks';
import { TaskList } from '@/components/tasks/task-list';

export default async function HomePage() {
  const inboxTasks = await getIncompleteTasks();

  return <TaskList tasks={inboxTasks} title="Inbox" />;
}
