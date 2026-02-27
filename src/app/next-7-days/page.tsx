import { getTasksByDateRange } from '@/actions/tasks';
import { getLabels } from '@/actions/labels';
import { TaskList } from '@/components/tasks/task-list';
import { addDays, format } from 'date-fns';

export default async function Next7DaysPage() {
  const today = new Date();
  const next7Days = addDays(today, 7);

  // Normalize dates for comparison (ignore time)
  const todayStr = format(today, 'yyyy-MM-dd');
  const next7DaysStr = format(next7Days, 'yyyy-MM-dd');

  const [tasks, labels] = await Promise.all([getTasksByDateRange(todayStr, next7DaysStr), getLabels()]);

  return <TaskList tasks={tasks} title="Next 7 Days" labels={labels} />;
}
