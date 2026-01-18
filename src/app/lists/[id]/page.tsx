import { getTasks } from '@/actions/tasks';
import { getLists } from '@/actions/lists';
import { TaskList } from '@/components/tasks/task-list';

export default async function ListPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const listId = parseInt(id);

  const allTasks = await getTasks();
  const tasks = allTasks.filter(t => t.listId === listId);

  const allLists = await getLists();
  const list = allLists.find(l => l.id === listId);

  return <TaskList tasks={tasks} title={list?.name || 'List'} />;
}
