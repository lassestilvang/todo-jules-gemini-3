import { getTasks } from '@/actions/tasks';
import { TaskList } from '@/components/tasks/task-list';
import { addDays, format } from 'date-fns';

export default async function Next7DaysPage() {
  const allTasks = await getTasks();
  const today = new Date();
  const next7Days = addDays(today, 7);

  // Normalize dates for comparison (ignore time)
  const todayStr = format(today, 'yyyy-MM-dd');
  const next7DaysStr = format(next7Days, 'yyyy-MM-dd');

  const tasks = allTasks.filter(t => {
      if (!t.date) return false;
      return t.date >= todayStr && t.date <= next7DaysStr;
  });

  return <TaskList tasks={tasks} title="Next 7 Days" />;
}
