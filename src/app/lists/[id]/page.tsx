import { getTasksByListId } from '@/actions/tasks';
import { getListById } from '@/actions/lists';
import { TaskList } from '@/components/tasks/task-list';

export default async function ListPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const listId = parseInt(id);

  const [tasks, list] = await Promise.all([
    getTasksByListId(listId),
    getListById(listId),
  ]);

  return <TaskList tasks={tasks} title={list?.name || 'List'} />;
}
