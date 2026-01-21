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
import { List, Label } from '@/lib/types';

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
            {staticLinks.map((link) => (
              <Button
                key={link.href}
                variant={pathname === link.href ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                asChild
              >
                <Link href={link.href}>
                  <link.icon className="mr-2 h-4 w-4" />
                  {link.name}
                </Link>
              </Button>
            ))}
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Lists
          </h2>
          <div className="space-y-1">
             {lists.map((list) => (
               <Button
                key={list.id}
                variant={pathname === `/lists/${list.id}` ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                asChild
              >
                <Link href={`/lists/${list.id}`}>
                  <ListIcon className="mr-2 h-4 w-4" />
                  {list.name}
                </Link>
              </Button>
             ))}
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
                className="w-full justify-start"
               >
                  <Tag className="mr-2 h-4 w-4" style={{ color: label.color || '#000000' }} />
                  {label.name}
               </Button>
             ))}
             <CreateLabelDialog />
          </div>
        </div>
      </div>
    </div>
  );
}
