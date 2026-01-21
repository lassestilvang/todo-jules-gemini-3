'use client';

import * as React from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { searchTasks } from '@/actions/search';
import { Circle, CheckCircle } from 'lucide-react';
import { Task } from '@/lib/types';

export function SearchCommand() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Task[]>([]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  React.useEffect(() => {
    if (query.length === 0) {
        setResults([]);
        return;
    }
    const timer = setTimeout(async () => {
        const data = await searchTasks(query);
        setResults(data);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <>
        <div className="flex w-full max-w-sm items-center space-x-2 text-muted-foreground text-sm border px-3 py-1 rounded-md cursor-pointer hover:bg-muted" onClick={() => setOpen(true)}>
            <span>Search tasks...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
            </kbd>
        </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
            placeholder="Type to search tasks..."
            value={query}
            onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {results.length > 0 && (
              <CommandGroup heading="Tasks">
                {results.map((task) => (
                  <CommandItem
                    key={task.id}
                    onSelect={() => {
                      setOpen(false);
                    }}
                  >
                    {task.isCompleted ? <CheckCircle className="mr-2 h-4 w-4" /> : <Circle className="mr-2 h-4 w-4" />}
                    <span>{task.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
