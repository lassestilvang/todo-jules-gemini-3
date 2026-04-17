import { getTasksByListId } from '@/actions/tasks';
import { getListById } from '@/actions/lists';
import { getLabels } from '@/actions/labels';
import { TaskList } from '@/components/tasks/task-list';

export default async function ListPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const listId = parseInt(id);

  const tasks = await getTasksByListId(listId);
  const list = await getListById(listId);
  const labels = await getLabels();

  return <TaskList tasks={tasks} title={list?.name || 'List'} labels={labels} />;
}
