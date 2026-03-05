import { getTasks } from '@/actions/tasks';
import { getLabels } from '@/actions/labels';
import { TaskList } from '@/components/tasks/task-list';

export default async function AllTasksPage() {
  const [tasks, labels] = await Promise.all([getTasks(), getLabels()]);
  return <TaskList tasks={tasks} title="All Tasks" labels={labels} />;
}
