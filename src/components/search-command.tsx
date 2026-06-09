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
import { Circle, CheckCircle, Search } from 'lucide-react';
import { Task } from '@/lib/types';
import { useDebounce } from '@/lib/hooks';

export function SearchCommand() {
  const [open, _setOpen] = React.useState(false);
  const [hasMounted, setHasMounted] = React.useState(false);
  const setOpen = React.useCallback((val: boolean | ((prev: boolean) => boolean)) => {
    _setOpen((prev) => {
      const next = typeof val === 'function' ? val(prev) : val;
      if (next) setHasMounted(true);
      return next;
    });
  }, []);
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Task[]>([]);
  const debouncedQuery = useDebounce(query, 300);

  // ⚡ Bolt: Local cache to prevent redundant network requests during typos/backspacing
  const cacheRef = React.useRef<Map<string, Task[]>>(new Map());
  const CACHE_MAX_SIZE = 50;

  React.useEffect(() => {
    if (open && !hasMounted) {
      setHasMounted(true);
    }
  }, [open, hasMounted]);

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
    let isCancelled = false;

    if (!open) {
      if (debouncedQuery.length > 0) {
        setResults([]);
      }
      // Invalidate cache when dialog closes to prevent stale data on next open
      cacheRef.current.clear();
      return () => {
        isCancelled = true;
      };
    }

    if (debouncedQuery.length === 0) {
      setResults([]);
      return () => {
        isCancelled = true;
      };
    }

    const fetchResults = async () => {
      const trimmedQuery = debouncedQuery.trim();

      // ⚡ Bolt: Check in-memory cache first
      if (cacheRef.current.has(trimmedQuery)) {
          if (!isCancelled) setResults(cacheRef.current.get(trimmedQuery)!);
          return;
      }

      const data = await searchTasks(trimmedQuery);
      if (!isCancelled) {
        // Enforce max cache size
        if (cacheRef.current.size >= CACHE_MAX_SIZE) {
          const oldestKey = cacheRef.current.keys().next().value;
          if (oldestKey !== undefined) cacheRef.current.delete(oldestKey);
        }
        cacheRef.current.set(trimmedQuery, data);
        setResults(data);
      }
    };
    fetchResults();

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery, open]);

  return (
    <>
        <button type="button" aria-label="Search tasks (Command K)" aria-haspopup="dialog" aria-expanded={open} className="flex w-full max-w-sm items-center text-muted-foreground text-sm border px-3 py-1.5 rounded-md cursor-pointer hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors" onClick={() => setOpen(true)}>
            <Search className="h-4 w-4 mr-2 shrink-0 opacity-50" aria-hidden="true" />
            <span className="flex-1 text-left">Search tasks...</span>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 ml-auto">
                <span className="text-xs">⌘</span>K
            </kbd>
        </button>

      {/* ⚡ Bolt: Conditionally render the heavy cmdk dialog to prevent it from being fetched and parsed on initial page load, improving TTI */}
      {hasMounted && (
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput
            placeholder="Type to search tasks..."
            value={query}
            onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center space-y-2 p-4 bg-muted/30 border border-dashed rounded-md m-2">
              <Search className="h-6 w-6 text-muted-foreground opacity-50" aria-hidden="true" />
              {query.trim().length === 0 || debouncedQuery.trim().length === 0 ? (
                <p className="text-sm text-muted-foreground">Search tasks...<br/><span className="text-xs">Type a keyword to find tasks.</span></p>
              ) : (
                <p className="text-sm text-muted-foreground">No tasks found.<br/><span className="text-xs">Try searching for a different keyword.</span></p>
              )}
            </div>
          </CommandEmpty>
          {results.length > 0 && (
              <CommandGroup heading="Tasks">
                {results.map((task) => (
                  <CommandItem
                    key={task.id}
                    onSelect={() => {
                      setOpen(false);
                    }}
                    title={task.name}
                  >
                    {task.isCompleted ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="sr-only">Completed</span>
                      </>
                    ) : (
                      <>
                        <Circle className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="sr-only">Incomplete</span>
                      </>
                    )}
                    <span className="truncate min-w-0">{task.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>
      )}
    </>
  );
}
