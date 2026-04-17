import { getIncompleteTasks } from '@/actions/tasks';
import { getLabels } from '@/actions/labels';
import { TaskList } from '@/components/tasks/task-list';

export default async function HomePage() {
  const inboxTasks = await getIncompleteTasks();
  const labels = await getLabels();
  return <TaskList tasks={inboxTasks} title="Inbox" labels={labels} />;
}
