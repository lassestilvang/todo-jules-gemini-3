import { getTasks, getTasksByListId } from '@/actions/tasks';
import { getLists, getListById } from '@/actions/lists';
import { Task, List } from '@/lib/types';
import { TaskList } from '@/components/tasks/task-list';

export default async function ListPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const listId = parseInt(id);

  const allTasks = await getTasks();
  const tasks = allTasks.filter((t: Task) => t.listId === listId);

  const allLists = await getLists();
  const list = allLists.find((l: List) => l.id === listId);

  return <TaskList tasks={tasks} title={list?.name || 'List'} />;
}
