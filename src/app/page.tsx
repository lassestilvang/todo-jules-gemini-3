import { getTasks } from '@/actions/tasks';
import { getLabels } from '@/actions/labels';
import { Task } from '@/lib/types';
import { TaskList } from '@/components/tasks/task-list';

export default async function HomePage() {
  const [tasks, labels] = await Promise.all([getTasks(), getLabels()]);
  const inboxTasks = tasks.filter((t: Task) => !t.isCompleted);

  return <TaskList tasks={inboxTasks} title="Inbox" labels={labels} />;
}
