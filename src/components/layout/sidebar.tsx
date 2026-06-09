'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Inbox,
  CalendarDays,
  CalendarRange,
  Calendar,
  Layers,
  List as ListIcon,
  Tag
} from 'lucide-react';
import { SearchCommand } from '@/components/search-command';
import { CreateListDialog } from './create-list-dialog';
import { CreateLabelDialog } from './create-label-dialog';
import { SidebarLinks } from './sidebar-links';
import { List, Label } from '@/lib/types';

// ⚡ Bolt: Memoize individual list items so that navigating to a different list only
// re-renders the newly active and previously active items, instead of the entire O(N) array.
const SidebarListItem = React.memo(({ list, isActive }: { list: List, isActive: boolean }) => (
  <Button
    variant={isActive ? 'secondary' : 'ghost'}
    className="w-full justify-start"
    asChild
  >
    {/* Disable prefetch to prevent unnecessary background requests for all list links */}
    <Link href={'/lists/' + list.id} aria-current={isActive ? 'page' : undefined} prefetch={false} title={list.name}>
      <ListIcon className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="truncate min-w-0">{list.name}</span>
    </Link>
  </Button>
), (prevProps, nextProps) => {
  return prevProps.isActive === nextProps.isActive &&
         prevProps.list.id === nextProps.list.id &&
         prevProps.list.name === nextProps.list.name;
});
SidebarListItem.displayName = 'SidebarListItem';

// ⚡ Bolt: Memoize the entire labels list to prevent re-rendering when navigating between routes.
const SidebarLabels = React.memo(({ labels }: { labels: Label[] }) => {
  return (
    <>
      {labels.map((label) => (
        <Button
          key={label.id}
          variant="ghost"
          className="w-full justify-start"
          title={label.name}
        >
          <Tag className="mr-2 h-4 w-4 shrink-0" style={{ color: label.color || '#000000' }} aria-hidden="true" />
          <span className="truncate">{label.name}</span>
        </Button>
      ))}
    </>
  );
}, (prevProps, nextProps) => {
  if (prevProps.labels.length !== nextProps.labels.length) return false;
  return prevProps.labels.every((l, i) =>
    l.id === nextProps.labels[i].id &&
    l.name === nextProps.labels[i].name &&
    l.color === nextProps.labels[i].color
  );
});
SidebarLabels.displayName = 'SidebarLabels';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    lists: List[];
    labels: Label[];
}

export function Sidebar({ className, lists, labels }: SidebarProps) {
  const pathname = usePathname();

  const staticLinks = [
    { name: 'Inbox', href: '/', icon: Inbox },
    { name: 'Today', href: '/today', icon: CalendarDays },
    { name: 'Next 7 Days', href: '/next-7-days', icon: CalendarRange },
    { name: 'Upcoming', href: '/upcoming', icon: Calendar },
    { name: 'All Tasks', href: '/all', icon: Layers },
  ];

  return (
    <div className={cn('pb-12 w-64 border-r min-h-screen bg-background', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="px-4 mb-4">
             <SearchCommand />
          </div>
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Planner
          </h2>
          <div className="space-y-1">
            <SidebarLinks links={staticLinks} />
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Lists
          </h2>
          <div className="space-y-1">
             {lists.map((list) => {
               const isActive = pathname === `/lists/${list.id}`;
               return (
                 <Button
                  key={list.id}
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start hover:bg-muted/50"
                  asChild
                >
                  {/* Disable prefetch to prevent unnecessary background requests for all list links */}
                  <Link href={'/lists/' + list.id} aria-current={isActive ? 'page' : undefined} prefetch={false} title={list.name}>
                    <ListIcon className="mr-2 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate min-w-0">{list.name}</span>
                  </Link>
                </Button>
               );
             })}
             <CreateListDialog />
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Labels
          </h2>
          <div className="space-y-1">
             {labels.map((label) => (
               <Button
                key={label.id}
                variant="ghost"
                className="w-full justify-start hover:bg-muted/50"
                title={label.name}
               >
                  <Tag className="mr-2 h-4 w-4 shrink-0" style={{ color: label.color || '#000000' }} aria-hidden="true" />
                  <span className="truncate">{label.name}</span>
               </Button>
             ))}
             <CreateLabelDialog />
          </div>
        </div>
      </div>
    </div>
  );
}
