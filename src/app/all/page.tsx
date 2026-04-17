import { getTasks } from '@/actions/tasks';
import { getLabels } from '@/actions/labels';
import { TaskList } from '@/components/tasks/task-list';

export default async function AllTasksPage() {
  const tasks = await getTasks();
  const labels = await getLabels();
  return <TaskList tasks={tasks} title="All Tasks" labels={labels} />;
}
