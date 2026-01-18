import { getTasks } from '@/actions/tasks';
import { TaskList } from '@/components/tasks/task-list';

export default async function AllTasksPage() {
  const tasks = await getTasks();
  return <TaskList tasks={tasks} title="All Tasks" />;
}
