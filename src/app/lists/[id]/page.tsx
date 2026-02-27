import { getTasks } from '@/actions/tasks';
import { getLists } from '@/actions/lists';
import { getLabels } from '@/actions/labels';
import { Task, List } from '@/lib/types';
import { TaskList } from '@/components/tasks/task-list';

export default async function ListPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const listId = parseInt(id);

  const [allTasks, allLists, labels] = await Promise.all([getTasks(), getLists(), getLabels()]);
  const tasks = allTasks.filter((t: Task) => t.listId === listId);
  const list = allLists.find((l: List) => l.id === listId);

  return <TaskList tasks={tasks} title={list?.name || 'List'} labels={labels} />;
}
